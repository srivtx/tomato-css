/**
 * Tomato CSS - Programmatic API
 * 
 * This module provides the programmatic API for using Tomato CSS
 * inside build tools like Vite, Webpack, etc.
 */

const { parse } = require('./parser');
const { compile } = require('./compiler');
const { generateScopeId, scopeCSS } = require('./scope');

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
