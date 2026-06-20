# Tomato CSS

The Human-Friendly CSS Preprocessor. Write CSS like you think. Components, Tailwind colors, and human-readable syntax.

[![npm](https://img.shields.io/npm/v/@srivtx/tomato-css)](https://www.npmjs.com/package/@srivtx/tomato-css)
[![npm](https://img.shields.io/npm/v/vite-plugin-tomato?label=vite-plugin)](https://www.npmjs.com/package/vite-plugin-tomato)
[![CI](https://github.com/srivtx/tomato-css/actions/workflows/ci.yml/badge.svg)](https://github.com/srivtx/tomato-css/actions/workflows/ci.yml)

## Why Tomato

- **Reusable components** without the build-step complexity
- **All 22 Tailwind color scales** built in (`blue-500` to `#3b82f6`)
- **Human syntax** — write `row spread` not `display: flex; justify-content: space-between`
- **Responsive** — `@mobile:`, `@tablet:`, `@laptop:`, `@desktop:`, `@wide:`
- **Color scheme** — `@dark:` and `@light:` for prefers-color-scheme
- **Real errors** — bad gradient, undefined component, missing colon all throw with line/column
- **Vite plugin** with scoped styles, like CSS Modules
- **VS Code extension** with diagnostics, autocomplete, typo suggestions

## Installation

### Global install (recommended for one-off use)

```bash
npm install -g @srivtx/tomato-css
tomato app.tom -o styles.css
```

### Project install

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

## Quick Start

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
tomato styles.tom -o styles.css
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

## Syntax

### Selectors

```tom
button:          # HTML element
.btn-primary:    # Class
#header:         # ID
card:            # Becomes .card
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

Components can `use` other components. `hover:`, `focus:`, etc. inside a component are merged into the using selector.

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

Breakpoints: `@mobile` (640px), `@tablet` (768px), `@laptop` (1024px), `@desktop` (1280px), `@wide` (1536px).

### Color scheme

```tom
card:
  bg white
  color slate-900

  @dark:
    bg slate-900
    color white
```

Emits `@media (prefers-color-scheme: dark) { ... }`.

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

Imports are resolved relative to the importing file and merged into one AST before compilation.

## CLI

```bash
# Compile
tomato app.tom -o styles.css

# Watch (recompiles on save, debounced)
tomato --watch app.tom -o styles.css

# Version
tomato --version
```

Exits non-zero on compile errors so CI can detect failures.

## Property reference

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

For anything not in the table, write the CSS directly: `transform rotate(45deg)`, `animation fade-in 1s ease`, `filter blur(4px)`. The compiler passes through any `property value` it doesn't recognize.

## Colors

All 22 Tailwind palettes, 11 shades each (50-950), plus `white`, `black`, `transparent`.

```tom
bg rose-500
color slate-900
border 1px solid blue-400
```

## Vite plugin

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

Styles are automatically scoped. See [vite-plugin-tomato/README.md](./vite-plugin-tomato/README.md) for the full API.

## VS Code extension

Download the latest `.vsix` from [GitHub Releases](https://github.com/srivtx/tomato-css/releases/latest) and install via Extensions → `...` → "Install from VSIX".

Features: syntax highlighting, file icons, error detection (undefined components, invalid color shades, typos, missing colons), autocomplete for properties, colors, and defined components.

## License

MIT © srivtx

---

Fresh styles, no ketchup required.

```bash
npm install -g @srivtx/tomato-css
```

Now use it anywhere:
```bash
tomato app.tom -o styles.css
```

### Project Install

```bash
cd your-project
npm install @srivtx/tomato-css
```

Then use with npx:
```bash
npx tomato app.tom -o styles.css
```

Or add to package.json scripts:
```json
{
  "scripts": {
    "build:css": "tomato src/styles.tom -o dist/styles.css",
    "watch:css": "tomato --watch src/styles.tom -o dist/styles.css"
  }
}
```

### No Install (npx)

```bash
npx @srivtx/tomato-css app.tom -o styles.css
```

## Quick Start

Create a file called `styles.tom`:

```
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
```

Compile it:

```bash
tomato styles.tom -o styles.css
```

## Features

- 📦 **Reusable Components** - Define once, use everywhere
- 🎨 **Tailwind Colors** - All 22 color scales built-in
- ✨ **Human Syntax** - Write `row spread` not `display: flex; justify-content: space-between`
- 📱 **Responsive** - `@mobile:`, `@tablet:`, `@desktop:`
- ⚡ **Fast** - Lightning-fast compilation
- 👀 **Watch Mode** - Auto-recompile on save
- 🔌 **Vite Plugin** - Use in React/Vue with scoped styles

## Vite Plugin

Use Tomato CSS in React, Vue, or Svelte with **automatic scoped styles**:

```bash
npm install vite-plugin-tomato @srivtx/tomato-css
```

```js
// vite.config.js
import tomato from 'vite-plugin-tomato';
export default { plugins: [tomato()] }
```

```jsx
// Button.jsx
import { withTomato } from './Button.tom';

function Button({ children }) {
  return <button className="btn">{children}</button>;
}

export default withTomato(Button);
```

Styles are automatically scoped - no class name conflicts!

→ [Full Vite Plugin Docs](./vite-plugin-tomato/README.md)

## Syntax Reference

### Selectors

```
button:           # HTML element
.btn-primary:     # Class selector
#header:          # ID selector
card:             # Auto-becomes .card
```

### Components

```
component btn:
  pad 2 4
  round lg
  pointer
  smooth

button:
  use btn
  bg blue-500
```

### Pseudo States

```
button:
  bg blue-500
  
  hover:
    bg blue-600
  
  focus:
    ring 2px solid blue-400
  
  disabled:
    opacity 0.5
```

### Responsive Design

```
hero:
  pad 16
  grid 3
  
  @mobile:
    pad 4
    grid 1
  
  @tablet:
    grid 2
```

### Custom Tokens

```
colors:
  primary blue-500
  secondary violet-500
  dark slate-900

button:
  bg primary
  color white
```

### File Imports

```
@import "components.tom"
@import "./buttons.tom"

button:
  use btn
```

## CLI Usage

```bash
# Compile single file
tomato app.tom

# Custom output
tomato app.tom -o styles.css

# Watch mode
tomato --watch app.tom
```

## VS Code Extension

Get the **Tomato CSS VS Code Extension** for the best development experience!

### Installation

**📥 [Download from GitHub Releases](https://github.com/srivtx/tomato-css/releases/latest)**

1. Download `tomato-css-1.0.0.vsix` from the latest release
2. Open VS Code
3. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
4. Click `...` menu → **"Install from VSIX..."**
5. Select the downloaded file

Or install via command line:
```bash
code --install-extension /path/to/tomato-css-1.0.0.vsix
```

### Features
- ✨ Syntax highlighting for `.tom` files
- 🎨 Tomato file icons
- 🔍 Error detection & diagnostics
- 💡 Smart autocomplete
- 🔧 Typo suggestions


## Property Reference

| Tomato | CSS |
|--------|-----|
| `bg blue-500` | `background: #3b82f6` |
| `color white` | `color: #ffffff` |
| `pad 2 4` | `padding: 0.5rem 1rem` |
| `round lg` | `border-radius: 0.5rem` |
| `shadow md` | `box-shadow: ...` |
| `row` | `display: flex; flex-direction: row` |
| `row spread` | `...justify-content: space-between` |
| `center all` | `...justify-content: center; align-items: center` |
| `grid 3` | `display: grid; grid-template-columns: repeat(3, 1fr)` |
| `bold` | `font-weight: bold` |
| `pointer` | `cursor: pointer` |
| `smooth` | `transition: all 0.2s ease` |

## Colors

All Tailwind colors are built-in:

```
slate, gray, zinc, neutral, stone
red, orange, amber, yellow, lime
green, emerald, teal, cyan, sky
blue, indigo, violet, purple
fuchsia, pink, rose

# Shades: 50-950
bg rose-500
color slate-900
```

## License

MIT © srivtx

---

🍅 Fresh styles, no ketchup required.
