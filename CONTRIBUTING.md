# Contributing to markdown-or-chalk

## Development Setup

```sh
git clone https://github.com/voxpelli/markdown-or-chalk.git
cd markdown-or-chalk
npm install
```

## Commands

* `npm test` — full validation (all checks + tests)
* `npm run check` — checks only, no tests (lint + type-check + type-coverage + knip + ast-grep + markdown lint + installed-check)
* `npm run test:node` — tests only (`node --test` with c8 coverage)
* `npm run build` — generate declaration files

## Project Structure

* **`lib/main.cjs`** — `getOutputStyler()` / `getMdastOutputter()`. Lazily `require()`s the style objects so markdown-only consumers avoid loading the terminal dependencies. Deliberately the only CommonJS file in the package.
* **`lib/styles/markdown.js`** — the `'markdown'` style object, serializing via `mdast-util-to-markdown` with the GFM table + strikethrough extensions.
* **`lib/styles/ansi.js`** — the `'ansi'` style object, producing chalk-styled terminal output.
* **`lib/styles/chalk.js`** — the `'chalk'` style: ansi plus a deprecated `chalk` getter for legacy consumers.
* **`lib/style-interface-types.d.ts`** — the shared interface every style object implements.
* **`lib/mdast-ansi.js`** — custom ANSI mdast handlers for terminal mode (code blocks via boxen, syntax highlighting via cli-highlight, terminal-link for hyperlinks).
* **`lib/mdast-ansi-types.d.ts`** — custom mdast node type `AnsiTextElement` for embedding pre-formatted ANSI strings.
* **`lib/utils/mdast-helpers.js`** — helper functions for building mdast nodes (`mdastLinkify`, `ensurePhrasingContentList`).
* **`lib/utils/mdast-table.js`** — `mdastTableHelper` — builds mdast `Table` nodes from row arrays.
* **`lib/utils/mdast-list.js`** — `mdastListHelper` — builds mdast `List` nodes from item arrays.
* **`lib/utils/log-symbols-ansi.js`** — Unicode/fallback log symbols (success, error, warning, info).
* **`lib/utils/url.js`** — `filterHyperlinkUrl`, hyperlink URL sanitization shared by all styles.
* **`lib/utils/misc.js`** — small shared utilities (e.g. `indentText`, `clampHeadingLevel`).
* **`index.js`** — public entry point, re-exports the selector functions and standalone helpers.

## Adding a New Formatting Method

1. Add the method to the shared interface in `lib/style-interface-types.d.ts`.
2. Implement it in each style object (`lib/styles/markdown.js` and `lib/styles/ansi.js` — the chalk style inherits from ansi).
3. Add JSDoc types with `@param` and `@returns` annotations.
4. Add tests covering both modes. Use `chalk.level = 0` in ansi-mode tests for exact string assertions.
5. If it is a standalone helper (not a style method), export it from `index.js`.

## Code Style

* **ESM** — with one deliberate CommonJS exception, `lib/main.cjs` (see Project Structure)
* **neostandard** lint style via `@voxpelli/eslint-config` (single-file `eslint.config.js`)
* **JSDoc types** checked by `tsc` — no TypeScript compilation
* **Conventional commits** enforced by husky (see Git Hooks below)

## Git Hooks

Managed by [husky](https://typicode.github.io/husky/):

* **commit-msg** — validates conventional commit format via `validate-conventional-commit`
* **pre-push** — runs `npm test` (full lint + type-check + tests)

## Submitting Changes

1. Fork the repository and create a feature branch.
2. Make your changes, ensuring `npm test` passes.
3. Use [conventional commit](https://www.conventionalcommits.org/) messages (`feat:`, `fix:`, `docs:`, etc.) — the commit-msg hook will reject non-conforming messages.
4. Open a pull request against `main`.
