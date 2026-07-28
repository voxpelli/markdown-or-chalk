# Markdown or Chalk

Print through a single interface as Markdown, terminal, HTML or plain text output.

[![npm version](https://img.shields.io/npm/v/markdown-or-chalk.svg?style=flat)](https://www.npmjs.com/package/markdown-or-chalk)
[![npm downloads](https://img.shields.io/npm/dm/markdown-or-chalk.svg?style=flat)](https://www.npmjs.com/package/markdown-or-chalk)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-7fffff?style=flat\&labelColor=ff80ff)](https://github.com/neostandard/neostandard)
[![Module type: ESM](https://img.shields.io/badge/module%20type-esm-brightgreen)](https://github.com/voxpelli/badges-cjs-esm)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/voxpelli/markdown-or-chalk)

## Usage

The core idea: keep your formatting calls the same, and decide output style at runtime.

```javascript
import { getOutputStyler } from 'markdown-or-chalk';

const printAsMarkdown = true;

const format = getOutputStyler(printAsMarkdown ? 'markdown' : 'ansi');

format.header('Wow');
```

This lets one code path support terminal UX and markdown/report output.

## API

### `getOutputStyler(style)`

Returns a formatter for one of these styles:

* `'markdown'` – Markdown output
* `'ansi'` – ANSI terminal output
* `'html'` – Semantic HTML, with no classes or inline styles
* `'text'` – Plain text, with no ANSI and no markup — for pipes, log files and `NO_COLOR`
* `'ansi-rich'` – `'ansi'` plus boxed, syntax-highlighted code blocks

Unknown styles throw a `TypeError`.

Only `'ansi-rich'` loads `boxen` and `emphasize`, and both are **optional peer
dependencies** — install them yourself if you select that style. Plain `'ansi'`
renders code blocks with a dim rule instead. Run `npm run bench` for the numbers.

### Customizing a style

Every style is a plain frozen object, so a copy with overrides works — including
inside `fromMdast()`:

```javascript
import { getOutputStyler } from 'markdown-or-chalk';

const format = {
  ...getOutputStyler('ansi'),
  header: text => `=== ${text} ===`,
};

format.fromMdast({ type: 'heading', depth: 1, children: [{ type: 'text', value: 'Wow' }] });
// '=== Wow ===\n'
```

### `getMdastOutputter(style)`

Returns only the `fromMdast` renderer function for the selected style.

### Instance Methods

| Method                           | Description                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `header(text, level?)`           | Heading (1-6, default 1). Markdown: `# text`. Terminal: bold+underline                                                               |
| `bold(text)`                     | Bold. Markdown: `**text**`. Terminal: bold                                                                                           |
| `dim(text)`                      | Dim/italic. Markdown: `_text_`. Terminal: dim                                                                                        |
| `italic(text)`                   | Italic. Markdown: `_text_`. Terminal: italic                                                                                         |
| `strikethrough(text)`            | Strikethrough. Markdown: `~~text~~`. Terminal: strikethrough                                                                         |
| `code(text)`                     | Inline code. Markdown: `` `text` ``. Terminal: plain text                                                                            |
| `hyperlink(text, url, options?)` | Link. Markdown: `[text](url)` (options ignored). Terminal: terminal link. Options: `{ fallback?: boolean, fallbackToUrl?: boolean }` |
| `list(items)`                    | Bullet list. Markdown: `* item`. Terminal: `- item`                                                                                  |
| `indent(text, level?)`           | Indent by level × 2 spaces (default level is 1)                                                                                      |
| `json(value)`                    | JSON output. Markdown: fenced code block. Terminal: plain JSON                                                                       |
| `table(rows, align?, options?)`  | Table. Markdown: GFM table (supports `{ tablePipeAlign?: boolean }`). Terminal: aligned columns (`align` is markdown-only)           |
| `fromMdast(node, options?)`      | Render any mdast node to string                                                                                                      |

### Getters

| Getter            | Returns                                                      |
| ----------------- | ------------------------------------------------------------ |
| `type`            | the selected style string                                    |
| `logSymbols`      | `{info, success, warning, error}` — emoji or styled symbols  |
| `logSymbolsMdast` | `{info, success, warning, error}` — mdast-compatible symbols |

### Exported Helpers

| Helper                                 | Description                                   |
| -------------------------------------- | --------------------------------------------- |
| `mdastTableHelper(rows, align?)`       | Build an mdast Table node                     |
| `mdastListHelper(items)`               | Build an mdast List node                      |
| `mdastLinkify(value, url, skipLinks?)` | Build an mdast Link or Text node              |
| `ensurePhrasingContentList(list)`      | Turn strings into mdast Text nodes for a tree |

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

* Constructor-based usage was replaced with a selector function:
  * `getOutputStyler('markdown' | 'ansi' | 'html' | 'text' | 'ansi-rich')`
* `getMdastOutputter(style)` was added as a convenience for mdast-only flows.
  * Existing `getOutputStyler(style).fromMdast(node)` usage still works.
* Style is now selected using explicit string modes.
* `type` is the mode discriminator.
* The `'chalk'` style and its `chalk` getter were removed in 0.4.0 — use `'ansi'`, and import `chalk` directly if you need the instance.

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

* Replace constructor usage with `getOutputStyler()` / `getMdastOutputter()`.
* Replace boolean mode selection with explicit style strings — unknown styles (including booleans) throw a `TypeError`.
* If branching by mode, check `.type`.
* Replace `.chalk` usage with a direct `chalk` import — the `'chalk'` style is gone.
* Re-check output-sensitive behavior:
  * `hyperlink()` in markdown mode
  * `list()` formatting
  * `table()` formatting

## Used by

* [`@voxpelli/pretty-ts-errors-cli`](https://github.com/voxpelli/pretty-ts-errors-cli)
* [`compare-eslint-configs`](https://github.com/voxpelli/compare-eslint-configs)

## See also

* [`chalk`](https://www.npmjs.com/package/chalk)
* [`mdast`](https://www.npmjs.com/package/mdast)
* [`mdast-util-to-markdown`](https://www.npmjs.com/package/mdast-util-to-markdown)
