# vite-plugin-tomato 🍅

Vite plugin for [Tomato CSS](https://github.com/srivtx/tomato-css) - Write human-friendly CSS with automatic scoping.

## Features

- 🎯 **Scoped Styles** - Styles are automatically scoped to components
- ⚡ **Hot Reload** - Instant updates when you edit `.tom` files
- 🧩 **Simple API** - Just wrap your component with `withTomato()`
- 📦 **Zero Config** - Works out of the box

## Installation

```bash
npm install vite-plugin-tomato @srivtx/tomato-css
```

## Setup

Add the plugin to your `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tomato from 'vite-plugin-tomato';

export default defineConfig({
  plugins: [react(), tomato()]
});
```

## Usage

### 1. Create a `.tom` file

```
// Button.tom
.btn:
  bg blue-500
  text white
  pad 2 4
  round lg
  
  hover:
    bg blue-600
```

### 2. Import and use in your component

```jsx
// Button.jsx
import { withTomato } from './Button.tom';

function Button({ children }) {
  return <button className="btn">{children}</button>;
}

export default withTomato(Button);
```

That's it! Your styles are automatically scoped to the Button component.

## How Scoping Works

The plugin transforms your CSS selectors to be scoped:

```css
/* Your .tom file */
.btn { background: blue; }

/* Generated CSS */
[data-tom="t7a3b2c"] .btn { background: blue; }
```

The `withTomato()` HOC wraps your component with a scoping element:

```jsx
<div data-tom="t7a3b2c">
  <button className="btn">Click me</button>
</div>
```

This means two components can both use `.btn` without styles conflicting!

## API

### `withTomato(Component)`

Higher-Order Component that wraps your component with scoped styles.

```jsx
import { withTomato } from './MyComponent.tom';

function MyComponent() {
  return <div className="container">...</div>;
}

export default withTomato(MyComponent);
```

## Tomato CSS Syntax

Tomato CSS is a human-friendly CSS preprocessor:

| Tomato | CSS |
|--------|-----|
| `bg blue-500` | `background: #3b82f6;` |
| `text white` | `color: #ffffff;` |
| `pad 2 4` | `padding: 0.5rem 1rem;` |
| `round lg` | `border-radius: 0.5rem;` |
| `shadow md` | `box-shadow: ...;` |

See the full [Tomato CSS documentation](https://github.com/srivtx/tomato-css) for more.

## License

MIT © [srivtx](https://github.com/srivtx)
