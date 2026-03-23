# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **All checks (no tests)**: `npm run check` (runs clean + lint + tsc + type-coverage + knip + installed-check in parallel)
- **Full validation**: `npm test` (runs lint + type-check + tests)
- **Lint only**: `npm run check:lint`
- **Type-check only**: `npm run check:tsc`
- **Tests only**: `npm run test:mocha`
- **Single test**: `npx mocha 'test/path-to-file.spec.js'`
- **Type coverage**: `npm run check:type-coverage` (strict, ≥95%)
- **Build declarations**: `npm run build` (generates .d.ts files via `declaration.tsconfig.json`)

## Known Issues

- `list()` ANSI mode: `indent(item).trimStart()` is a no-op for single-line items — no bullets rendered
- `dim()` and `italic()` produce identical `_text_` in markdown mode — no "dim" concept in markdown

## Testing

- Tests use mocha + chai (`should` style), c8 for coverage
- Use `chalk.level = 0` in before/after hooks when testing chalk mode — enables exact string assertions
- `ensurePhrasingContentList` is not exported from index.js — import directly from `lib/mdast-helpers.js` for testing
- Test glob: `test/**/*.spec.js` — supports multiple spec files

## Architecture

This is a dual-output formatting library: given the same API calls, it produces either **Markdown text** or **Chalk-styled terminal output**, controlled by a boolean flag passed to the `MarkdownOrChalk` constructor.

### Core pattern

`MarkdownOrChalk` (lib/main.js) is the main class. Every formatting method (`header`, `bold`, `hyperlink`, `table`, etc.) branches on a private `#useMarkdown` flag — returning markdown syntax in one path and chalk-styled strings in the other.

### mdast integration

For complex output (tables, code blocks, links), the library builds **mdast syntax trees** and serializes them via `mdast-util-to-markdown`. The `fromMdast()` method on `MarkdownOrChalk` handles this, delegating to `mdastToMarkdownOptions()` (lib/mdast.js) which swaps between:
- **Markdown mode**: standard mdast-to-markdown serialization with GFM table support
- **Chalk mode**: custom handlers that convert mdast nodes to chalk-styled strings (boxen for code blocks, cli-highlight for syntax highlighting, terminal-link for hyperlinks)

### Custom mdast node

`AnsiTextElement` (lib/advanced-types.d.ts) is a custom mdast literal node type used to embed pre-formatted ANSI strings (like log symbols) into the mdast tree so they pass through serialization untouched.

### ANSI mode mdast handlers (lib/mdast.js)

Only 7 node types have custom ANSI handlers: `code`, `inlineCode`, `link`, `heading`, `emphasis`, `strong`, `ansiTextElement`. All other mdast node types fall through to default `mdast-util-to-markdown` serialization, which may produce markdown syntax in terminal output.

### Exported helpers

- `mdastTableHelper` (lib/table.js) — builds mdast `Table` nodes from row arrays
- `mdastListHelper` (lib/list.js) — builds mdast `List` nodes from item arrays
- `mdastLinkify` (lib/mdast-helpers.js) — creates mdast `Link` or `Text` nodes

## Style

- ESM only, neostandard style via `@voxpelli/eslint-config`
- Types via JSDoc annotations, checked by `tsc` — no compilation
- Conventional commits enforced by husky commit-msg hook (`validate-conventional-commit`)
- Pre-push hook runs full `npm test`
- `cli-highlight` is the only CJS runtime dependency — imported via Node.js ESM interop
- `@types/mdast` is in `dependencies` (not devDependencies) — needed for downstream JSDoc consumers
