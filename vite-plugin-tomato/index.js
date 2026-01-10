/**
 * Vite Plugin for Tomato CSS
 * 
 * This plugin enables importing .tom files in React/Vue/Svelte components
 * with automatic style scoping via the withTomato() HOC.
 * 
 * Usage:
 * ```jsx
 * import { withTomato } from './Button.tom';
 * 
 * function Button({ children }) {
 *   return <button className="btn">{children}</button>;
 * }
 * 
 * export default withTomato(Button);
 * ```
 */

import { createRequire } from 'module';
import path from 'path';
import { createHash } from 'crypto';

// Use require for CommonJS modules
const require = createRequire(import.meta.url);

/**
 * Generate a short, deterministic scope ID from file path
 */
function generateScopeId(filePath) {
    const hash = createHash('md5')
        .update(filePath)
        .digest('hex')
        .substring(0, 6);
    return 't' + hash;
}

/**
 * Add scope prefix to all CSS selectors
 * Transforms: .btn { } → [data-tom="xyz"] .btn { }
 */
function scopeCSS(css, scopeId) {
    const scopeAttr = `[data-tom="${scopeId}"]`;

    // Split into rules (handling @media, @keyframes, etc.)
    const lines = css.split('\n');
    const result = [];
    let inAtRule = false;
    let atRuleBuffer = [];
    let braceCount = 0;

    for (const line of lines) {
        // Track brace depth for @rules
        for (const char of line) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
        }

        // Detect start of @rules
        if (line.trim().startsWith('@media') ||
            line.trim().startsWith('@keyframes') ||
            line.trim().startsWith('@supports')) {
            inAtRule = true;
            atRuleBuffer.push(line);
            continue;
        }

        if (inAtRule) {
            // Inside @media: scope the selectors inside
            if (line.includes('{') && !line.trim().startsWith('@')) {
                const scopedLine = line.replace(
                    /([^{]+)(\{)/,
                    (match, selector, brace) => {
                        const scopedSel = selector
                            .split(',')
                            .map(s => s.trim() ? `${scopeAttr} ${s.trim()}` : s)
                            .join(', ');
                        return scopedSel + brace;
                    }
                );
                atRuleBuffer.push(scopedLine);
            } else {
                atRuleBuffer.push(line);
            }

            // End of @rule block
            if (braceCount === 0 && atRuleBuffer.length > 0) {
                result.push(...atRuleBuffer);
                atRuleBuffer = [];
                inAtRule = false;
            }
            continue;
        }

        // Regular selector line
        if (line.includes('{') && !line.trim().startsWith('@')) {
            const scopedLine = line.replace(
                /([^{]+)(\{)/,
                (match, selector, brace) => {
                    const scopedSel = selector
                        .split(',')
                        .map(s => s.trim() ? `${scopeAttr} ${s.trim()}` : s)
                        .join(', ');
                    return scopedSel + brace;
                }
            );
            result.push(scopedLine);
        } else {
            result.push(line);
        }
    }

    return result.join('\n');
}

/**
 * Vite plugin factory function
 */
export default function tomatoPlugin(options = {}) {
    // Resolve the tomato-css compiler path
    let tomatoCompiler;

    return {
        name: 'vite-plugin-tomato',

        // Configure the plugin
        configResolved(config) {
            // Try to find tomato-css compiler
            try {
                // First try relative path (for local development in test-react-app)
                const localPath = path.resolve(config.root, '../src/api.js');
                console.log(`[vite-plugin-tomato] Looking for compiler at: ${localPath}`);
                tomatoCompiler = require(localPath);
                console.log('[vite-plugin-tomato] ✓ Found tomato-css compiler');
            } catch (e) {
                console.log(`[vite-plugin-tomato] Local not found: ${e.message}`);
                try {
                    // Then try node_modules
                    tomatoCompiler = require('@srivtx/tomato-css');
                    console.log('[vite-plugin-tomato] ✓ Found tomato-css from node_modules');
                } catch {
                    console.warn('[vite-plugin-tomato] ⚠ Could not find tomato-css compiler, using fallback');
                }
            }
        },

        // Transform .tom files
        transform(code, id) {
            if (!id.endsWith('.tom')) return null;

            // Generate unique scope ID from file path
            const scopeId = generateScopeId(id);

            let css;
            let scopedCss;

            if (tomatoCompiler) {
                // Use the tomato-css compiler
                const result = tomatoCompiler.compileTomato(code, {
                    scoped: true,
                    scopeId
                });
                css = result.css;
                scopedCss = result.scopedCss;
            } else {
                // Fallback: treat as plain CSS and just scope it
                css = code;
                scopedCss = scopeCSS(code, scopeId);
            }

            // Generate the JavaScript module
            const jsModule = `
// Tomato CSS - Auto-generated module
// Source: ${path.basename(id)}
// Scope ID: ${scopeId}

// Inject styles into document
const css = ${JSON.stringify(scopedCss)};
let styleEl = null;

if (typeof document !== 'undefined') {
  styleEl = document.createElement('style');
  styleEl.setAttribute('data-tomato-scope', '${scopeId}');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}

// React Higher-Order Component for scoping
import { createElement, forwardRef } from 'react';

export function withTomato(Component) {
  const TomatoScoped = forwardRef((props, ref) => {
    return createElement(
      'div',
      { 
        'data-tom': '${scopeId}',
        style: { display: 'contents' },
        ref 
      },
      createElement(Component, { ...props, ref: undefined })
    );
  });
  
  TomatoScoped.displayName = \`withTomato(\${Component.displayName || Component.name || 'Component'})\`;
  
  return TomatoScoped;
}

// Also export as default for convenience
export default { withTomato, scopeId: '${scopeId}' };

// Hot Module Replacement support
if (import.meta.hot) {
  import.meta.hot.accept();
  
  // Remove old styles and inject new ones
  import.meta.hot.dispose(() => {
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
  });
}
`;

            return {
                code: jsModule,
                map: null
            };
        },

        // Handle HMR
        handleHotUpdate({ file, server }) {
            if (file.endsWith('.tom')) {
                console.log(`[vite-plugin-tomato] 🍅 ${path.basename(file)} updated`);
                return; // Let Vite handle the update
            }
        }
    };
}

// Named export
export { tomatoPlugin };
