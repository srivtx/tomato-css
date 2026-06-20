const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parse } = require('../src/parser');
const { compile } = require('../src/compiler');
const { generateScopeId, scopeCSS } = require('../src/scope');

test('generateScopeId is deterministic', () => {
    const a = generateScopeId('foo');
    const b = generateScopeId('foo');
    assert.equal(a, b);
});

test('generateScopeId is different for different inputs', () => {
    assert.notEqual(generateScopeId('a'), generateScopeId('b'));
});

test('scopeCSS prefixes simple selector', () => {
    const css = '.btn { color: red; }';
    const out = scopeCSS(css, 'abc123');
    assert.match(out, /\[data-tom="abc123"\] \.btn/);
});

test('scopeCSS prefixes comma-separated selectors', () => {
    const css = '.a, .b { color: red; }';
    const out = scopeCSS(css, 'x');
    assert.match(out, /\[data-tom="x"\] \.a, \[data-tom="x"\] \.b/);
});

test('scopeCSS does NOT scope @media block selectors', () => {
    const css = '@media (max-width: 640px) {\n  .a { color: red; }\n}';
    const out = scopeCSS(css, 'x');
    assert.match(out, /\[data-tom="x"\] \.a/);
    assert.match(out, /@media/);
});

test('scopeCSS does NOT scope @keyframes', () => {
    const css = '@keyframes spin {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}';
    const out = scopeCSS(css, 'x');
    assert.match(out, /@keyframes spin/);
    assert.doesNotMatch(out, /\[data-tom/);
});

test('scopeCSS handles nested @media correctly', () => {
    const css = '.a { color: red; }\n@media (max-width: 640px) {\n  .a { color: blue; }\n}\n.b { color: green; }';
    const out = scopeCSS(css, 'x');
    const matches = out.match(/\[data-tom="x"\]/g) || [];
    assert.equal(matches.length, 3);
});
