# Markdown or Chalk

Prints through a single interface as Chalk enhanced CLI output or as Markdown

[![npm version](https://img.shields.io/npm/v/markdown-or-chalk.svg?style=flat)](https://www.npmjs.com/package/markdown-or-chalk)
[![npm downloads](https://img.shields.io/npm/dm/markdown-or-chalk.svg?style=flat)](https://www.npmjs.com/package/markdown-or-chalk)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-7fffff?style=flat&labelColor=ff80ff)](https://github.com/neostandard/neostandard)
[![Module type: ESM](https://img.shields.io/badge/module%20type-esm-brightgreen)](https://github.com/voxpelli/badges-cjs-esm)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)
[![Follow @voxpelli@mastodon.social](https://img.shields.io/mastodon/follow/109247025527949675?domain=https%3A%2F%2Fmastodon.social&style=social)](https://mastodon.social/@voxpelli)

## Usage

### Simple

```javascript
import { MarkdownOrChalk } from 'markdown-or-chalk';

const printAsMarkdown = true;
const format = new MarkdownOrChalk(printAsMarkdown);

format.header('Wow');
```

## API

### `new MarkdownOrChalk(useMarkdown)`

Creates a formatter instance. Pass `true` for markdown output, `false` for chalk terminal output.

### Instance Methods

| Method | Description |
|--------|-------------|
| `header(text, level?)` | Heading (1-6). Markdown: `# text`. Chalk: bold+underline |
| `bold(text)` | Bold. Markdown: `**text**`. Chalk: bold |
| `dim(text)` | Dim/italic. Markdown: `_text_`. Chalk: dim |
| `italic(text)` | Italic. Markdown: `_text_`. Chalk: italic |
| `strikethrough(text)` | Strikethrough. Markdown: `~~text~~`. Chalk: strikethrough |
| `code(text)` | Inline code. Markdown: `` `text` ``. Chalk: plain text |
| `hyperlink(text, url, options?)` | Link. Markdown: `[text](url)`. Chalk: terminal link |
| `list(items)` | Bullet list. Markdown: `* item`. Chalk: joined lines |
| `indent(text, level?)` | Indent by level x 2 spaces |
| `json(value)` | JSON output. Markdown: fenced code block. Chalk: plain JSON |
| `table(rows, align?, options?)` | Table. Markdown: GFM table. Chalk: aligned columns |
| `fromMdast(node, options?)` | Render any mdast node to string |

### Getters

| Getter | Returns |
|--------|---------|
| `chalk` | `ChalkInstance` in chalk mode, `undefined` in markdown mode |
| `chalkOnly` | `this` in chalk mode, `undefined` in markdown mode |
| `markdownOnly` | `this` in markdown mode, `undefined` in chalk mode |
| `logSymbols` | `{info, success, warning, error}` — emoji or chalk-styled symbols |

### Exported Helpers

| Helper | Description |
|--------|-------------|
| `mdastTableHelper(rows, align?)` | Build an mdast Table node |
| `mdastListHelper(items)` | Build an mdast List node |
| `mdastLinkify(value, url, skipLinks?)` | Build an mdast Link or Text node |

### Advanced: mdast helpers

Compose `fromMdast` with the mdast helpers to build rich structured output:

```javascript
import { MarkdownOrChalk, mdastListHelper, mdastLinkify } from 'markdown-or-chalk';

const format = new MarkdownOrChalk(true);

const list = mdastListHelper([
  [mdastLinkify('chalk', 'https://www.npmjs.com/package/chalk')],
  [mdastLinkify('mdast', 'https://www.npmjs.com/package/mdast')],
  ['plain text item'],
]);

console.log(format.fromMdast(list));
// * [chalk](https://www.npmjs.com/package/chalk)
// * [mdast](https://www.npmjs.com/package/mdast)
// * plain text item
```

## Used by

* [`@voxpelli/pretty-ts-errors-cli`](https://github.com/voxpelli/pretty-ts-errors-cli)
* [`compare-eslint-configs`](https://github.com/voxpelli/compare-eslint-configs)

## See also

* [`chalk`](https://www.npmjs.com/package/chalk)
* [`mdast`](https://www.npmjs.com/package/mdast)
* [`mdast-util-to-markdown`](https://www.npmjs.com/package/mdast-util-to-markdown)
