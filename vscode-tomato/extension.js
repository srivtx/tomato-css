const vscode = require('vscode');

// Valid color shades
const VALID_SHADES = new Set(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']);

// Known properties in Tomato CSS
const KNOWN_PROPERTIES = new Set([
    'bg', 'color', 'pad', 'padding', 'margin', 'round', 'border', 'shadow',
    'font', 'size', 'weight', 'width', 'height', 'min-width', 'max-width',
    'min-height', 'max-height', 'gap', 'top', 'right', 'bottom', 'left',
    'z', 'opacity', 'overflow', 'display', 'position', 'row', 'col', 'column',
    'center', 'stack', 'grid', 'flex', 'wrap', 'nowrap', 'grow', 'shrink',
    'basis', 'order', 'align', 'justify', 'self', 'items', 'content',
    'text', 'line', 'letter', 'word', 'white', 'break', 'truncate',
    'pointer', 'cursor', 'select', 'outline', 'ring', 'transition', 'transform',
    'rotate', 'scale', 'translate', 'skew', 'origin', 'animate', 'smooth',
    'no', 'bold', 'italic', 'underline', 'uppercase', 'lowercase', 'capitalize',
    'normal', 'hidden', 'visible', 'scroll', 'auto', 'fixed', 'absolute',
    'relative', 'sticky', 'static', 'block', 'inline', 'inline-block', 'none',
    'gradient', 'to', 'from', 'via', 'use', 'component', 'spread', 'between',
    'around', 'evenly', 'start', 'end', 'all', 'semibold', 'w', 'h',
    'w-full', 'h-full', 'w-screen', 'h-screen',
    // Common token names
    'primary', 'secondary', 'accent', 'dark', 'light', 'muted', 'background',
    'foreground', 'surface', 'error', 'warning', 'success', 'info', 'danger'
]);

// Common typos and their corrections
const TYPO_CORRECTIONS = {
    'poniter': 'pointer', 'poiner': 'pointer', 'pointr': 'pointer',
    'backgroud': 'bg', 'backgrund': 'bg', 'backgound': 'bg',
    'colr': 'color', 'colur': 'color', 'colour': 'color',
    'maring': 'margin', 'margn': 'margin', 'marign': 'margin',
    'paddng': 'pad', 'pading': 'pad', 'padd': 'pad',
    'bordr': 'border', 'boarder': 'border', 'boder': 'border',
    'shaddow': 'shadow', 'shadw': 'shadow', 'shaodw': 'shadow',
    'raduis': 'round', 'radious': 'round', 'radis': 'round',
    'trnsition': 'smooth', 'transiton': 'smooth',
    'opactiy': 'opacity', 'opacty': 'opacity',
    'positon': 'position', 'postion': 'position',
    'dipslay': 'display', 'dispaly': 'display',
    'hight': 'height', 'heigth': 'height', 'hegith': 'height',
    'widht': 'width', 'witdh': 'width', 'wdith': 'width',
    'centre': 'center', 'centr': 'center',
    'collumn': 'column', 'colum': 'column', 'coulmn': 'column',
    'gird': 'grid', 'gid': 'grid',
    'flx': 'flex', 'flexx': 'flex',
    'upercase': 'uppercase', 'uppercse': 'uppercase',
    'lowercse': 'lowercase', 'lowecase': 'lowercase',
    'itelic': 'italic', 'itlaic': 'italic',
    'blod': 'bold', 'bald': 'bold',
    'udnerline': 'underline', 'underlin': 'underline',
    'absolut': 'absolute', 'aboslute': 'absolute',
    'relatve': 'relative', 'relativ': 'relative',
    'stciky': 'sticky', 'sitcky': 'sticky',
    'overfow': 'overflow', 'overflw': 'overflow',
    'visble': 'visible', 'visiable': 'visible',
    'hiddn': 'hidden', 'hiden': 'hidden',
    'transfrm': 'transform', 'tranform': 'transform',
    'roatate': 'rotate', 'rotat': 'rotate',
    'scael': 'scale', 'scal': 'scale',
    'trnslate': 'translate', 'translat': 'translate',
    'animat': 'animate', 'anmiate': 'animate',
    'smoth': 'smooth', 'smoot': 'smooth',
    'cursur': 'cursor', 'curser': 'cursor',
};

// Valid pseudo-classes
const VALID_PSEUDO = new Set(['hover', 'active', 'focus', 'disabled', 'visited', 'first-child', 'last-child']);

// Valid media queries  
const VALID_MEDIA = new Set(['@mobile', '@tablet', '@laptop', '@desktop', '@dark', '@light']);

// Tailwind color names
const TAILWIND_COLORS = new Set([
    'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber',
    'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue',
    'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
    'white', 'black', 'transparent', 'current', 'inherit'
]);

// Store defined components and their usage
let definedComponents = new Map(); // name -> { line, used: boolean }
let usedComponents = new Set();
let definedTokens = new Set();

let diagnosticCollection;

function activate(context) {
    console.log('🍅 Tomato CSS extension is now active!');

    diagnosticCollection = vscode.languages.createDiagnosticCollection('tomato');
    context.subscriptions.push(diagnosticCollection);

    // Register listeners
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId === 'tomato') {
                validateDocument(event.document);
            }
        }),
        vscode.workspace.onDidOpenTextDocument(document => {
            if (document.languageId === 'tomato') {
                validateDocument(document);
            }
        })
    );

    // Validate all open documents
    vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'tomato') {
            validateDocument(document);
        }
    });

    // Register completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        'tomato',
        {
            provideCompletionItems(document, position) {
                const completions = [];

                // Property completions
                KNOWN_PROPERTIES.forEach(prop => {
                    const item = new vscode.CompletionItem(prop, vscode.CompletionItemKind.Property);
                    item.detail = 'Tomato CSS property';
                    completions.push(item);
                });

                // Color completions
                TAILWIND_COLORS.forEach(color => {
                    if (!['white', 'black', 'transparent', 'current', 'inherit'].includes(color)) {
                        VALID_SHADES.forEach(shade => {
                            const item = new vscode.CompletionItem(`${color}-${shade}`, vscode.CompletionItemKind.Color);
                            item.detail = 'Tailwind color';
                            completions.push(item);
                        });
                    }
                });

                // Component completions
                definedComponents.forEach((_, name) => {
                    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Class);
                    item.detail = 'Defined component';
                    item.insertText = `use ${name}`;
                    completions.push(item);
                });

                // Pseudo-class completions
                VALID_PSEUDO.forEach(pseudo => {
                    const item = new vscode.CompletionItem(`${pseudo}:`, vscode.CompletionItemKind.Keyword);
                    item.detail = 'Pseudo-class';
                    completions.push(item);
                });

                // Media query completions
                VALID_MEDIA.forEach(media => {
                    const item = new vscode.CompletionItem(`${media}:`, vscode.CompletionItemKind.Keyword);
                    item.detail = 'Media query';
                    completions.push(item);
                });

                return completions;
            }
        }
    );

    context.subscriptions.push(completionProvider);
}

function validateDocument(document) {
    const diagnostics = [];
    const text = document.getText();
    const lines = text.split('\n');

    // Reset tracking
    definedComponents = new Map();
    usedComponents = new Set();
    definedTokens = new Set();

    // Resolve imports to find components from other files
    const importedComponents = new Set();
    const importedTokens = new Set();

    const importRegex = /^@import\s+["'](.+?)["']\s*$/gm;
    let importMatch;
    while ((importMatch = importRegex.exec(text)) !== null) {
        const importPath = importMatch[1];
        try {
            const docDir = require('path').dirname(document.uri.fsPath);
            const fullPath = require('path').resolve(docDir, importPath.endsWith('.tom') ? importPath : importPath + '.tom');
            const fs = require('fs');
            if (fs.existsSync(fullPath)) {
                const importedContent = fs.readFileSync(fullPath, 'utf8');
                // Find component definitions in imported file
                const componentRegex = /^component\s+([a-zA-Z][a-zA-Z0-9_-]*)\s*:/gm;
                let compMatch;
                while ((compMatch = componentRegex.exec(importedContent)) !== null) {
                    importedComponents.add(compMatch[1]);
                }
                // Find token definitions in imported file
                const tokenRegex = /^\s+([a-zA-Z][a-zA-Z0-9_-]*)\s+[a-z]+-\d+$/gm;
                let tokMatch;
                while ((tokMatch = tokenRegex.exec(importedContent)) !== null) {
                    importedTokens.add(tokMatch[1]);
                }
            }
        } catch (e) {
            // Ignore import errors in extension - they'll show at compile time
        }
    }

    // Track properties per selector for duplicate detection
    let currentSelector = null;
    let currentSelectorLine = 0;
    let currentProperties = new Set();
    let currentNestedProperties = new Set();
    let inNestedBlock = false;

    // First pass: collect definitions
    lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();

        // Component definition
        const componentMatch = trimmed.match(/^component\s+([a-zA-Z][a-zA-Z0-9_-]*)\s*:/);
        if (componentMatch) {
            definedComponents.set(componentMatch[1], { line: lineIndex, used: false });
        }

        // Token definitions (under colors:)
        const tokenMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\s+[a-z]+-\d+$/);
        if (tokenMatch && line.search(/\S/) > 0) {
            definedTokens.add(tokenMatch[1]);
        }
    });

    // Second pass: validate
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const trimmed = line.trim();
        const indent = line.search(/\S/);

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
            continue;
        }

        // Check for selector (root level with colon)
        if (indent === 0 && trimmed.endsWith(':') && !trimmed.startsWith('colors') && !trimmed.startsWith('sizes')) {
            currentSelector = trimmed;
            currentSelectorLine = lineIndex;
            currentProperties = new Set();
            currentNestedProperties = new Set();
            inNestedBlock = false;
            continue;
        }

        // === ERROR: Missing colon on selector-like lines ===
        if (indent === 0 && /^[.#]?[a-zA-Z][a-zA-Z0-9_-]*$/.test(trimmed) && !trimmed.startsWith('component')) {
            diagnostics.push(createDiagnostic(
                lineIndex, 0, trimmed.length,
                `Missing colon after selector '${trimmed}'. Did you mean '${trimmed}:'?`,
                vscode.DiagnosticSeverity.Error,
                'missing-colon'
            ));
            continue;
        }

        // === ERROR: Invalid pseudo-class ===
        if (indent > 0 && trimmed.endsWith(':') && !trimmed.startsWith('@')) {
            const pseudo = trimmed.replace(':', '');
            if (VALID_PSEUDO.has(pseudo)) {
                // Valid pseudo-class - reset properties for this nested block
                currentNestedProperties = new Set();
                inNestedBlock = true;
            } else if (!trimmed.startsWith('component') && !trimmed.startsWith('colors') && !trimmed.startsWith('sizes')) {
                const suggestion = findClosestMatch(pseudo, Array.from(VALID_PSEUDO));
                const message = suggestion
                    ? `Unknown pseudo-class '${pseudo}'. Did you mean '${suggestion}'?`
                    : `Unknown pseudo-class '${pseudo}'. Valid options: ${Array.from(VALID_PSEUDO).join(', ')}`;
                diagnostics.push(createDiagnostic(
                    lineIndex, indent, trimmed.length,
                    message,
                    vscode.DiagnosticSeverity.Warning,
                    'unknown-pseudo'
                ));
            }
        }

        // === ERROR: Invalid media query ===
        if (indent > 0 && trimmed.startsWith('@') && trimmed.endsWith(':')) {
            const media = trimmed.replace(':', '');
            if (VALID_MEDIA.has(media)) {
                // Valid media query - reset properties for this nested block
                currentNestedProperties = new Set();
                inNestedBlock = true;
            } else {
                diagnostics.push(createDiagnostic(
                    lineIndex, indent, trimmed.length,
                    `Unknown media query '${media}'. Valid options: ${Array.from(VALID_MEDIA).join(', ')}`,
                    vscode.DiagnosticSeverity.Warning,
                    'unknown-media'
                ));
            }
        }

        // === ERROR: 'use' with undefined component ===
        const useMatch = trimmed.match(/^use\s+([a-zA-Z][a-zA-Z0-9_-]*)/);
        if (useMatch) {
            const componentName = useMatch[1];
            usedComponents.add(componentName);
            // Check both local definitions and imported components
            if (!definedComponents.has(componentName) && !importedComponents.has(componentName)) {
                diagnostics.push(createDiagnostic(
                    lineIndex, indent, trimmed.length,
                    `Component '${componentName}' is not defined. Define it with 'component ${componentName}:'`,
                    vscode.DiagnosticSeverity.Error,
                    'undefined-component'
                ));
            } else if (definedComponents.has(componentName)) {
                definedComponents.get(componentName).used = true;
            }
        }

        // === WARNING: Typo detection ===
        const firstWord = trimmed.split(' ')[0].toLowerCase();
        if (TYPO_CORRECTIONS[firstWord]) {
            const correction = TYPO_CORRECTIONS[firstWord];
            diagnostics.push(createDiagnostic(
                lineIndex, indent, firstWord.length,
                `Typo: '${firstWord}' → Did you mean '${correction}'?`,
                vscode.DiagnosticSeverity.Warning,
                'typo'
            ));
        }

        // === WARNING: Invalid color shade ===
        const colorMatch = trimmed.match(/([a-z]+)-(\d+)/g);
        if (colorMatch) {
            colorMatch.forEach(color => {
                const [name, shade] = color.split('-');
                if (TAILWIND_COLORS.has(name) && !VALID_SHADES.has(shade)) {
                    const startPos = line.indexOf(color);
                    diagnostics.push(createDiagnostic(
                        lineIndex, startPos, color.length,
                        `Invalid shade '${shade}' for color '${name}'. Valid shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`,
                        vscode.DiagnosticSeverity.Warning,
                        'invalid-shade'
                    ));
                }
            });
        }

        // === WARNING: Duplicate properties ===
        if (indent > 0 && currentSelector && !trimmed.endsWith(':') && !trimmed.startsWith('use')) {
            const propName = firstWord;
            const propsSet = inNestedBlock ? currentNestedProperties : currentProperties;
            if (propsSet.has(propName) && KNOWN_PROPERTIES.has(propName)) {
                diagnostics.push(createDiagnostic(
                    lineIndex, indent, propName.length,
                    `Duplicate property '${propName}' in this block`,
                    vscode.DiagnosticSeverity.Hint,
                    'duplicate-property'
                ));
            }
            propsSet.add(propName);
        }

        // === WARNING: Unknown property ===
        if (indent > 0 && !trimmed.endsWith(':') && !trimmed.startsWith('use') && !trimmed.startsWith('#')) {
            const prop = firstWord;
            if (!KNOWN_PROPERTIES.has(prop) && !definedTokens.has(prop)) {
                // Check if it's a color value
                const isColor = TAILWIND_COLORS.has(prop) || TAILWIND_COLORS.has(prop.split('-')[0]);
                if (!isColor && !TYPO_CORRECTIONS[prop]) {
                    const suggestion = findClosestMatch(prop, Array.from(KNOWN_PROPERTIES));
                    const message = suggestion
                        ? `Unknown property '${prop}'. Did you mean '${suggestion}'?`
                        : `Unknown property '${prop}'`;
                    diagnostics.push(createDiagnostic(
                        lineIndex, indent, prop.length,
                        message,
                        vscode.DiagnosticSeverity.Warning,
                        'unknown-property'
                    ));
                }
            }
        }
    }

    // Note: Unused component check disabled because components may be used 
    // in other files that import this one (cross-file tracking not supported)

    diagnosticCollection.set(document.uri, diagnostics);
}

function createDiagnostic(line, start, length, message, severity, code) {
    const range = new vscode.Range(line, start, line, start + length);
    const diagnostic = new vscode.Diagnostic(range, message, severity);
    diagnostic.code = code;
    diagnostic.source = 'Tomato CSS';
    return diagnostic;
}

function findClosestMatch(input, candidates) {
    let closest = null;
    let minDistance = Infinity;

    for (const candidate of candidates) {
        const distance = levenshtein(input.toLowerCase(), candidate.toLowerCase());
        if (distance < minDistance && distance <= 3) {
            minDistance = distance;
            closest = candidate;
        }
    }

    return closest;
}

function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
            );
        }
    }

    return matrix[b.length][a.length];
}

function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}

module.exports = { activate, deactivate };
