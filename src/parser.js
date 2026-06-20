const NESTED_KEYS = '(?:hover|active|focus|disabled|visited|first-child|last-child|focus-within|focus-visible|placeholder|@mobile|@tablet|@laptop|@desktop|@wide|@dark|@light)';

function parse(source) {
    const lines = source.split('\n');
    const ast = {
        tokens: {},
        components: {},
        styles: {}
    };

    let section = null;
    let currentTokenType = null;
    let currentSelector = null;
    let currentComponent = null;
    let currentNested = null;
    let componentNested = null;

    function makeLoc(lineIndex, line) {
        return {
            line: lineIndex + 1,
            column: (line.match(/^\s*/) || [''])[0].length + 1
        };
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) continue;

        if (trimmed.startsWith('//')) continue;

        if (/^#\s/.test(trimmed)) {
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

        const indent = line.search(/\S/);

        if (indent === 0 && /^(colors|sizes):$/.test(trimmed)) {
            section = 'tokens';
            currentTokenType = trimmed.replace(':', '');
            ast.tokens[currentTokenType] = {};
            currentSelector = null;
            currentComponent = null;
            continue;
        }

        if (indent === 0 && /^(component|define)\s+[\w-]+:$/.test(trimmed)) {
            section = 'components';
            const match = trimmed.match(/^(?:component|define)\s+([\w-]+):$/);
            const componentName = match[1];
            if (ast.components[componentName]) {
                throw new ParseError(
                    `Component "${componentName}" is already defined (line ${ast.components[componentName].loc.line})`,
                    i + 1, 1
                );
            }
            currentComponent = componentName;
            ast.components[currentComponent] = { props: [], nested: {}, loc: makeLoc(i, line) };
            currentSelector = null;
            currentTokenType = null;
            currentNested = null;
            componentNested = null;
            continue;
        }

        const compoundAndGrouped = /^[.#]?[\w-]+(?:[.#][\w-]+|\[[\w="'-]+\])*(?:\s*,\s*[.#]?[\w-]+(?:[.#][\w-]+|\[[\w="'-]+\])*)*:$/;
        const simpleSelector = /^[.#]?[\w-]+(\[[\w="'-]+\])?:$/;

        if (indent === 0 && (simpleSelector.test(trimmed) || compoundAndGrouped.test(trimmed))) {
            section = 'styles';
            currentSelector = trimmed.replace(/:$/, '');
            ast.styles[currentSelector] = { props: [], nested: {}, loc: makeLoc(i, line) };
            currentTokenType = null;
            currentComponent = null;
            currentNested = null;
            continue;
        }

        if (indent === 0 && /^[.#]?[\w-]+(?:\.[\w-]+|#[\w-]+|\[[\w="'-]+\])*(?:\s*,\s*[.#]?[\w-]+(?:\.[\w-]+|#[\w-]+|\[[\w="'-]+\])*)*$/.test(trimmed) &&
            !trimmed.startsWith('component') && !trimmed.startsWith('define')) {
            throw new ParseError(
                `Missing colon after selector "${trimmed}". Did you mean "${trimmed}:"?`,
                i + 1, 1
            );
        }

        const nestedRegex = new RegExp(`^${NESTED_KEYS}:$`);
        if (indent > 0 && nestedRegex.test(trimmed)) {
            const nestedKey = trimmed.replace(':', '');
            if (currentSelector) {
                currentNested = nestedKey;
                if (!ast.styles[currentSelector].nested[currentNested]) {
                    ast.styles[currentSelector].nested[currentNested] = [];
                }
            } else if (currentComponent) {
                componentNested = nestedKey;
                if (!ast.components[currentComponent].nested[componentNested]) {
                    ast.components[currentComponent].nested[componentNested] = [];
                }
            }
            continue;
        }

        if (section === 'tokens' && currentTokenType && indent > 0) {
            const match = trimmed.match(/^([\w-]+)\s+(.+)$/);
            if (match) {
                ast.tokens[currentTokenType][match[1]] = match[2];
            }
            continue;
        }

        if (section === 'components' && currentComponent && indent > 0) {
            if (componentNested) {
                ast.components[currentComponent].nested[componentNested].push(trimmed);
            } else {
                ast.components[currentComponent].props.push(trimmed);
            }
            continue;
        }

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

class ParseError extends Error {
    constructor(message, line, column) {
        super(`${message} (line ${line}, col ${column})`);
        this.name = 'ParseError';
        this.line = line;
        this.column = column;
    }
}

module.exports = { parse, ParseError };
