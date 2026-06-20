const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parse, ParseError } = require('../src/parser');

test('parses simple selector with props', () => {
    const ast = parse('button:\n  pad 4\n  bg blue-500');
    assert.equal(ast.styles.button.props.length, 2);
    assert.equal(ast.styles.button.props[0], 'pad 4');
    assert.equal(ast.styles.button.props[1], 'bg blue-500');
});

test('parses component definition', () => {
    const ast = parse('component btn:\n  pad 2 4\n  round lg');
    assert.equal(ast.components.btn.props.length, 2);
});

test('parses tokens (colors)', () => {
    const ast = parse('colors:\n  primary blue-500\n  dark slate-900');
    assert.equal(ast.tokens.colors.primary, 'blue-500');
    assert.equal(ast.tokens.colors.dark, 'slate-900');
});

test('parses nested pseudo-class', () => {
    const ast = parse('button:\n  bg blue-500\n  hover:\n    bg blue-600');
    assert.equal(ast.styles.button.props.length, 1);
    assert.equal(ast.styles.button.nested.hover.length, 1);
    assert.equal(ast.styles.button.nested.hover[0], 'bg blue-600');
});

test('parses @mobile media query', () => {
    const ast = parse('hero:\n  pad 16\n  @mobile:\n    pad 4');
    assert.deepEqual(Object.keys(ast.styles.hero.nested), ['@mobile']);
});

test('parses @dark and @light', () => {
    const ast = parse('button:\n  @dark:\n    bg black\n  @light:\n    bg white');
    assert.ok(ast.styles.button.nested['@dark']);
    assert.ok(ast.styles.button.nested['@light']);
});

test('tracks line number on selector', () => {
    const ast = parse('\n\nbutton:\n  pad 4');
    assert.equal(ast.styles.button.loc.line, 3);
});

test('throws on missing colon (line 1, col 1)', () => {
    assert.throws(
        () => parse('button\n  pad 4'),
        err => err instanceof ParseError && err.line === 1 && err.column === 1
    );
});

test('strips // line comments', () => {
    const ast = parse('// header comment\nbutton:\n  // inner comment\n  pad 4');
    assert.equal(ast.styles.button.props.length, 1);
    assert.equal(ast.styles.button.props[0], 'pad 4');
});

test('handles @import statements without losing structure', () => {
    const ast = parse('@import "components.tom"\n\nbutton:\n  use btn');
    assert.equal(ast.styles.button.props[0], 'use btn');
});

test('throws on duplicate component definition', () => {
    assert.throws(
        () => parse('component btn:\n  pad 4\n\ncomponent btn:\n  bg red'),
        err => err instanceof ParseError && /already defined/.test(err.message) && /line 1/.test(err.message)
    );
});

test('parses compound selector (button.btn)', () => {
    const ast = parse('button.btn:\n  pad 4');
    assert.ok(ast.styles['button.btn']);
    assert.equal(ast.styles['button.btn'].props[0], 'pad 4');
});

test('parses compound ID selector (div#header)', () => {
    const ast = parse('div#header:\n  bg black');
    assert.ok(ast.styles['div#header']);
});

test('parses multiple compound selectors', () => {
    const ast = parse('a.link, button.btn:\n  pad 4');
    assert.ok(ast.styles['a.link, button.btn']);
});

test('parses element + class + attr compound', () => {
    const ast = parse('input[disabled]:\n  opacity 0.5');
    assert.ok(ast.styles['input[disabled]']);
});
