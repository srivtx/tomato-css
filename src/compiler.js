const { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS, BREAKPOINTS } = require('./tokens');

const DEFAULTS = {
    colors: COLORS,
    sizes: SPACING,
    fontSize: FONT_SIZES,
    radius: RADIUS,
    shadows: SHADOWS,
    breakpoints: BREAKPOINTS
};

const COLOR_SCHEME_QUERIES = {
    dark: '@media (prefers-color-scheme: dark)',
    light: '@media (prefers-color-scheme: light)'
};

function compile(ast) {
    const tokens = {
        colors: { ...DEFAULTS.colors, ...(ast.tokens && ast.tokens.colors) },
        sizes: { ...DEFAULTS.sizes, ...(ast.tokens && ast.tokens.sizes) },
        fontSize: DEFAULTS.fontSize,
        radius: DEFAULTS.radius,
        shadows: DEFAULTS.shadows,
        breakpoints: { ...DEFAULTS.breakpoints, ...(ast.tokens && ast.tokens.breakpoints) }
    };

    const components = ast.components || {};

    let css = '';

    for (const [selector, block] of Object.entries(ast.styles)) {
        const cssSelector = formatSelector(selector);

        const expanded = expandProps(block.props, components);

        const mainProps = dedupeProps(expanded.props.map(p => compileProperty(p, tokens))).filter(Boolean);
        if (mainProps.length > 0) {
            css += `${cssSelector} {\n${mainProps.map(p => `  ${p}`).join('\n')}\n}\n\n`;
        }

        const allNested = { ...expanded.nested };
        for (const [nestedKey, nestedProps] of Object.entries(block.nested)) {
            if (!allNested[nestedKey]) {
                allNested[nestedKey] = [];
            }
            allNested[nestedKey].push(...nestedProps);
        }

        for (const [nestedKey, nestedProps] of Object.entries(allNested)) {
            const expandedNested = expandProps(nestedProps, components);
            const compiledProps = dedupeProps(expandedNested.props.map(p => compileProperty(p, tokens))).filter(Boolean);
            if (compiledProps.length === 0) continue;

            if (nestedKey.startsWith('@')) {
                const wrap = wrapMedia(nestedKey, tokens);
                css += `${wrap} {\n`;
                css += `  ${cssSelector} {\n${compiledProps.map(p => `    ${p}`).join('\n')}\n  }\n`;
                css += `}\n\n`;
            } else {
                css += `${cssSelector}:${nestedKey} {\n${compiledProps.map(p => `  ${p}`).join('\n')}\n}\n\n`;
            }
        }
    }

    return css.trim() + '\n';
}

function dedupeProps(props) {
    const seen = new Map();
    const result = [];
    for (const p of props) {
        if (!p || typeof p !== 'string') continue;
        const property = p.split(':')[0].trim();
        seen.set(property, p);
    }
    return Array.from(seen.values());
}

function wrapMedia(key, tokens) {
    const name = key.replace(/^@/, '');
    if (COLOR_SCHEME_QUERIES[name]) return COLOR_SCHEME_QUERIES[name];
    const value = tokens.breakpoints[name];
    if (!value) {
        throw new CompileError(
            `Unknown breakpoint "${key}". Valid: @mobile, @tablet, @laptop, @desktop, @wide, @dark, @light`
        );
    }
    return `@media (max-width: ${value})`;
}

function expandProps(props, components, depth = 0) {
    if (depth > 32) {
        throw new CompileError('Component recursion too deep (likely circular "use")');
    }
    const result = { props: [], nested: {} };

    for (const prop of props) {
        if (prop.startsWith('use ')) {
            const componentName = prop.slice(4).trim();
            const component = components[componentName];
            if (!component) {
                throw new CompileError(`Component "${componentName}" is not defined`);
            }

            const expanded = expandProps(component.props || [], components, depth + 1);
            result.props.push(...expanded.props);

            for (const [nestedKey, nestedProps] of Object.entries(component.nested || {})) {
                if (!result.nested[nestedKey]) {
                    result.nested[nestedKey] = [];
                }
                const expandedNested = expandProps(nestedProps, components, depth + 1);
                result.nested[nestedKey].push(...expandedNested.props);

                for (const [deepKey, deepProps] of Object.entries(expandedNested.nested)) {
                    if (!result.nested[deepKey]) {
                        result.nested[deepKey] = [];
                    }
                    result.nested[deepKey].push(...deepProps);
                }
            }

            for (const [nestedKey, nestedProps] of Object.entries(expanded.nested)) {
                if (!result.nested[nestedKey]) {
                    result.nested[nestedKey] = [];
                }
                result.nested[nestedKey].push(...nestedProps);
            }
        } else {
            result.props.push(prop);
        }
    }

    return result;
}

function formatSelector(selector) {
    if (selector.includes('[')) return selector;
    if (selector.startsWith('.') || selector.startsWith('#')) return selector;
    const htmlElements = ['button', 'input', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'div', 'span', 'nav', 'header', 'footer', 'main', 'section', 'article', 'aside',
        'ul', 'ol', 'li', 'table', 'form', 'img', 'body', 'html', 'textarea', 'select',
        'label', 'fieldset', 'legend', 'hr', 'br', 'pre', 'code', 'blockquote'];
    if (htmlElements.includes(selector)) return selector;
    return `.${selector}`;
}

function compileProperty(prop, tokens) {
    if (prop.startsWith('@')) {
        throw new CompileError(
            `Unknown at-rule "${prop}". Valid: @mobile, @tablet, @laptop, @desktop, @wide, @dark, @light`
        );
    }
    prop = resolveColors(prop, tokens);

    if (prop.startsWith('bg ')) {
        const value = prop.slice(3);
        if (value.startsWith('gradient ')) {
            const rest = value.slice(9).trim();
            const parts = rest.split(/\s+to\s+/);
            if (parts.length === 2) {
                return `background: linear-gradient(135deg, ${parts[0]}, ${parts[1]});`;
            }
            throw new CompileError(
                `Invalid gradient "${value}". Use: bg gradient <color> to <color>`
            );
        }
        return `background: ${value};`;
    }

    if (prop.startsWith('color ')) {
        return `color: ${prop.slice(6)};`;
    }

    if (prop.startsWith('text ') && !prop.startsWith('text-')) {
        return `color: ${prop.slice(5)};`;
    }

    if (prop.startsWith('pad ')) {
        const values = prop.slice(4).split(' ').map(v => resolveSize(v, tokens));
        return `padding: ${values.join(' ')};`;
    }

    if (prop.startsWith('margin ') || prop.startsWith('m ')) {
        const start = prop.startsWith('margin ') ? 7 : 2;
        const values = prop.slice(start).split(' ').map(v => resolveSize(v, tokens));
        return `margin: ${values.join(' ')};`;
    }

    if (prop === 'round' || prop.startsWith('round ')) {
        const size = prop === 'round' ? 'lg' : prop.slice(6);
        const radius = tokens.radius[size];
        if (radius) return `border-radius: ${radius};`;
        return `border-radius: ${size};`;
    }

    if (prop === 'shadow' || prop.startsWith('shadow ')) {
        const size = prop === 'shadow' ? 'md' : prop.slice(7);
        const shadow = tokens.shadows[size];
        if (shadow) return `box-shadow: ${shadow};`;
        return `box-shadow: ${size};`;
    }

    if (prop === 'no border') return `border: none;`;
    if (prop === 'no shadow') return `box-shadow: none;`;
    if (prop === 'no outline') return `outline: none;`;

    if (prop.startsWith('border ')) {
        return `border: ${prop.slice(7)};`;
    }

    if (prop === 'pointer' || prop === 'clickable') return `cursor: pointer;`;

    if (prop === 'smooth') return `transition: all 0.2s ease;`;
    if (prop.startsWith('transition ')) return `transition: all ${prop.slice(11)} ease;`;

    if (prop.startsWith('opacity ')) return `opacity: ${prop.slice(8)};`;

    if (prop === 'no underline') return `text-decoration: none;`;
    if (prop === 'underline') return `text-decoration: underline;`;
    if (prop === 'line-through') return `text-decoration: line-through;`;

    if (prop === 'uppercase') return `text-transform: uppercase;`;
    if (prop === 'lowercase') return `text-transform: lowercase;`;
    if (prop === 'capitalize') return `text-transform: capitalize;`;

    if (prop === 'bold') return `font-weight: bold;`;
    if (prop === 'semibold') return `font-weight: 600;`;
    if (prop === 'light') return `font-weight: 300;`;
    if (prop === 'normal') return `font-weight: normal;`;

    if (prop.startsWith('size ') || prop.startsWith('font-size ')) {
        const start = prop.startsWith('size ') ? 5 : 10;
        const size = prop.slice(start);
        const fontSize = tokens.fontSize[size];
        if (fontSize) {
            return `font-size: ${fontSize[0]};\n  line-height: ${fontSize[1]};`;
        }
        return `font-size: ${size};`;
    }

    if (prop === 'row') return `display: flex;\n  flex-direction: row;`;
    if (prop === 'row spread') return `display: flex;\n  flex-direction: row;\n  justify-content: space-between;`;
    if (prop === 'row center') return `display: flex;\n  flex-direction: row;\n  justify-content: center;`;
    if (prop === 'row end') return `display: flex;\n  flex-direction: row;\n  justify-content: flex-end;`;
    if (prop === 'column') return `display: flex;\n  flex-direction: column;`;
    if (prop === 'column center') return `display: flex;\n  flex-direction: column;\n  align-items: center;`;
    if (prop === 'wrap') return `flex-wrap: wrap;`;

    if (prop === 'center') return `text-align: center;`;
    if (prop === 'center all') return `display: flex;\n  justify-content: center;\n  align-items: center;`;
    if (prop === 'align center') return `align-items: center;`;
    if (prop === 'justify center') return `justify-content: center;`;

    if (prop.startsWith('grid ')) {
        const cols = prop.slice(5);
        return `display: grid;\n  grid-template-columns: repeat(${cols}, 1fr);`;
    }

    if (prop.startsWith('gap ')) {
        return `gap: ${resolveSize(prop.slice(4), tokens)};`;
    }

    if (prop.startsWith('w ')) return `width: ${resolveSize(prop.slice(2), tokens)};`;
    if (prop.startsWith('h ')) return `height: ${resolveSize(prop.slice(2), tokens)};`;
    if (prop === 'w-full') return `width: 100%;`;
    if (prop === 'h-full') return `height: 100%;`;
    if (prop === 'w-screen') return `width: 100vw;`;
    if (prop === 'h-screen') return `height: 100vh;`;

    if (prop === 'relative') return `position: relative;`;
    if (prop === 'absolute') return `position: absolute;`;
    if (prop === 'fixed') return `position: fixed;`;
    if (prop === 'sticky') return `position: sticky;`;

    if (prop.startsWith('z ')) return `z-index: ${prop.slice(2)};`;

    if (prop === 'overflow hidden') return `overflow: hidden;`;
    if (prop === 'overflow scroll') return `overflow: scroll;`;
    if (prop === 'overflow auto') return `overflow: auto;`;

    if (prop === 'block') return `display: block;`;
    if (prop === 'inline') return `display: inline;`;
    if (prop === 'inline-block') return `display: inline-block;`;
    if (prop === 'hidden') return `display: none;`;
    if (prop === 'invisible') return `visibility: hidden;`;

    if (/^(width|height|max-width|min-width|max-height|min-height|top|right|bottom|left|gap|flex|grid-template-columns|grid-template-rows)\s/.test(prop)) {
        const [property, ...valueParts] = prop.split(' ');
        return `${property}: ${valueParts.join(' ')};`;
    }

    if (prop.includes(' ')) {
        const [property, ...valueParts] = prop.split(' ');
        return `${property}: ${valueParts.join(' ')};`;
    }

    return null;
}

function resolveColors(prop, tokens) {
    if (tokens.colors) {
        for (const [name, value] of Object.entries(tokens.colors)) {
            if (name.includes('-')) continue;
            prop = prop.replace(new RegExp(`\\b${name}\\b`, 'g'), value);
        }
    }
    const colorPattern = /\b([a-z]+-\d{2,3}|white|black|transparent)\b/g;
    return prop.replace(colorPattern, (match) => {
        return tokens.colors[match] || DEFAULTS.colors[match] || match;
    });
}

function resolveSize(value, tokens) {
    if (tokens.sizes[value]) return tokens.sizes[value];
    if (DEFAULTS.sizes[value]) return DEFAULTS.sizes[value];
    return value;
}

class CompileError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CompileError';
    }
}

module.exports = { compile, CompileError };
