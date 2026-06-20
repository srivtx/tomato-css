#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parse, ParseError } = require('./parser');
const { compile, CompileError } = require('./compiler');

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
  Tomato - The Human-Friendly CSS Preprocessor

  Usage:
    tomato <input.tom> [-o output.css]
    tomato --watch <input.tom> [-o output.css]
    tomato --version

  Examples:
    tomato app.tom
    tomato app.tom -o styles.css
    tomato --watch app.tom -o styles.css

  Import files:
    @import "components.tom"
    @import "./buttons.tom"
  `);
    process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('../package.json');
    console.log(`tomato v${pkg.version}`);
    process.exit(0);
}

let inputFile = null;
let outputFile = null;
let watchMode = false;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '-o' && args[i + 1]) {
        outputFile = args[i + 1];
        i++;
    } else if (args[i] === '--watch' || args[i] === '-w') {
        watchMode = true;
    } else if (!args[i].startsWith('-')) {
        inputFile = args[i];
    }
}

if (!inputFile) {
    console.error('Error: No input file specified');
    process.exit(1);
}

inputFile = path.resolve(inputFile);
if (!outputFile) {
    outputFile = inputFile.replace(/\.tom$/, '.css');
}
outputFile = path.resolve(outputFile);

function resolveImports(filePath, imported = new Set()) {
    if (imported.has(filePath)) {
        console.warn(`Warning: Circular import detected: ${path.basename(filePath)}`);
        return '';
    }
    imported.add(filePath);

    const dir = path.dirname(filePath);
    let source = fs.readFileSync(filePath, 'utf8');

    const importRegex = /^@import\s+["'](.+?)["']\s*$/gm;
    let match;
    const imports = [];

    while ((match = importRegex.exec(source)) !== null) {
        const importPath = match[1];
        const fullPath = path.resolve(dir, importPath.endsWith('.tom') ? importPath : importPath + '.tom');
        imports.push({ statement: match[0], path: fullPath });
    }

    for (const imp of imports) {
        try {
            const importedContent = resolveImports(imp.path, new Set(imported));
            source = source.replace(imp.statement, `# Imported from ${path.basename(imp.path)}\n${importedContent}`);
        } catch (err) {
            if (err.code === 'ENOENT') {
                throw new Error(`Cannot import "${path.basename(imp.path)}": file not found`);
            }
            throw err;
        }
    }

    return source;
}

function getImportedFiles(filePath, files = new Set()) {
    if (files.has(filePath)) return files;
    files.add(filePath);

    const dir = path.dirname(filePath);
    const source = fs.readFileSync(filePath, 'utf8');
    const importRegex = /^@import\s+["'](.+?)["']\s*$/gm;
    let match;

    while ((match = importRegex.exec(source)) !== null) {
        const importPath = match[1];
        const fullPath = path.resolve(dir, importPath.endsWith('.tom') ? importPath : importPath + '.tom');
        if (fs.existsSync(fullPath)) {
            getImportedFiles(fullPath, files);
        }
    }

    return files;
}

let hasErrors = false;

function compileFile() {
    try {
        const source = resolveImports(inputFile);
        const ast = parse(source);
        const css = compile(ast);

        fs.writeFileSync(outputFile, css);
        console.log(`Compiled: ${path.basename(inputFile)} -> ${path.basename(outputFile)}`);
        hasErrors = false;
    } catch (err) {
        hasErrors = true;
        console.error(`\nError in ${path.basename(inputFile)}:`);
        console.error(`  ${err.message}\n`);
    }
}

compileFile();
if (hasErrors) process.exit(1);

if (watchMode) {
    console.log(`\nWatching for changes...`);

    const filesToWatch = getImportedFiles(inputFile);
    const debounceTimers = new Map();

    filesToWatch.forEach(file => {
        fs.watch(file, (eventType) => {
            if (eventType === 'change') {
                if (debounceTimers.has(file)) {
                    clearTimeout(debounceTimers.get(file));
                }
                debounceTimers.set(file, setTimeout(() => {
                    console.log(`\n${path.basename(file)} changed`);
                    compileFile();
                    if (hasErrors) {
                        console.error(`Compilation failed - ${path.basename(outputFile)} may be stale`);
                    }
                }, 50));
            }
        });
    });

    console.log(`  Watching ${filesToWatch.size} file(s)`);
}
