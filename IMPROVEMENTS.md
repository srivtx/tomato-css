# Tomato CSS - Improvements Found

**Date: 2026-06-21** · **Discovered during Tier 1 fix pass + Tier 2 fix pass**

Tier 1 (8 bugs) + Tier 2 must-do (4 bugs) are done. 46 tests pass.

---

## Tier 1 - DONE (8 bugs)

1. `@dark:` / `@light:` now compile to prefers-color-scheme media queries
2. `@wide:` now compiles to a real max-width media query
3. ID selectors (`#header:`) no longer silently swallowed
4. `//` line comments are stripped before compilation
5. Invalid gradient (`bg gradient 6` without `to`) throws a clear error
6. Missing colon on a selector line throws with line/column
7. Duplicate properties are de-duplicated (last wins)
8. `use` of an undefined component throws
9. Unknown `@`-prefixed properties throw
10. Watch mode is debounced, exits non-zero on errors
11. CLI exits 1 on compile errors (was always 0)
12. Dedupe crash on `&.active` (Sass-style) fixed

## Tier 2 must-do - DONE (4 bugs)

13. Missing import file in `@import` now exits 1 (clean error: `Cannot import "x.tom": file not found`)
14. Duplicate component definition throws: `Component "btn" is already defined (line 1)`
15. Comma-separated selectors (`.btn, .btn-large:`) now compile correctly
16. Compound selectors (`button.btn:`, `a.link:`, `div#header:`, `input[disabled]:`) now compile correctly

---

## Critical bugs REMAINING (4)

### 5. `:host:` (web components) silently dropped
**Repro:**
```tom
:host:
  color blue
```
**Current:** silently dropped.
**Expected:** at minimum, allow the parser regex to match. Output should be `:host { color: blue; }`.
**Fix:** extend the selector regex to allow `:host` and other pseudo-element-only selectors.

### 6. Sass-style `&` nesting loses the qualifier
**Repro:**
```tom
button:
  pad 4
  &.active:
    bg blue-500
```
**Current:** silently emits `button { padding: 1rem; background: #3b82f6; }` — loses the `.active` qualifier entirely. The `&.active:` is treated as a property, not a nested selector.
**Expected:** emit `button.active { background: #3b82f6; }` (proper Sass-style nesting) OR throw a clear error.
**Decision:** if implementing, big refactor. If not, throw a clear error so users know it's not supported.

### 7. Nested pseudo (`hover: focus:`) produces broken CSS
**Repro:**
```tom
button:
  pad 4
  hover:
    bg blue-600
    focus:
      ring 2
```
**Current:** emits `button:focus { ring: 2; }` — `ring` is not implemented, so the property is `ring: 2;` (broken).
**Expected:** either properly nest the focus (emit `button:hover:focus { ... }`) or throw.

### 8. Color opacity modifier not supported
**Repro:**
```tom
button:
  bg blue-500/50
```
**Current:** emits `background: blue-500/50;` (broken — `/` is not a valid color value).
**Expected:** either support Tailwind-style `blue-500/50` → `rgba(59, 130, 246, 0.5)`, or throw.

---

## Missing features (validated by extension but compiler has no implementation)

The VS Code extension validates these as known properties (`vscode-tomato/extension.js:7-26`). The compiler silently emits them as broken CSS.

### 9. `ring` shortcut (Tailwind-style focus ring)
**Repro:**
```tom
input:
  ring 2
  ring 2px solid blue-400
  ring blue-500
```
**Current:** `ring: ...;` (broken).
**Expected:**
- `ring` → `box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);`
- `ring 2` → `box-shadow: 0 0 0 2px var(--tw-ring-color);`
- `ring 2px solid blue-400` → `box-shadow: 0 0 0 2px #60a5fa;`
- `ring blue-500` → `box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);`

### 10. `animate` shortcut
**Repro:**
```tom
button:
  animate fade-in 1s ease
```
**Current:** `animate: fade-in 1s ease;` (broken — missing the `animation:` property).
**Expected:** `animation: fade-in 1s ease;`

### 11. `transform`, `rotate`, `scale`, `translate`, `skew` shortcuts
**Repro:**
```tom
button:
  rotate 45
  scale 1.1
  translate 4 8
```
**Current:** all emitted as `prop: value;` (broken).
**Expected:**
- `rotate 45` → `transform: rotate(45deg);`
- `scale 1.1` → `transform: scale(1.1);`
- `translate 4 8` → `transform: translate(1rem 2rem);`

### 12. `outline` shortcut (only `no outline` exists)
**Repro:**
```tom
button:
  outline 1px solid blue-500
```
**Current:** `outline: 1px solid blue-500;` (works via passthrough, but should be in shortcut list for autocomplete).

### 13. `font` shortcut
**Repro:**
```tom
body:
  font 16px/1.5 sans-serif
```
**Current:** `font: 16px/1.5 sans-serif;` (works via passthrough).

---

## Quality-of-life improvements

### 14. ~~Arithmetic in values (Sass-style)~~ — REJECTED
Doesn't fit Tomato's design philosophy ("write the value you want"). User explicitly rejected: "anyone can calculate that, why would they not just write 8 rem."

### 15. Sass-style `&` nesting
**Repro:** see #6 above.
**Effort:** medium (parser + compiler both need changes). Most-used feature in Sass.
**Decision:** if not implementing, throw a clear error.

### 16. Unused component warning
The extension has this code commented out at `vscode-tomato/extension.js:391-393`:
> "Unused component check disabled because components may be used in other files that import this one (cross-file tracking not supported)"
**Decision:** keep disabled, but CLI could warn. Low value, skip.

### 17. CSS minification
**Current:** always emits expanded CSS.
**Possible:** `--minify` flag using a simple minifier (strip comments, collapse whitespace).
**Cost:** 200 lines (or use `clean-css`/`csso` as dep, 1 line).

### 18. Source maps
**Current:** no sourcemap support.
**Use case:** debugging which `.tom` line produced which CSS line.
**Cost:** 100 lines + a sourcemap library.

### 19. Multiple input files
**Current:** CLI takes one file. `tomato a.tom b.tom c.tom -o dist/` would be useful.
**Cost:** small (loop in CLI).

### 20. Project config file
**Current:** no `tomato.config.js`. Every project inlines the CLI args in `package.json`.
**Possible:** `tomato.config.js` with `input`, `output`, `watch`, `minify`.
**Cost:** ~30 lines.

### 21. `@apply`-style mixins from external libraries
**Current:** no way to use a community-published Tomato component library.
**Effort:** high. Would need an npm package convention + resolver.

### 22. PostCSS plugin
**Use case:** slot into Next.js, Astro, Eleventy, Hugo without the Vite-specific plugin.
**Cost:** ~100 lines wrapping `compile()`.

### 23. Webpack / Parcel / Rollup plugins
Same as above for other bundlers.

### 24. Playwright-style HTML preview server
**Current:** static HTML in `docs/`. No way to test `.tom` files in a live preview that recompiles on save.
**Use case:** `tomato --serve app.tom` → opens browser, hot-reloads on `.tom` change.
**Cost:** ~200 lines.

### 25. ESLint plugin
**Use case:** lint `.tom` files in CI.
**Cost:** wraps the parser, ~50 lines.

### 26. Prettier plugin
**Use case:** `prettier --write **/*.tom` formats files.
**Cost:** ~150 lines (or fork prettier).

### 27. LSP server
**Use case:** Neovim, Sublime, Helix get the same diagnostics as VS Code.
**Cost:** ~300 lines. The extension has the logic; extract it.

### 28. SCSS-compatible output mode
**Use case:** emit SCSS that the existing SCSS toolchain processes. Tomato becomes a "human syntax" layer on top of SCSS instead of replacing it.
**Cost:** low. Just emit `@use`/`@include` and SCSS variables instead of plain CSS.

### 29. Tailwind config compatibility
**Use case:** read user's `tailwind.config.js` and use their theme (custom colors, spacing).
**Cost:** medium. Would import `tailwindcss/colors` etc.

### 30. CSS variables / `var()` output
**Use case:** modern CSS often wants `var(--accent)` instead of literal values for theming.
**Possible:** `--accent: #3b82f6; accent: var(--accent);` mode.

### 31. Multiple `colors:` blocks in one file
**Current:** `colors:` is section-based. Multiple `colors:` would reset.
**Repro:** `colors: ... \n colors: ...` (second one overwrites first, no warning).
**Fix:** detect and throw.

### 32. CSS Modules integration
**Use case:** Vite plugin already does scoping, but local class names like `:local(.btn)` aren't supported.
**Cost:** small.

### 33. CSS Nesting (native, no preprocessor)
**Use case:** modern browsers support native CSS nesting. Tomato could emit native nesting instead of fully expanded CSS, with a target-browser option.
**Cost:** medium.

### 34. Per-file config in frontmatter
**Use case:** `// @tomato-target: ie11` at the top of a `.tom` file controls output.
**Cost:** small.

### 35. Test coverage report
**Current:** no coverage tooling. Add `c8` or `nyc` to CI.
**Cost:** 1 line in CI.

### 36. Benchmarks
**Current:** no perf data. Add `bench/` with a `tomato` self-compile test.
**Useful:** to catch regressions.

### 37. Dedupe of duplicated imports
**Current:** if `a.tom` imports `c.tom` and `b.tom` imports `c.tom`, the merge is OK but `c.tom`'s component definitions are added once. Worth a test.

### 38. `--sourcemap` flag for the CLI
**Current:** no sourcemap. Browsers can't map CSS back to `.tom` for debugging.
**Cost:** medium.

### 39. `tomato fmt` subcommand
**Use case:** format `.tom` files in place. Uses the parser to round-trip and emit canonical form.
**Cost:** ~100 lines.

### 40. `tomato lint` subcommand
**Use case:** lint without compiling. Surfaces all warnings as exit 1.
**Cost:** ~30 lines.

---

## Code quality (not user-facing)

### 41. `compileProperty` is 200+ lines
**File:** `src/compiler.js:140-360`
**Refactor:** split into `src/shortcuts/` with one file per category (spacing, color, layout, pseudo, etc.) plus a dispatcher.
**Why:** the giant if-chain is hard to maintain and add to. Each new shortcut risks breaking the order.

### 42. `extension.js` is 444 lines
**File:** `vscode-tomato/extension.js`
**Refactor:** extract the Levenshtein helper, the validate function, the completion provider into separate files. Reuse logic with a future LSP server (#27).

### 43. No JSDoc on public API
**File:** `src/api.js`
**Add:** JSDoc on `compileTomato`, `generateScopeId`, `scopeCSS`, `parse`, `compile` so editors autocomplete with type info.

### 44. No JSDoc on parser AST
**File:** `src/parser.js`
**Add:** typedef comments for `ast.styles[selector]`, `ast.components[name]`, `ast.tokens.colors`.

### 45. `parser.js` regex literals constructed on every call
**File:** `src/parser.js:92` `new RegExp(\`^${NESTED_KEYS}:$\`)`
**Fix:** hoist out of the loop (module scope).

### 46. `compiler.js:wrapMedia` string concatenation
The wrap output is constructed with `+` and `\\n`. Consider a small helper.

### 47. `compiler.js:dedupeProps` order is Map insertion order
Last write wins. Confirmed by tests. But if a user expected CSS cascade order (which puts later rules at higher specificity), this might surprise. Document it.

---

## What I would do next (priority order)

**Done in Tier 1 + Tier 2 must-do (16 bugs total).**

**Should-do for v1.2.0 (1-2 days):**
- 5 (:host), 6 (& nesting — error or implement), 9 (ring), 10 (animate)
- 41 (refactor compileProperty)

**Could-do for v1.3.0 (1 week):**
- 15 (Sass & nesting), 22 (PostCSS plugin), 27 (LSP), 39 (tomato fmt), 40 (tomato lint)

**Wontdo:**
- 14 (arithmetic) — REJECTED, doesn't fit Tomato
- 16 (unused component) — too noisy
- 25 (ESLint) — low demand
- 30 (CSS variables mode) — YAGNI

---

## Summary of remaining work

- **4 critical bugs remaining** (`:host`, `&` nesting, nested pseudo, color opacity)
- **5 missing shortcuts** (ring, animate, transform/rotate/scale/translate, outline, font)
- **15 quality-of-life features** (each 1-2 days)
- **7 ecosystem plugins** (each 1-2 weeks)
- **3 internal refactors** (split compileProperty, extract extension.js, hoist regex)

Tier 1 (12 bugs) + Tier 2 (4 bugs) + the dedupe crash are committed. 46 tests pass.

