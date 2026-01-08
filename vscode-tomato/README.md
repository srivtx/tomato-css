# 🍅 Tomato CSS - VS Code Extension

Syntax highlighting, file icons, and error detection for Tomato CSS (`.tom` files).

## Features

- 🍅 **Custom file icon** for `.tom` files
- 🎨 **Syntax highlighting** for properties, colors, and selectors
- ⚠️ **Error detection** - warns about undefined components
- ✨ **Autocomplete** - suggests properties and colors

## Installation

### Local Development

1. Copy the `vscode-tomato` folder to VS Code extensions:
   ```bash
   cp -r vscode-tomato ~/.vscode/extensions/tomato-css
   ```

2. Reload VS Code (Cmd+Shift+P → "Reload Window")

3. Open any `.tom` file to see it in action!

### Marketplace (Coming Soon)

```bash
code --install-extension srivtx.tomato-css
```

## Syntax Highlighting

The extension highlights:
- **Keywords**: `component`, `use`
- **Pseudo-classes**: `hover:`, `focus:`, `active:`
- **Media queries**: `@mobile:`, `@tablet:`, `@dark:`
- **Properties**: `bg`, `color`, `pad`, `round`, etc.
- **Colors**: All Tailwind colors like `rose-500`, `blue-400`

## Error Detection

The extension will warn you about:
- ❌ Undefined components (when using `use xyz` without defining `component xyz:`)
- ⚠️ Unknown properties

## Autocomplete

Start typing and get suggestions for:
- All Tomato CSS properties
- All Tailwind color values
- Defined components in your file
