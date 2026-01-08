#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parse } = require('./parser');
const { compile } = require('./compiler');

// CLI
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
  🍅 Tomato - The Human-Friendly CSS Preprocessor
  
  Usage:
    tomato <input.tom> [-o output.css]
    tomato --watch <input.tom> [-o output.css]
  
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

// Parse arguments
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

// Resolve paths
inputFile = path.resolve(inputFile);
if (!outputFile) {
  outputFile = inputFile.replace(/\.tom$/, '.css');
}
outputFile = path.resolve(outputFile);

// Resolve imports recursively
function resolveImports(filePath, imported = new Set()) {
  if (imported.has(filePath)) {
    console.warn(`⚠ Circular import detected: ${path.basename(filePath)}`);
    return '';
  }
  imported.add(filePath);

  const dir = path.dirname(filePath);
  let source = fs.readFileSync(filePath, 'utf8');

  // Find all @import statements
  const importRegex = /^@import\s+["'](.+?)["']\s*$/gm;
  let match;
  const imports = [];

  while ((match = importRegex.exec(source)) !== null) {
    const importPath = match[1];
    const fullPath = path.resolve(dir, importPath.endsWith('.tom') ? importPath : importPath + '.tom');
    imports.push({ statement: match[0], path: fullPath });
  }

  // Replace imports with their content
  for (const imp of imports) {
    try {
      const importedContent = resolveImports(imp.path, new Set(imported));
      source = source.replace(imp.statement, `# Imported from ${path.basename(imp.path)}\n${importedContent}`);
    } catch (err) {
      console.error(`✗ Cannot import "${path.basename(imp.path)}": ${err.message}`);
      source = source.replace(imp.statement, `# Failed to import: ${imp.path}`);
    }
  }

  return source;
}

// Get all imported file paths for watching
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

// Compile function
function compileFile() {
  try {
    const source = resolveImports(inputFile);
    const ast = parse(source);
    const css = compile(ast);

    fs.writeFileSync(outputFile, css);
    console.log(`✓ Compiled: ${path.basename(inputFile)} → ${path.basename(outputFile)}`);
  } catch (err) {
    console.error(`\n✗ Error in ${path.basename(inputFile)}:`);
    console.error(`  ${err.message}\n`);
  }
}

// Run
compileFile();

if (watchMode) {
  console.log(`\nWatching for changes...`);

  // Watch main file and all imports
  const filesToWatch = getImportedFiles(inputFile);

  filesToWatch.forEach(file => {
    fs.watch(file, (eventType) => {
      if (eventType === 'change') {
        console.log(`\n📝 ${path.basename(file)} changed`);
        compileFile();
      }
    });
  });

  console.log(`  Watching ${filesToWatch.size} file(s)`);
}

