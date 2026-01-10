/**
 * Tomato CSS - Programmatic API
 * 
 * This module provides the programmatic API for using Tomato CSS
 * inside build tools like Vite, Webpack, etc.
 */

const { parse } = require('./parser');
const { compile } = require('./compiler');

/**
 * Generate a short hash from a string
 * Used to create unique scope IDs from file paths
 */
function generateScopeId(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return 't' + Math.abs(hash).toString(36).substring(0, 6);
}

/**
 * Add scope prefix to all CSS selectors
 * Transforms: .btn { } → [data-tom="xyz"] .btn { }
 */
function scopeCSS(css, scopeId) {
    const scopeAttr = `[data-tom="${scopeId}"]`;

    // Match CSS rules: selector { properties }
    // This regex handles most common cases
    return css.replace(
        /([^{}@]+)(\{[^{}]*\})/g,
        (match, selectors, block) => {
            // Don't scope @keyframes, @font-face, etc.
            if (selectors.trim().startsWith('@')) {
                return match;
            }

            // Scope each selector
            const scopedSelectors = selectors
                .split(',')
                .map(sel => {
                    sel = sel.trim();
                    if (!sel) return sel;

                    // Handle pseudo-elements and pseudo-classes at root level
                    if (sel.startsWith(':')) {
                        return `${scopeAttr}${sel}`;
                    }

                    return `${scopeAttr} ${sel}`;
                })
                .join(', ');

            return scopedSelectors + block;
        }
    );
}

/**
 * Compile Tomato CSS source to CSS
 * 
 * @param {string} source - The .tom source code
 * @param {object} options - Compilation options
 * @param {boolean} options.scoped - Generate scoped CSS
 * @param {string} options.scopeId - Unique scope ID (auto-generated if not provided)
 * @returns {{ css: string, scopedCss: string, scopeId: string }}
 */
function compileTomato(source, options = {}) {
    const ast = parse(source);
    const css = compile(ast);

    const scopeId = options.scopeId || generateScopeId(source);
    const scopedCss = options.scoped !== false ? scopeCSS(css, scopeId) : css;

    return {
        css,           // Original unscoped CSS
        scopedCss,     // CSS with scoped selectors
        scopeId        // The scope ID used
    };
}

module.exports = {
    compileTomato,
    generateScopeId,
    scopeCSS,
    parse,
    compile
};
