# Contributing to markdown-or-chalk

## Development Setup

```sh
git clone https://github.com/voxpelli/markdown-or-chalk.git
cd markdown-or-chalk
npm install
```

## Commands

- `npm test` — full validation (lint + type-check + tests)
- `npm run check` — lint + type-check only (no tests)
- `npm run test:mocha` — tests only (with c8 coverage)
- `npm run build` — generate declaration files

## Project Structure

- **`lib/main.js`** — `MarkdownOrChalk` class. Every formatting method (`header`, `bold`, `table`, etc.) branches on a private `#useMarkdown` flag to produce either markdown syntax or chalk-styled terminal output.
- **`lib/mdast.js`** — mdast-to-markdown serialization with custom ANSI handlers for chalk mode (code blocks via boxen, syntax highlighting via cli-highlight, terminal-link for hyperlinks).
- **`lib/mdast-helpers.js`** — Helper functions for building mdast nodes (`mdastLinkify`, `ensurePhrasingContentList`).
- **`lib/table.js`** — `mdastTableHelper` — builds mdast `Table` nodes from row arrays.
- **`lib/list.js`** — `mdastListHelper` — builds mdast `List` nodes from item arrays.
- **`lib/symbols.js`** — Unicode/fallback log symbols (success, error, warning, info).
- **`lib/utils.js`** — Small shared utilities (e.g. `indent`).
- **`lib/advanced-types.d.ts`** — Custom mdast node type `AnsiTextElement` for embedding pre-formatted ANSI strings.
- **`index.js`** — Public entry point, re-exports the class and standalone helpers.

## Adding a New Formatting Method

1. Add the method to the `MarkdownOrChalk` class in `lib/main.js` with both a markdown branch and a chalk branch, gated on `this.#useMarkdown`.
2. Add JSDoc types with `@param` and `@returns` annotations.
3. Add tests in `test/main.spec.js` covering both modes. Use `chalk.level = 0` in chalk-mode tests for exact string assertions.
4. If it is a standalone helper (not a class method), export it from `index.js`.

## Code Style

- **ESM only** — no CommonJS
- **neostandard** lint style via `@voxpelli/eslint-config` (single-file `eslint.config.js`)
- **JSDoc types** checked by `tsc` — no TypeScript compilation
- **Conventional commits** enforced by husky (see Git Hooks below)

## Git Hooks

Managed by [husky](https://typicode.github.io/husky/):

- **commit-msg** — validates conventional commit format via `validate-conventional-commit`
- **pre-push** — runs `npm test` (full lint + type-check + tests)

## Submitting Changes

1. Fork the repository and create a feature branch.
2. Make your changes, ensuring `npm test` passes.
3. Use [conventional commit](https://www.conventionalcommits.org/) messages (`feat:`, `fix:`, `docs:`, etc.) — the commit-msg hook will reject non-conforming messages.
4. Open a pull request against `main`.
