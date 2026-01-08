/**
 * CSS Killer Compiler
 * Converts AST to CSS with component support
 */

const { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS, BREAKPOINTS } = require('./tokens');

// Built-in defaults merged with Tailwind tokens
const DEFAULTS = {
    colors: COLORS,
    sizes: SPACING,
    fontSize: FONT_SIZES,
    radius: RADIUS,
    shadows: SHADOWS,
    breakpoints: BREAKPOINTS
};

function compile(ast) {
    // Merge user tokens with defaults
    const tokens = {
        colors: { ...DEFAULTS.colors, ...ast.tokens?.colors },
        sizes: { ...DEFAULTS.sizes, ...ast.tokens?.sizes },
        fontSize: DEFAULTS.fontSize,
        radius: DEFAULTS.radius,
        shadows: DEFAULTS.shadows,
        breakpoints: DEFAULTS.breakpoints
    };

    // Store components for "use" resolution
    const components = ast.components || {};

    let css = '';

    // Process each style block
    for (const [selector, block] of Object.entries(ast.styles)) {
        const cssSelector = formatSelector(selector);

        // Expand "use" statements and get all props
        const expandedProps = expandProps(block.props, components);

        // Main styles
        const mainProps = expandedProps.map(p => compileProperty(p, tokens)).filter(Boolean);
        if (mainProps.length > 0) {
            css += `${cssSelector} {\n${mainProps.map(p => `  ${p}`).join('\n')}\n}\n\n`;
        }

        // Nested blocks (hover, media queries)
        for (const [nestedKey, nestedProps] of Object.entries(block.nested)) {
            const expandedNested = expandProps(nestedProps, components);
            const compiledProps = expandedNested.map(p => compileProperty(p, tokens)).filter(Boolean);
            if (compiledProps.length === 0) continue;

            if (nestedKey.startsWith('@')) {
                // Media query
                const breakpoint = nestedKey.replace('@', '');
                const maxWidth = tokens.breakpoints?.[breakpoint] || DEFAULTS.breakpoints[breakpoint];
                css += `@media (max-width: ${maxWidth}) {\n`;
                css += `  ${cssSelector} {\n${compiledProps.map(p => `    ${p}`).join('\n')}\n  }\n`;
                css += `}\n\n`;
            } else {
                // Pseudo-class (hover, active, focus, disabled)
                css += `${cssSelector}:${nestedKey} {\n${compiledProps.map(p => `  ${p}`).join('\n')}\n}\n\n`;
            }
        }
    }

    return css.trim() + '\n';
}

// Expand "use componentName" into actual props
function expandProps(props, components) {
    const result = [];
    for (const prop of props) {
        if (prop.startsWith('use ')) {
            const componentName = prop.slice(4).trim();
            if (components[componentName]) {
                // Recursively expand (components can use other components)
                result.push(...expandProps(components[componentName], components));
            }
        } else {
            result.push(prop);
        }
    }
    return result;
}

function formatSelector(selector) {
    // Handle attribute selectors like button[disabled]
    if (selector.includes('[')) {
        return selector;
    }
    // Already has . or #
    if (selector.startsWith('.') || selector.startsWith('#')) {
        return selector;
    }
    // HTML elements stay as-is
    const htmlElements = ['button', 'input', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'div', 'span', 'nav', 'header', 'footer', 'main', 'section', 'article', 'aside',
        'ul', 'ol', 'li', 'table', 'form', 'img', 'body', 'html', 'textarea', 'select',
        'label', 'fieldset', 'legend', 'hr', 'br', 'pre', 'code', 'blockquote'];
    if (htmlElements.includes(selector)) {
        return selector;
    }
    // Default to class
    return `.${selector}`;
}

function compileProperty(prop, tokens) {
    // Resolve color tokens first
    prop = resolveColors(prop, tokens);

    // bg blue-500 → background: #color
    if (prop.startsWith('bg ')) {
        const value = prop.slice(3);
        // Check for gradient
        if (value.startsWith('gradient ')) {
            const colors = value.slice(9).split(' to ');
            if (colors.length === 2) {
                return `background: linear-gradient(135deg, ${colors[0]}, ${colors[1]});`;
            }
        }
        return `background: ${value};`;
    }

    // color slate-100 → color: #color
    if (prop.startsWith('color ')) {
        return `color: ${prop.slice(6)};`;
    }

    // text blue-500 → color (alias)
    if (prop.startsWith('text ') && !prop.startsWith('text-')) {
        return `color: ${prop.slice(5)};`;
    }

    // pad sm md → padding
    if (prop.startsWith('pad ')) {
        const values = prop.slice(4).split(' ').map(v => resolveSize(v, tokens));
        return `padding: ${values.join(' ')};`;
    }

    // margin sm md → margin
    if (prop.startsWith('margin ') || prop.startsWith('m ')) {
        const start = prop.startsWith('margin ') ? 7 : 2;
        const values = prop.slice(start).split(' ').map(v => resolveSize(v, tokens));
        return `margin: ${values.join(' ')};`;
    }

    // round or round lg or round full
    if (prop === 'round' || prop.startsWith('round ')) {
        const size = prop === 'round' ? 'lg' : prop.slice(6);
        const radius = tokens.radius?.[size] || DEFAULTS.radius[size] || size;
        return `border-radius: ${radius};`;
    }

    // shadow or shadow lg
    if (prop === 'shadow' || prop.startsWith('shadow ')) {
        const size = prop === 'shadow' ? 'md' : prop.slice(7);
        const shadow = tokens.shadows?.[size] || DEFAULTS.shadows[size] || size;
        return `box-shadow: ${shadow};`;
    }

    // no border / no shadow / no outline
    if (prop === 'no border') return `border: none;`;
    if (prop === 'no shadow') return `box-shadow: none;`;
    if (prop === 'no outline') return `outline: none;`;

    // border 1px solid color
    if (prop.startsWith('border ')) {
        return `border: ${prop.slice(7)};`;
    }

    // pointer → cursor: pointer
    if (prop === 'pointer') return `cursor: pointer;`;
    if (prop === 'clickable') return `cursor: pointer;`;

    // smooth → transition
    if (prop === 'smooth') return `transition: all 0.2s ease;`;
    if (prop.startsWith('transition ')) return `transition: all ${prop.slice(11)} ease;`;

    // opacity
    if (prop.startsWith('opacity ')) return `opacity: ${prop.slice(8)};`;

    // text decoration
    if (prop === 'no underline') return `text-decoration: none;`;
    if (prop === 'underline') return `text-decoration: underline;`;
    if (prop === 'line-through') return `text-decoration: line-through;`;

    // text transform
    if (prop === 'uppercase') return `text-transform: uppercase;`;
    if (prop === 'lowercase') return `text-transform: lowercase;`;
    if (prop === 'capitalize') return `text-transform: capitalize;`;

    // font weight
    if (prop === 'bold') return `font-weight: bold;`;
    if (prop === 'semibold') return `font-weight: 600;`;
    if (prop === 'light') return `font-weight: 300;`;
    if (prop === 'normal') return `font-weight: normal;`;

    // font size: size xl or size 24px
    if (prop.startsWith('size ')) {
        const size = prop.slice(5);
        const fontSize = tokens.fontSize?.[size];
        if (fontSize) {
            return `font-size: ${fontSize[0]};\n  line-height: ${fontSize[1]};`;
        }
        return `font-size: ${size};`;
    }

    // Layout
    if (prop === 'row') return `display: flex;\n  flex-direction: row;`;
    if (prop === 'row spread') return `display: flex;\n  flex-direction: row;\n  justify-content: space-between;`;
    if (prop === 'row center') return `display: flex;\n  flex-direction: row;\n  justify-content: center;`;
    if (prop === 'row end') return `display: flex;\n  flex-direction: row;\n  justify-content: flex-end;`;
    if (prop === 'column') return `display: flex;\n  flex-direction: column;`;
    if (prop === 'column center') return `display: flex;\n  flex-direction: column;\n  align-items: center;`;
    if (prop === 'wrap') return `flex-wrap: wrap;`;

    // Center (multiple types)
    if (prop === 'center') return `text-align: center;`;
    if (prop === 'center all') return `display: flex;\n  justify-content: center;\n  align-items: center;`;
    if (prop === 'align center') return `align-items: center;`;
    if (prop === 'justify center') return `justify-content: center;`;

    // Grid
    if (prop.startsWith('grid ')) {
        const cols = prop.slice(5);
        return `display: grid;\n  grid-template-columns: repeat(${cols}, 1fr);`;
    }

    // Gap
    if (prop.startsWith('gap ')) {
        const size = resolveSize(prop.slice(4), tokens);
        return `gap: ${size};`;
    }

    // Width/Height shortcuts
    if (prop.startsWith('w ')) return `width: ${resolveSize(prop.slice(2), tokens)};`;
    if (prop.startsWith('h ')) return `height: ${resolveSize(prop.slice(2), tokens)};`;
    if (prop === 'w-full') return `width: 100%;`;
    if (prop === 'h-full') return `height: 100%;`;
    if (prop === 'w-screen') return `width: 100vw;`;
    if (prop === 'h-screen') return `height: 100vh;`;

    // Position
    if (prop === 'relative') return `position: relative;`;
    if (prop === 'absolute') return `position: absolute;`;
    if (prop === 'fixed') return `position: fixed;`;
    if (prop === 'sticky') return `position: sticky;`;

    // Z-index
    if (prop.startsWith('z ')) return `z-index: ${prop.slice(2)};`;

    // Overflow
    if (prop === 'overflow hidden') return `overflow: hidden;`;
    if (prop === 'overflow scroll') return `overflow: scroll;`;
    if (prop === 'overflow auto') return `overflow: auto;`;

    // Display
    if (prop === 'block') return `display: block;`;
    if (prop === 'inline') return `display: inline;`;
    if (prop === 'inline-block') return `display: inline-block;`;
    if (prop === 'hidden') return `display: none;`;
    if (prop === 'invisible') return `visibility: hidden;`;

    // Full property passthrough: width, height, etc.
    if (/^(width|height|max-width|min-width|max-height|min-height|top|right|bottom|left)\s/.test(prop)) {
        const [property, ...valueParts] = prop.split(' ');
        const value = resolveSize(valueParts.join(' '), tokens);
        return `${property}: ${value};`;
    }

    // Generic passthrough for any "property value" format
    if (prop.includes(' ')) {
        const [property, ...valueParts] = prop.split(' ');
        return `${property}: ${valueParts.join(' ')};`;
    }

    return null;
}

function resolveColors(prop, tokens) {
    // First, replace user-defined color tokens (primary, dark, etc.)
    if (tokens.colors) {
        for (const [name, value] of Object.entries(tokens.colors)) {
            // Skip Tailwind colors (they have - in their name)
            if (name.includes('-')) continue;
            prop = prop.replace(new RegExp(`\\b${name}\\b`, 'g'), value);
        }
    }

    // Then, replace Tailwind color names like blue-500, slate-900, etc.
    const colorPattern = /\b([a-z]+-\d{2,3}|white|black|transparent)\b/g;
    return prop.replace(colorPattern, (match) => {
        return tokens.colors?.[match] || DEFAULTS.colors[match] || match;
    });
}

function resolveSize(value, tokens) {
    if (tokens.sizes?.[value]) return tokens.sizes[value];
    if (DEFAULTS.sizes[value]) return DEFAULTS.sizes[value];
    return value;
}

module.exports = { compile };

