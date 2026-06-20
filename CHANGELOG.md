# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- `@dark:` and `@light:` now compile to `@media (prefers-color-scheme: ...)` (were silently emitted as conflicting properties)
- `@wide:` now compiles to a real `@media (max-width: 1536px)` block (was emitted as a broken property)
- ID selectors (`#header:`) were silently swallowed as comments since day one; now they parse and compile correctly
- `//` line comments are now stripped before compilation (were emitted as broken `//: ;` properties)
- Invalid gradient syntax (`bg gradient 6` without `to`) now throws a clear error (was emitted as broken `background: 6;`)
- Missing colon on a selector line (`button\n  pad 4`) now throws with line/column (was silently skipped)
- Duplicate properties (`pad 4` then `pad 8`) are now de-duplicated; last value wins (were both emitted)
- `use` of an undefined component now throws a clear error (was silently dropped)
- Unknown `@`-prefixed properties now throw a clear error (were emitted as broken CSS)
- Watch mode no longer fires twice on macOS (added 50ms debounce)
- `--watch` exits non-zero when compile errors occur (was always 0)
- `process.exit(1)` on compile errors (was 0, breaking CI)
- Missing `@import` file now exits non-zero with `Cannot import "x.tom": file not found` (was silently swallowed and exited 0)
- Duplicate component definition now throws `Component "btn" is already defined (line N)` (was silently overwriting)
- Comma-separated selectors (`.btn, .btn-large:`) now compile (were silently dropped)
- Compound selectors (`button.btn:`, `a.link:`, `div#header:`, `input[disabled]:`) now compile (were silently dropped)
- Dedupe crash on Sass-style `&.active:` (would have shipped broken in v1.2.0)

### Added
- `@dark:` and `@light:` for prefers-color-scheme media queries
- `@wide:` breakpoint (1536px)
- Real test suite using `node:test` (46 tests, parser + compiler + scope)
- `src/scope.js` shared between CLI and Vite plugin (was duplicated with different implementations)
- `--version` flag
- Line and column tracking in parse AST
- `ParseError` and `CompileError` classes with location info
- `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.editorconfig`
- `IMPROVEMENTS.md` with the backlog of remaining work
- CI workflow at `.github/workflows/ci.yml` (Node 18/20/22 matrix)
- Publish workflow at `.github/workflows/publish.yml` (npm provenance on tag)
- Issue templates (`bug.md`, `feature.md`) and PR template
- Deprecation: committed `.vsix` binary moved to `.gitignore` (use GitHub Releases instead)

### Changed
- `scopeCSS` rewritten: the broken regex-based version in `src/api.js` is replaced by the brace-counting version from the Vite plugin
- Vite plugin: removed `console.log` noise during config resolution; opt-in via `tomato({ debug: true })`
- Parser regex now requires space after `#` for section comments (`# Styles` yes, `#header` no)
- Test script now runs the real suite, not the demo
- README rewritten to be accurate (no emojis, accurate feature list, full property table)

## [1.1.0] - 2024

### Added
- Vite plugin with scoped styles
- VS Code extension with syntax highlighting and diagnostics

## [1.0.4]

### Fixed
- Component nested state bug

## [1.0.3] - 2024

### Added
- Initial release
- Parser, compiler, tokens, CLI
- Component system with `use`
- Pseudo-classes (`hover:`, `focus:`, etc.)
- Media queries (`@mobile:`, `@tablet:`, `@laptop:`, `@desktop:`)
- All 22 Tailwind color palettes
- Spacing, radius, shadow, font-size tokens
- `@import` for multi-file projects
- Watch mode
