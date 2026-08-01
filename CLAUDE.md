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
* Use `forceColor('0')` from test/force-color.js in before/after hooks when testing ansi — `styleText` re-reads `FORCE_COLOR` per call, so it works after import
* **`FORCE_COLOR` in the environment proves nothing about the suite.** Most spec files set it themselves in a `before` hook, and Node gives `FORCE_COLOR` absolute priority over `NO_COLOR`, so an outer `FORCE_COLOR=3` or `NO_COLOR=1` is clobbered for every colour-sensitive file. A test that means to assert about colour has to force it itself
* test/ansi-golden.spec.js pins escape-sequence output at a _forced_ colour level — the rest of the suite runs with colour off, where changes to escape handling are invisible
* Assert escape-_absence_ at forced colour **on**, never off: with colour off the styles emit no escapes at all, so the assertion passes for the wrong reason (test/sanitizing.spec.js does this)
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

Indicative shape at time of writing: `markdown` \~37ms, `html` \~37ms, `text` \~68ms, `ansi` \~74ms, `ansi-rich` \~172ms. Marginal on top of `markdown`: `emphasize` \~69ms, `boxen` \~30ms, `string-width` \~30ms, `terminal-link` \~7ms.

`string-width` is the price of the table styles and it is paid deliberately. It was briefly inlined over `get-east-asian-width` because `string-width@7` measured this package's own log symbols (`✔ ⚠ ℹ ✖`) as two columns, mis-aligning any table containing one. `@8` moved from `emoji-regex` to `\p{RGI_Emoji}` and reports them as one, so the correctness reason is gone — and the inlined version had four width bugs of its own found in review (multi-code-point clusters, CRLF, VS16 after a combining mark, spacing `Mc` marks). Owning Unicode width to save \~30ms on two styles is not a trade this package should take twice.

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

The ansi/text handler set covers `text`, `code`, `inlineCode`, `link`, `image`, `break`, `heading`, `emphasis`, `strong`, `blockquote`, `delete`, `thematicBreak`, `list`, the three reference nodes (`linkReference`, `imageReference`, `definition`) and (ansi only) `ansiTextElement`. Anything else falls through to default `mdast-util-to-markdown` serialization, which may leak markdown syntax into terminal output — which is exactly what the reference nodes did until they got handlers, and they are what `remark-parse` emits for `[a][b]`.

**Table cells are escaped per handler, not once.** `mdast-util-gfm-table` calls its own `handleTableCell` directly from `handleTableRowAsData` rather than through `state.handle`, so a `tableCell` entry in `options.handlers` is never reached — every handler that can land in a cell must call `escapeInCell()` itself. Overriding `inlineCode` without doing so silently drops the extension's own pipe escaping, and a node type with _no_ handler escapes the rule entirely: an unhandled `linkReference` whose identifier held a `|` used to add a column to its row.

Escaping is ANSI-aware (`mapVisibleText`, lib/utils/ansi.js) so a pipe inside an OSC 8 hyperlink URL is not escaped like a visible one. That helper deliberately does not use `ansi-regex`'s pattern, whose OSC payload class excludes `|`. It narrows the general grammar in two places, both because a character wrongly counted as part of an escape is a character `escapeInCell` never escapes: `\` and `|` are cut from the CSI final-byte class, and a lone introducer matches as a one-character sequence so an unterminated OSC cannot swallow the rest of the string.

### Escapes are data, not markup

Caller-supplied literals — `text`, `html`, `code` and `inlineCode` values, alt texts, footnote identifiers — go through `literal()` (lib/mdast-handlers.js), which strips escape sequences. `ansiTextElement` is the _only_ sanctioned way to embed pre-formatted ANSI, which is what makes a `text` node carrying escapes a hole rather than a feature: `text` promises output safe for a log file, and a raw `ESC[2J` in either style clears the reader's screen.

Strip on the way **in**, never on the finished string: stripping has to land before `escapeInCell`, or a pipe hidden inside an OSC payload reads as invisible and its row silently gains a column.

### URL safety

`filterHyperlinkUrl` (lib/utils/url.js) strips C0/C1/DEL controls (prevents OSC 8 ANSI injection) **before** checking the scheme against an allowlist. Keep that order — a control character inside `java\tscript:` would otherwise hide the scheme from the check while a consumer still resolves it.

**The scheme is read off the string, not out of `new URL().protocol`.** WHATWG parsing is much stricter than what actually dispatches a URL: it rejects `ssh://host:99999999/x` and `x-man-page://[ls` over an out-of-range port and a forbidden host character, while `open` / `xdg-open` / `ShellExecute` — what a terminal hands an OSC 8 link to — take both. Treating a parse failure as "relative, therefore safe" gave every blocked scheme a one-character bypass, the two iTerm2 CVEs the allowlist exists for included.

The list is an allowlist for the same reason: any scheme an installed application registered is reachable, so there is no denylist that could be complete.

**The markdown style deliberately does not filter URLs in `fromMdast()`** — only its `hyperlink()` string method does. Its job is faithful serialization for a downstream renderer that sanitizes in turn, and rewriting URLs mid-serialization would break round-tripping. The other four styles _are_ the final renderer, so they filter.

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
