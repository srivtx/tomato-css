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

const require = createRequire(import.meta.url);
const { generateScopeId, scopeCSS } = require('../src/scope');

/**
 * Vite plugin factory function
 */
export default function tomatoPlugin(options = {}) {
    // Resolve the tomato-css compiler path
    let tomatoCompiler;
    const debug = options.debug === true;

    return {
        name: 'vite-plugin-tomato',

        // Configure the plugin
        configResolved(config) {
            try {
                const localPath = path.resolve(config.root, '../src/api.js');
                tomatoCompiler = require(localPath);
                if (debug) console.log(`[vite-plugin-tomato] Found compiler at ${localPath}`);
            } catch {
                try {
                    tomatoCompiler = require('@srivtx/tomato-css');
                    if (debug) console.log('[vite-plugin-tomato] Found compiler in node_modules');
                } catch {
                    if (debug) console.warn('[vite-plugin-tomato] Compiler not found, using fallback');
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

        handleHotUpdate({ file }) {
            if (file.endsWith('.tom')) {
                if (debug) console.log(`[vite-plugin-tomato] ${path.basename(file)} updated`);
                return;
            }
        }
    };
}

// Named export
export { tomatoPlugin };
