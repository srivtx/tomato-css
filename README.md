<div align="center">

<img src="logo.svg" alt="Tomato CSS" width="80" height="80">

# Tomato CSS

**The Human-Friendly CSS Preprocessor**

Write CSS like you think. Components, Tailwind colors, and human-readable syntax.

[npm](https://www.npmjs.com/package/@srivtx/tomato-css) · [Docs](https://github.com/srivtx/tomato-css#documentation) · [Vite Plugin](https://www.npmjs.com/package/vite-plugin-tomato) · [VS Code](https://github.com/srivtx/tomato-css/releases/latest)

</div>

---

## Why Tomato

CSS preprocessors should make your life easier, not give you a new syntax to memorize. Tomato takes the parts that actually help (components, design tokens, breakpoint shortcuts) and skips the parts that don't (arithmetic expressions, custom nesting rules, config files).

- **Components** — define once, use everywhere. No extra `@mixin` ceremony.
- **Tailwind colors** — all 22 palettes, 11 shades each, built in. `blue-500` works.
- **Human syntax** — `row spread` instead of `display: flex; justify-content: space-between`.
- **Real errors** — missing colon, undefined component, bad gradient all throw with line/column.
- **Zero config** — drop a `.tom` file in your project, run one command, get CSS.
- **Vite plugin** — automatic scoped styles, like CSS Modules but with the syntax you want.

## Quick Start

```bash
npm install @srivtx/tomato-css
```

Create `styles.tom`:

```tom
component btn:
  pad 2 4
  round lg
  pointer
  smooth

button:
  use btn
  bg blue-500
  color white

  hover:
    bg blue-600
    shadow lg

  @dark:
    bg slate-900
```

Compile:

```bash
npx tomato styles.tom -o styles.css
```

Output:

```css
button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #3b82f6;
  color: #ffffff;
}
button:hover {
  background: #2563eb;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
@media (prefers-color-scheme: dark) {
  button {
    background: #0f172a;
  }
}
```

That's it. No build pipeline to configure, no plugins to enable, no `postcss.config.js`.

## Documentation

### Selectors

```tom
button:          # HTML element
.btn-primary:    # Class
#header:         # ID
card:            # Becomes .card
.btn, .btn-large:  # Multiple selectors
button.btn:        # Compound selector
input[disabled]:   # Attribute selector
```

### Components

```tom
component btn:
  pad 2 4
  round lg

button:
  use btn
  bg blue-500
```

Components can `use` other components. Nested blocks inside a component (like `hover:`) are merged into the using selector.

### Pseudo-classes

```tom
button:
  bg blue-500

  hover:
    bg blue-600

  focus:
    ring 2px solid blue-400

  disabled:
    opacity 0.5
```

Supported: `hover`, `active`, `focus`, `disabled`, `visited`, `first-child`, `last-child`, `focus-within`, `focus-visible`, `placeholder`.

### Responsive

```tom
hero:
  pad 16
  grid 3

  @mobile:
    pad 4
    grid 1

  @tablet:
    grid 2

  @wide:
    pad 32
```

| Breakpoint  | Max-width |
|-------------|-----------|
| `@mobile`   | 640px     |
| `@tablet`   | 768px     |
| `@laptop`   | 1024px    |
| `@desktop`  | 1280px    |
| `@wide`     | 1536px    |

### Color scheme

```tom
card:
  bg white
  color slate-900

  @dark:
    bg slate-900
    color white

  @light:
    bg white
    color slate-900
```

Emits `@media (prefers-color-scheme: dark)` and `@media (prefers-color-scheme: light)` blocks.

### Custom tokens

```tom
colors:
  primary blue-500
  dark slate-900
  brand "#ff5500"

button:
  bg primary
  color white
  border 1px solid brand
```

### File imports

```tom
@import "components.tom"
@import "./buttons.tom"
```

Imports are resolved relative to the importing file. Missing imports fail the build with a clear error.

## Property Reference

| Tomato | CSS |
|--------|-----|
| `bg blue-500` | `background: #3b82f6` |
| `color white` | `color: #ffffff` |
| `text blue-500` | `color: #3b82f6` (alias) |
| `pad 2 4` | `padding: 0.5rem 1rem` |
| `m 4` | `margin: 1rem` |
| `round lg` | `border-radius: 0.5rem` |
| `shadow md` | `box-shadow: ...` |
| `row` | `display: flex; flex-direction: row` |
| `row spread` | `...; justify-content: space-between` |
| `row center` | `...; justify-content: center` |
| `column center` | `...; align-items: center` |
| `center all` | `display: flex; justify-content: center; align-items: center` |
| `grid 3` | `display: grid; grid-template-columns: repeat(3, 1fr)` |
| `gap 4` | `gap: 1rem` |
| `w-full` | `width: 100%` |
| `bold` | `font-weight: bold` |
| `pointer` | `cursor: pointer` |
| `smooth` | `transition: all 0.2s ease` |
| `bg gradient blue-500 to violet-500` | `background: linear-gradient(135deg, ...)` |
| `no border` | `border: none` |
| `no outline` | `outline: none` |

For anything not in the table, write the CSS directly: `transform rotate(45deg)`, `animation fade-in 1s ease`, `filter blur(4px)`. The compiler passes through any `property value` it doesn't recognize.

## Colors

All 22 Tailwind palettes, 11 shades each (50-950), plus `white`, `black`, `transparent`.

```tom
bg rose-500
color slate-900
border 1px solid blue-400
```

## Installation

### Project install (recommended)

```bash
cd your-project
npm install @srivtx/tomato-css
```

```json
{
  "scripts": {
    "build:css": "tomato src/styles.tom -o dist/styles.css",
    "watch:css": "tomato --watch src/styles.tom -o dist/styles.css"
  }
}
```

### Global install

```bash
npm install -g @srivtx/tomato-css
tomato app.tom -o styles.css
```

### Watch mode

```bash
npx tomato --watch src/styles.tom -o dist/styles.css
```

Watches the input file and all `@import`-ed files. Debounced, exits non-zero on errors.

## CLI

```bash
tomato <input.tom> [-o output.css]
tomato --watch <input.tom> [-o output.css]
tomato --version
tomato --help
```

Exits non-zero on compile errors so CI can detect failures.

## Vite Plugin

```bash
npm install vite-plugin-tomato @srivtx/tomato-css
```

```js
// vite.config.js
import tomato from 'vite-plugin-tomato';

export default {
  plugins: [tomato()]
};
```

```jsx
// Button.jsx
import { withTomato } from './Button.tom';

function Button({ children }) {
  return <button className="btn">{children}</button>;
}

export default withTomato(Button);
```

Styles are automatically scoped. HMR works out of the box.

See [vite-plugin-tomato/README.md](./vite-plugin-tomato/README.md) for the full API.

## VS Code Extension

Download the latest `.vsix` from [GitHub Releases](https://github.com/srivtx/tomato-css/releases/latest) and install via Extensions → `...` → "Install from VSIX".

- Syntax highlighting for `.tom` files
- Custom file icon
- Error detection (undefined components, invalid color shades, typos, missing colons)
- Autocomplete for properties, colors, defined components, pseudo-classes, media queries

See [vscode-tomato/README.md](./vscode-tomato/README.md) for the full feature list.

## Comparison

| | Tomato | Sass | Less | Stylus | Tailwind |
|---|---|---|---|---|---|
| Components | `component btn:` + `use btn` | `@mixin btn` + `@include` | `.btn()` mixin | `btn()` function | `@apply` (build-time) |
| Colors | Built-in 22 palettes | None (config) | None (config) | None (config) | Built-in |
| Arithmetic in values | No (intentional) | Yes | Yes | Yes | No |
| Config file | No | Optional `sass.config` | Optional | Optional | `tailwind.config.js` |
| Compile error locations | Yes (line/column) | Yes | Yes | Yes | Yes |
| Scoped styles | Vite plugin | `@use` modules | Pattern | No | No |
| CSS output | Standard | Standard | Standard | Standard | Purged utility classes |
| Install | `npm i` | `npm i` | `npm i` | `npm i` | `npm i` |
| Bundle size (npm) | ~16 kB | ~1.4 MB (dart-sass) | ~3 MB | ~200 kB | ~3 MB (full) |

Tomato is for the developer who thinks `row spread` is a clearer expression than `display: flex; justify-content: space-between`, who wants Tailwind's color palette without the utility-class explosion, and who doesn't want to learn a configuration file before their first compile.

## Project Structure

```
tomato-css/
  src/                  - core compiler
    parser.js           - .tom source -> AST
    compiler.js         - AST -> CSS
    tokens.js           - Tailwind colors, spacing, etc.
    api.js              - programmatic API
    scope.js            - shared scopeCSS (used by CLI + Vite plugin)
    index.js            - CLI entry
  tests/                - 46 tests, node:test
  examples/             - .tom demo files
  docs/                 - static website
  vite-plugin-tomato/   - Vite plugin
  vscode-tomato/        - VS Code extension
```

## Development

```bash
git clone https://github.com/srivtx/tomato-css.git
cd tomato-css
npm install
npm test
```

Node 14+ required. Tests use Node's built-in `node:test`, no extra deps.

Run the docs site locally:

```bash
python3 -m http.server 8765
# open http://localhost:8765/docs/
```

## Contributing

Bug reports and PRs welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow.

The backlog of unimplemented improvements is in [IMPROVEMENTS.md](./IMPROVEMENTS.md). Pick any item and open a PR.

## License

MIT © srivtx — see [LICENSE](./LICENSE)

---

<div align="center">

Fresh styles, no ketchup required.

</div>
