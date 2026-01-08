/**
 * CSS Killer Parser
 * Converts .style source into AST
 */

function parse(source) {
    const lines = source.split('\n');
    const ast = {
        tokens: {},      // colors, sizes, etc.
        components: {},  // reusable component definitions
        styles: {}       // element styles
    };

    let section = null;             // 'tokens', 'components', or 'styles'
    let currentTokenType = null;    // 'colors', 'sizes'
    let currentSelector = null;     // 'button', 'card', etc.
    let currentComponent = null;    // component being defined
    let currentNested = null;       // 'hover:', '@mobile:', etc.

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) continue;

        // Comments can switch sections
        if (trimmed.startsWith('#')) {
            const lower = trimmed.toLowerCase();
            if (lower.includes('component')) {
                section = 'components';
                currentTokenType = null;
                currentSelector = null;
            } else if (lower.includes('style')) {
                section = 'styles';
                currentTokenType = null;
                currentComponent = null;
            } else if (lower.includes('token')) {
                section = 'tokens';
                currentSelector = null;
                currentComponent = null;
            }
            continue;
        }

        // Calculate indentation
        const indent = line.search(/\S/);

        // Token definitions: colors:, sizes: (at root level)
        if (indent === 0 && /^(colors|sizes):$/.test(trimmed)) {
            section = 'tokens';
            currentTokenType = trimmed.replace(':', '');
            ast.tokens[currentTokenType] = {};
            currentSelector = null;
            currentComponent = null;
            continue;
        }

        // Component definition: component btn:, define btn:
        if (indent === 0 && /^(component|define)\s+[\w-]+:$/.test(trimmed)) {
            section = 'components';
            const match = trimmed.match(/^(?:component|define)\s+([\w-]+):$/);
            currentComponent = match[1];
            ast.components[currentComponent] = [];
            currentSelector = null;
            currentTokenType = null;
            currentNested = null;
            continue;
        }

        // Style selector: button:, card:, .card:, #header: (at root level)
        if (indent === 0 && /^[.#]?[\w-]+(\[[\w="'-]+\])?:$/.test(trimmed)) {
            section = 'styles';
            currentSelector = trimmed.replace(':', '');
            ast.styles[currentSelector] = { props: [], nested: {} };
            currentTokenType = null;
            currentComponent = null;
            currentNested = null;
            continue;
        }

        // Nested blocks: hover:, focus:, active:, @mobile:, @tablet: (indented)
        if (indent > 0 && /^(hover|active|focus|disabled|@mobile|@tablet|@laptop|@desktop):$/.test(trimmed)) {
            if (currentSelector) {
                currentNested = trimmed.replace(':', '');
                ast.styles[currentSelector].nested[currentNested] = [];
            }
            continue;
        }

        // Token value: primary #3b82f6 (indented under colors/sizes)
        if (section === 'tokens' && currentTokenType && indent > 0) {
            const match = trimmed.match(/^([\w-]+)\s+(.+)$/);
            if (match) {
                ast.tokens[currentTokenType][match[1]] = match[2];
            }
            continue;
        }

        // Component property (indented under component definition)
        if (section === 'components' && currentComponent && indent > 0) {
            ast.components[currentComponent].push(trimmed);
            continue;
        }

        // Style property (indented under selector)
        if (section === 'styles' && currentSelector && indent > 0) {
            if (currentNested) {
                ast.styles[currentSelector].nested[currentNested].push(trimmed);
            } else {
                ast.styles[currentSelector].props.push(trimmed);
            }
        }
    }

    return ast;
}

module.exports = { parse };
