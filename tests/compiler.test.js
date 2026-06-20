const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parse } = require('../src/parser');
const { compile, CompileError } = require('../src/compiler');

function compileSource(source) {
    return compile(parse(source));
}

test('compiles basic property shortcuts', () => {
    const css = compileSource('button:\n  pad 2 4\n  round lg\n  bold\n  pointer\n  smooth\n  no border');
    assert.match(css, /padding: 0\.5rem 1rem/);
    assert.match(css, /border-radius: 0\.5rem/);
    assert.match(css, /font-weight: bold/);
    assert.match(css, /cursor: pointer/);
    assert.match(css, /transition: all 0\.2s ease/);
    assert.match(css, /border: none/);
});

test('resolves Tailwind colors', () => {
    const css = compileSource('button:\n  bg blue-500\n  color white');
    assert.match(css, /background: #3b82f6/);
    assert.match(css, /color: #ffffff/);
});

test('compiles flex layouts', () => {
    const css = compileSource('nav:\n  row spread\n  align center');
    assert.match(css, /display: flex/);
    assert.match(css, /justify-content: space-between/);
    assert.match(css, /align-items: center/);
});

test('compiles grid', () => {
    const css = compileSource('gallery:\n  grid 3\n  gap 6');
    assert.match(css, /display: grid/);
    assert.match(css, /grid-template-columns: repeat\(3, 1fr\)/);
});

test('compiles @mobile media query', () => {
    const css = compileSource('hero:\n  pad 16\n  @mobile:\n    pad 4');
    assert.match(css, /@media \(max-width: 640px\)/);
    assert.match(css, /\.hero \{\s*padding: 1rem/);
});

test('compiles @dark prefers-color-scheme', () => {
    const css = compileSource('button:\n  bg white\n  @dark:\n    bg black');
    assert.match(css, /@media \(prefers-color-scheme: dark\)/);
    assert.match(css, /background: #000000/);
});

test('compiles @light prefers-color-scheme', () => {
    const css = compileSource('button:\n  @light:\n    bg white');
    assert.match(css, /@media \(prefers-color-scheme: light\)/);
});

test('compiles @wide breakpoint (1536px)', () => {
    const css = compileSource('hero:\n  @wide:\n    pad 32');
    assert.match(css, /@media \(max-width: 1536px\)/);
});

test('compiles gradient with "to" syntax', () => {
    const css = compileSource('button:\n  bg gradient blue-500 to violet-500');
    assert.match(css, /linear-gradient\(135deg, #3b82f6, #8b5cf6\)/);
});

test('throws on invalid gradient', () => {
    assert.throws(
        () => compileSource('button:\n  bg gradient blue-500'),
        err => err instanceof CompileError && /gradient/i.test(err.message)
    );
});

test('throws on undefined component', () => {
    assert.throws(
        () => compileSource('button:\n  use nonexistent'),
        err => err instanceof CompileError && /nonexistent/.test(err.message)
    );
});

test('throws on unknown breakpoint', () => {
    assert.throws(
        () => compileSource('button:\n  @moble:\n    pad 4'),
        err => err instanceof CompileError && /@moble/.test(err.message)
    );
});

test('expands component "use" into props', () => {
    const css = compileSource('component btn:\n  pad 4\n  bg blue-500\n\nbutton:\n  use btn\n  color white');
    assert.match(css, /\bbutton\s*\{[^}]*padding: 1rem/);
    assert.match(css, /background: #3b82f6/);
    assert.match(css, /color: #ffffff/);
});

test('expands nested blocks from component', () => {
    const css = compileSource('component btn:\n  pad 4\n  hover:\n    bg blue-600\n\nbutton:\n  use btn');
    assert.match(css, /button:hover/);
    assert.match(css, /background: #2563eb/);
});

test('dedupes duplicate properties (last wins)', () => {
    const css = compileSource('button:\n  pad 4\n  pad 8');
    const matches = css.match(/padding:/g) || [];
    assert.equal(matches.length, 1);
    assert.match(css, /padding: 2rem/);
});

test('resolves user-defined color tokens', () => {
    const css = compileSource('colors:\n  brand rose-500\n\nbutton:\n  bg brand');
    assert.match(css, /background: #f43f5e/);
});

test('resolves size tokens for padding', () => {
    const css = compileSource('button:\n  pad 4 8');
    assert.match(css, /padding: 1rem 2rem/);
});

test('compiles pseudo-classes', () => {
    const css = compileSource('button:\n  bg blue-500\n  hover:\n    bg blue-600\n  focus:\n    ring 2px solid blue-400\n  disabled:\n    opacity 0.5');
    assert.match(css, /button:hover\s*\{[^}]*background: #2563eb/);
    assert.match(css, /button:focus\s*\{[^}]*ring/);
    assert.match(css, /button:disabled\s*\{[^}]*opacity: 0\.5/);
});

test('formats bare selectors as classes (default)', () => {
    const css = compileSource('card:\n  pad 4');
    assert.match(css, /\.card/);
});

test('keeps HTML element selectors as-is', () => {
    const css = compileSource('button:\n  pad 4');
    assert.match(css, /\bbutton\s*\{/);
});

test('keeps . and # prefixed selectors as-is', () => {
    const css1 = compileSource('.btn:\n  pad 4');
    assert.match(css1, /\.btn/);

    const css2 = compileSource('#header:\n  bg black');
    assert.match(css2, /#header/);
    assert.match(css2, /background: #000000/);
});

test('emits comma-separated selectors correctly', () => {
    const css = compileSource('.btn, .btn-large:\n  pad 4');
    assert.match(css, /\.btn, \.btn-large/);
    assert.match(css, /padding: 1rem/);
});

test('emits compound selector correctly', () => {
    const css = compileSource('button.btn:\n  pad 4');
    assert.match(css, /button\.btn/);
    assert.match(css, /padding: 1rem/);
});

test('emits multiple compound selectors correctly', () => {
    const css = compileSource('a.link, button.btn:\n  pad 4');
    assert.match(css, /a\.link, button\.btn/);
});
