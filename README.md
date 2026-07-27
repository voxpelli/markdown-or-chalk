# Markdown or Chalk

Print through a single interface as Markdown or terminal output (`ansi` / `chalk`).

[![npm version](https://img.shields.io/npm/v/markdown-or-chalk.svg?style=flat)](https://www.npmjs.com/package/markdown-or-chalk)
[![npm downloads](https://img.shields.io/npm/dm/markdown-or-chalk.svg?style=flat)](https://www.npmjs.com/package/markdown-or-chalk)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-7fffff?style=flat&labelColor=ff80ff)](https://github.com/neostandard/neostandard)
[![Module type: ESM](https://img.shields.io/badge/module%20type-esm-brightgreen)](https://github.com/voxpelli/badges-cjs-esm)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)
[![Follow @voxpelli@mastodon.social](https://img.shields.io/mastodon/follow/109247025527949675?domain=https%3A%2F%2Fmastodon.social&style=social)](https://mastodon.social/@voxpelli)

## Usage

The core idea: keep your formatting calls the same, and decide output style at runtime.

### Runtime configurable (CLI/env)

```javascript
import { getOutputStyler } from 'markdown-or-chalk';

const style = resolveOutputStyle({
  cliFlag: '--format',
  envVar: 'OUTPUT_FORMAT',
  allowed: ['markdown', 'ansi', 'chalk'],
  fallback: 'ansi',
});

const format = getOutputStyler(style);

format.header('Wow');
```

This lets one code path support terminal UX and markdown/report output.

### Fixed style (for single-purpose scripts)

```javascript
import { getOutputStyler } from 'markdown-or-chalk';

const format = getOutputStyler('markdown');
```

Use a fixed style when output never changes (for example a dedicated markdown export script).

## API

### `getOutputStyler(style)`

Returns a formatter for one of these styles:

- `'markdown'` – Markdown output
- `'ansi'` – ANSI terminal output
- `'chalk'` – Chalk-flavored terminal output (legacy compatibility; prefer `'ansi'`)

### `getMdastOutputter(style)`

Returns only the `fromMdast` renderer function for the selected style.

### Instance Methods

| Method | Description |
|--------|-------------|
| `header(text, level?)` | Heading (1-6, default 1). Markdown: `# text`. Terminal: bold+underline |
| `bold(text)` | Bold. Markdown: `**text**`. Terminal: bold |
| `dim(text)` | Dim/italic. Markdown: `_text_`. Terminal: dim |
| `italic(text)` | Italic. Markdown: `_text_`. Terminal: italic |
| `strikethrough(text)` | Strikethrough. Markdown: `~~text~~`. Terminal: strikethrough |
| `code(text)` | Inline code. Markdown: `` `text` ``. Terminal: plain text |
| `hyperlink(text, url, options?)` | Link. Markdown: `[text](url)` (options ignored). Terminal: terminal link. Options: `{ fallback?: boolean, fallbackToUrl?: boolean }` |
| `list(items)` | Bullet list. Markdown: `* item`. Terminal: `- item` |
| `indent(text, level?)` | Indent by level × 2 spaces (default level is 1) |
| `json(value)` | JSON output. Markdown: fenced code block. Terminal: plain JSON |
| `table(rows, align?, options?)` | Table. Markdown: GFM table (supports `{ tablePipeAlign?: boolean }`). Terminal: aligned columns |
| `fromMdast(node, options?)` | Render any mdast node to string |

### Getters

| Getter | Returns |
|--------|---------|
| `type` | `'markdown'`, `'ansi'`, or `'chalk'` |
| `logSymbols` | `{info, success, warning, error}` — emoji or styled symbols |
| `logSymbolsMdast` | `{info, success, warning, error}` — mdast-compatible symbols |
| `chalk` | `ChalkInstance` in chalk mode (`deprecated`, prefer `'ansi'`) |

### Exported Helpers

| Helper | Description |
|--------|-------------|
| `mdastTableHelper(rows, align?)` | Build an mdast Table node |
| `mdastListHelper(items)` | Build an mdast List node |
| `mdastLinkify(value, url, skipLinks?)` | Build an mdast Link or Text node |

### Advanced: mdast helpers

Compose `fromMdast` with the mdast helpers to build rich structured output:

```javascript
import { getMdastOutputter, mdastListHelper, mdastLinkify } from 'markdown-or-chalk';

const fromMdast = getMdastOutputter('markdown');

const list = mdastListHelper([
  [mdastLinkify('chalk', 'https://www.npmjs.com/package/chalk')],
  [mdastLinkify('mdast', 'https://www.npmjs.com/package/mdast')],
  ['plain text item'],
]);

console.log(fromMdast(list));
// * [chalk](https://www.npmjs.com/package/chalk)
// * [mdast](https://www.npmjs.com/package/mdast)
// * plain text item
```

## Migration: 0.2.x → 0.3.x

### What changed

- Constructor-based usage was replaced with a selector function:
  - `getOutputStyler('markdown' | 'ansi' | 'chalk')`
- `getMdastOutputter('markdown' | 'ansi' | 'chalk')` was added as a convenience for mdast-only flows.
  - Existing `getOutputStyler(style).fromMdast(node)` usage still works.
- Style is now selected using explicit string modes (`'markdown'`, `'ansi'`, `'chalk'`).
- `type` is the mode discriminator.
- `chalk` getter is legacy (`deprecated`) and only relevant in `'chalk'` mode (prefer `'ansi'`).

### Before / after

```javascript
// Before (0.2.x)
import MarkdownOrChalk from 'markdown-or-chalk';

const formatMd = new MarkdownOrChalk(true);
const formatCli = new MarkdownOrChalk(false);
```

```javascript
// After (0.3.x)
import { getOutputStyler } from 'markdown-or-chalk';

const formatMd = getOutputStyler('markdown');
const formatCli = getOutputStyler('ansi');
```

```javascript
// After (0.3.x), mdast-only outputter
import { getMdastOutputter } from 'markdown-or-chalk';

const fromMdast = getMdastOutputter('markdown');
const output = fromMdast(node);
```

### Migration checklist

- Replace constructor usage with `getOutputStyler()` / `getMdastOutputter()`.
- Replace boolean mode selection with explicit style strings.
- If branching by mode, check `.type`.
- Keep `.chalk` usage only for legacy paths.
- Re-check output-sensitive behavior:
  - `hyperlink()` in markdown mode
  - `list()` formatting
  - `table()` formatting

## Used by

* [`@voxpelli/pretty-ts-errors-cli`](https://github.com/voxpelli/pretty-ts-errors-cli)
* [`compare-eslint-configs`](https://github.com/voxpelli/compare-eslint-configs)

## See also

* [`chalk`](https://www.npmjs.com/package/chalk)
* [`mdast`](https://www.npmjs.com/package/mdast)
* [`mdast-util-to-markdown`](https://www.npmjs.com/package/mdast-util-to-markdown)
