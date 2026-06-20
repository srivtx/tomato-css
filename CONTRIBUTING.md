# Contributing to Tomato CSS

Thanks for your interest. Tomato is a small preprocessor and contributions land quickly.

## Local setup

```bash
git clone https://github.com/srivtx/tomato-css.git
cd tomato-css
npm install
npm test
```

Node 14+ is required to run. Tests use Node's built-in `node:test`, so no extra deps.

## Repo layout

```
src/                 - core: parser, compiler, tokens, API, scope
  parser.js          - source -> AST
  compiler.js        - AST -> CSS
  tokens.js          - Tailwind colors, spacing, etc.
  api.js             - programmatic API
  index.js           - CLI entry
  scope.js           - shared scopeCSS (used by CLI + Vite plugin)
vite-plugin-tomato/  - Vite plugin
vscode-tomato/       - VS Code extension
tests/               - node:test suite
examples/            - .tom demo files
docs/                - static website served at tomato.tom
```

## Running the docs site locally

```bash
python3 -m http.server 8765
# open http://localhost:8765/docs/
```

## Running the demo

```bash
npm run demo
# compiles examples/demo.tom to examples/output.css
```

## Submitting changes

1. Open an issue first if the change is non-trivial. Bug fixes and small additions don't need an issue.
2. Fork the repo, create a branch (`fix/gradient-error`, `feat/@dark-mode`).
3. Run `npm test` before pushing. All tests must pass.
4. Add tests for any new feature or bug fix.
5. PRs without tests will be asked for tests.

## Coding style

- No new comments in code (we keep them sparse; only add when the logic is genuinely non-obvious).
- Match the existing code style: tabs or spaces, single or double quotes — match the file.
- No emojis in code or user-facing strings.
- The compiler must always produce valid CSS. If your change can produce invalid CSS, add a test that fails.
- Errors should be specific. Prefer `throw new CompileError("Unknown gradient '...'. Use: bg gradient <color> to <color>")` over generic errors.

## What to work on

Look for issues tagged `good first issue` or `help wanted`. Common needs:
- New property shortcuts (transform, animate, ring)
- Better diagnostics in the VS Code extension
- New Tailwind tokens (font-weight, z-index scale)
- PostCSS plugin (lets Tomato slot into Next.js, Astro, etc.)
- Playground at a public URL

## Release process

1. Bump version in `package.json` (semver).
2. Add an entry to `CHANGELOG.md` under a new version heading.
3. `git tag vX.Y.Z && git push --tags`
4. GitHub Actions publishes to npm on tag push.
