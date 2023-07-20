# Markdown or Chalk

Prints through a single interface as Chalk enhanced CLI output or as Markdown

[![npm version](https://img.shields.io/npm/v/markdown-or-chalk.svg?style=flat)](https://www.npmjs.com/package/markdown-or-chalk)
[![npm downloads](https://img.shields.io/npm/dm/markdown-or-chalk.svg?style=flat)](https://www.npmjs.com/package/markdown-or-chalk)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg)](https://github.com/voxpelli/eslint-config)
[![Module type: ESM](https://img.shields.io/badge/module%20type-esm-brightgreen)](https://github.com/voxpelli/badges-cjs-esm)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)
[![Follow @voxpelli@mastodon.social](https://img.shields.io/mastodon/follow/109247025527949675?domain=https%3A%2F%2Fmastodon.social&style=social)](https://mastodon.social/@voxpelli)

## Usage

### Simple

```javascript
import { MarkdownOrChalk } from 'markdown-or-chalk';

const printAsMarkdown = true;
const format = new ChalkOrMarkdown(printAsMarkdown);

format.header('Wow');
```

## Exports

* `MarkdownOrChalk`
* `mdastLinkify`
* `mdastListHelper`

## See also

* [`chalk``](https://www.npmjs.com/package/chalk)
* [`mdast`](https://www.npmjs.com/package/mdast)
* [`mdast-util-to-markdown`](https://www.npmjs.com/package/mdast-util-to-markdown)
