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
* Use `forceColor('0')` from test/force-color.js in before/after hooks when testing ansi — `styleText` re-reads `FORCE_COLOR` per call, so it works after import and also reaches nested dependencies
* test/ansi-golden.spec.js pins escape-sequence output at a _forced_ colour level — the rest of the suite runs with colour off, where changes to escape handling are invisible
* `ensurePhrasingContentList` is exported from index.js — it turns the string form of `logSymbolsMdast` into real mdast nodes
* Test glob: `test/**/*.spec.js` — supports multiple spec files

## Architecture

This is a multi-output formatting library: given the same API calls, it produces Markdown, ANSI terminal, HTML or plain text output, controlled by a style string.

### Core pattern

`getOutputStyler(style)` (lib/main.cjs) returns one of five frozen style objects — `'markdown'`, `'ansi'`, `'ansi-rich'` (ansi plus boxed, highlighted code blocks), `'html'` and `'text'` — implemented in lib/styles/. All implement the shared interface in lib/style-interface-types.d.ts. Unknown styles throw a `TypeError`. `getMdastOutputter(style)` returns just the selected style's `fromMdast`.

The `ansi` and `text` styles share their mdast handlers via `buildStyleOptions()` (lib/mdast-handlers.js) — they differ in decoration, not structure, so each supplies only its own `codeBlock` / `inlineCode` / `quoteLine` / `thematicBreak` renderers. `html` has its own handler set because nested tags are a genuinely different shape, and it emits **no classes or inline styles** (the one exception being the conventional `language-*` class on code blocks).

lib/main.cjs is deliberately CommonJS: its lazy `require()` getters let a consumer avoid loading the styles it does not select. It is the only CJS file in the package; everything else is ESM.

**Why the CJS exception is worth its cost**: it keeps `ansi-rich` — the one style with heavy dependencies — off everyone else's load path, and lets a missing optional peer be caught and reported (`lib/main.cjs`), which a static ESM import could not do.

**Benchmark numbers move with machine load, so compare within one run, never across sessions.** `npm run bench` (bench/cold-start.js) reports two things: per-style cold start, and per-dependency cost _marginal on top of an already-loaded style_. Marginal is the number that matters — measured in isolation, a dependency is charged for every subtree it shares with the style that loads it, which made boxen look \~4x more expensive than it is.

Indicative shape at time of writing: `markdown` \~43ms, `html` \~44ms, `text` \~49ms, `ansi` \~59ms, `ansi-rich` \~210ms. `emphasize` is \~88ms of that premium and `boxen` \~32ms; nothing else exceeds 10ms.

### mdast integration

For complex output (tables, code blocks, links), the library builds **mdast syntax trees** and serializes them via `mdast-util-to-markdown`:

* **Markdown mode** (lib/styles/markdown.js): standard serialization with the GFM footnote + strikethrough + table + task-list extensions
* **ANSI / text**: `buildStyleOptions()` (lib/mdast-handlers.js) supplies the shared handlers; each style passes its own `codeBlock` / `inlineCode` / `quoteLine` / `thematicBreak`. `ansi-rich` (lib/mdast-ansi-rich.js) swaps in boxen + emphasize
* **HTML**: its own handler set in lib/styles/html.js — nested tags are a different shape from line prefixes

Options are resolved **per styler** and memoized in a `WeakMap`, and `fromMdast`/`table` read `this`, so a customized copy (`{ ...getOutputStyler('ansi'), header }`) has its overrides honored by its own rendering. Detached use (`getMdastOutputter()`, destructuring) falls back to the base styler.

A genuinely unknown mdast node type still throws: `mdast-util-to-markdown` hardcodes zwitch's `unknown` handler and it is not configurable via `options.handlers`.

### Custom mdast node

`AnsiTextElement` (lib/mdast-ansi-types.d.ts) is a custom mdast literal node type used to embed pre-formatted ANSI strings (like log symbols) into the mdast tree so they pass through ANSI serialization untouched. It is ANSI-only — the markdown style has no handler for it.

### Shared mdast handlers (lib/mdast-handlers.js)

The ansi/text handler set covers `text`, `code`, `inlineCode`, `link`, `image`, `break`, `heading`, `emphasis`, `strong`, `blockquote`, `delete`, `thematicBreak`, `list` and (ansi only) `ansiTextElement`. Anything else falls through to default `mdast-util-to-markdown` serialization, which may leak markdown syntax into terminal output.

**Table cells are escaped per handler, not once.** `mdast-util-gfm-table` calls its own `handleTableCell` directly from `handleTableRowAsData` rather than through `state.handle`, so a `tableCell` entry in `options.handlers` is never reached — every handler that can land in a cell must call `escapeInCell()` itself. Overriding `inlineCode` without doing so silently drops the extension's own pipe escaping.

Escaping is ANSI-aware (`mapVisibleText`, lib/utils/ansi.js) so a pipe inside an OSC 8 hyperlink URL is not escaped like a visible one. That helper deliberately does not use `ansi-regex`'s pattern, whose OSC payload class excludes `|`.

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
* `@types/mdast` is in `dependencies` (not devDependencies) — needed for downstream JSDoc consumers
