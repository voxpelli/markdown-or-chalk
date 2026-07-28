# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

* **All checks (no tests)**: `npm run check` (runs clean + ast-grep + installed-check + knip + lint + markdown lint + tsc + type-coverage in parallel)
* **Full validation**: `npm test` (runs all checks + tests)
* **Lint only**: `npm run check:lint`
* **Type-check only**: `npm run check:tsc`
* **Tests only**: `npm run test:node` (`node --test` with c8 coverage)
* **Single test**: `node --test test/path-to-file.spec.js`
* **Type coverage**: `npm run check:type-coverage` (strict, ≥95%)
* **Build declarations**: `npm run build` (generates .d.ts / .d.cts files via `declaration.tsconfig.json`)

## Known Issues

* `dim()` and `italic()` produce identical `_text_` in markdown mode — no "dim" concept in markdown

## Testing

* Tests use `node:test` + `node:assert/strict`, c8 for coverage
* Use `chalk.level = 0` in before/after hooks when testing ansi/chalk mode — enables exact string assertions
* `ensurePhrasingContentList` is exported from index.js — it turns the string form of `logSymbolsMdast` into real mdast nodes
* Test glob: `test/**/*.spec.js` — supports multiple spec files

## Architecture

This is a dual-output formatting library: given the same API calls, it produces either **Markdown text** or **ANSI/Chalk-styled terminal output**, controlled by a style string.

### Core pattern

`getOutputStyler(style)` (lib/main.cjs) returns one of three frozen style objects — `'markdown'`, `'ansi'` or `'chalk'` (ansi plus a deprecated `chalk` getter) — implemented in lib/styles/{markdown,ansi,chalk}.js. All implement the shared interface in lib/style-interface-types.d.ts. Unknown styles throw a `TypeError`. `getMdastOutputter(style)` returns just the selected style's `fromMdast`.

lib/main.cjs is deliberately CommonJS: its lazy `require()` getters let markdown-only consumers avoid loading chalk/boxen/cli-highlight. It is the only CJS file in the package; everything else is ESM.

### mdast integration

For complex output (tables, code blocks, links), the library builds **mdast syntax trees** and serializes them via `mdast-util-to-markdown`:

* **Markdown mode** (lib/styles/markdown.js): standard serialization with the GFM footnote + strikethrough + table + task-list extensions
* **ANSI mode**: `mdastToMarkdownAnsiOptions()` (lib/mdast-ansi.js) supplies custom handlers that convert mdast nodes to chalk-styled strings (boxen for code blocks, cli-highlight for syntax highlighting, terminal-link for hyperlinks)

Options are resolved **per styler** and memoized in a `WeakMap`, and `fromMdast`/`table` read `this`, so a customized copy (`{ ...getOutputStyler('ansi'), header }`) has its overrides honored by its own rendering. Detached use (`getMdastOutputter()`, destructuring) falls back to the base styler.

A genuinely unknown mdast node type still throws: `mdast-util-to-markdown` hardcodes zwitch's `unknown` handler and it is not configurable via `options.handlers`.

### Custom mdast node

`AnsiTextElement` (lib/mdast-ansi-types.d.ts) is a custom mdast literal node type used to embed pre-formatted ANSI strings (like log symbols) into the mdast tree so they pass through ANSI serialization untouched. It is ANSI-only — the markdown style has no handler for it.

### ANSI mode mdast handlers (lib/mdast-ansi.js)

Only 12 node types have custom ANSI handlers: `text`, `code`, `inlineCode`, `link`, `heading`, `emphasis`, `strong`, `ansiTextElement`, `blockquote`, `delete`, `thematicBreak`, `list`. All other mdast node types fall through to default `mdast-util-to-markdown` serialization, which may produce markdown syntax in terminal output.

### URL safety

`filterHyperlinkUrl` (lib/utils/url.js) strips control characters (prevents OSC 8 ANSI injection) **before** blocking dangerous protocols (`javascript:`, `vbscript:`, `data:`) via WHATWG `URL` parsing. Keep that order — WHATWG parsers strip tab/newline themselves, so a protocol check on the unstripped string is bypassable.

### Exported helpers

* `mdastTableHelper` (lib/utils/mdast-table.js) — builds mdast `Table` nodes from row arrays
* `mdastListHelper` (lib/utils/mdast-list.js) — builds mdast `List` nodes from item arrays
* `mdastLinkify` (lib/utils/mdast-helpers.js) — creates mdast `Link` or `Text` nodes

## Style

* ESM with one deliberate CJS exception (lib/main.cjs, see above), neostandard style via `@voxpelli/eslint-config`
* Types via JSDoc annotations, checked by `tsc` — no compilation (declaration files are generated for publishing)
* Conventional commits enforced by husky commit-msg hook (`validate-conventional-commit`)
* Pre-push hook runs full `npm test`
* `cli-highlight` is the only CJS runtime dependency — imported via Node.js ESM interop
* `@types/mdast` is in `dependencies` (not devDependencies) — needed for downstream JSDoc consumers
