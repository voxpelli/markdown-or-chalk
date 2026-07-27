import chalk from 'chalk';
import { toMarkdown } from 'mdast-util-to-markdown';
import terminalLink from 'terminal-link';

import { mdastToMarkdownAnsiOptions } from '../mdast-ansi.js';
import { logSymbols, logSymbolsMdast } from '../utils/log-symbols-ansi.js';
import { mdastTableHelper } from '../utils/mdast-table.js';
import { filterHyperlinkUrl } from '../utils/url.js';

/** @import { FromMdast } from '../mdast-output-types.js' */
/** @import { AnsiStyledOutput } from '../style-interface-types.js' */

/** @type {FromMdast} */
const ansiOutputFromMdast = node => toMarkdown(node, mdastToMarkdownAnsiOptions(ansiOutput));

const ansiOutput = /** @satisfies {AnsiStyledOutput} */ (/** @type {const} */({
  type: 'ansi',

  fromMdast: ansiOutputFromMdast,
  table: rows => ansiOutputFromMdast(mdastTableHelper(rows)),

  bold: text => chalk.bold(text),
  code: text => text,
  dim: text => chalk.dim(text),
  italic: text => chalk.italic(text),
  strikethrough: text => chalk.strikethrough(text),
  json: value => JSON.stringify(value) ?? 'null',

  hyperlink (text, url, { fallback = true, fallbackToUrl } = {}) {
    const safeUrl = filterHyperlinkUrl(url);

    return safeUrl
      ? terminalLink(text, safeUrl, {
        fallback: fallbackToUrl ? (_text, url) => url : fallback,
      })
      : text;
  },

  list (items) {
    if (items.length === 0) return '';
    return items.map(item => '- ' + item).join('\n') + '\n';
  },

  header (text, level = 1) {
    level = Math.max(1, Math.min(6, level ?? 1));
    return chalk.underline(`\n${level === 1 ? chalk.bold(text) : text}\n`);
  },

  indent (text, level = 1) {
    const indent = ''.padStart(level * 2, ' ');
    return indent + text.split('\n').join('\n' + indent);
  },

  get logSymbols () {
    return logSymbols;
  },

  get logSymbolsMdast () {
    return logSymbolsMdast;
  },
}));

export default ansiOutput;
