# 🍅 Tomato CSS

**The Human-Friendly CSS Preprocessor**

Write CSS like you think. Components, Tailwind colors, and human-readable syntax.

## Installation

### Global Install (Recommended)

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

Install the Tomato CSS extension for:
- Syntax highlighting
- Error detection
- Autocomplete
- Typo suggestions

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
