import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
import { toMarkdown } from 'mdast-util-to-markdown';

import { mdastTableHelper } from '../utils/mdast-table.js';
import { filterHyperlinkUrl } from '../utils/url.js';

/** @import { FromMdast } from '../mdast-output-types.js' */
/** @import { LogSymbols } from '../log-symbols-types.js' */
/** @import { MarkdownStyledOutput } from '../style-interface-types.js' */

/** @type {FromMdast} */
const markdownOutputFromMdast = (node, { tablePipeAlign } = {}) => toMarkdown(node, {
  extensions: [
    gfmTableToMarkdown({ tablePipeAlign }),
  ],
});

const markdownLogSymbols = /** @satisfies {LogSymbols} */ (Object.freeze({
  info: ':information_source:',
  error: ':stop_sign:',
  success: ':white_check_mark:',
  warning: ':warning:',
}));

const markdownOutput = /** @satisfies {MarkdownStyledOutput} */ (/** @type {const} */({
  type: 'markdown',

  fromMdast: markdownOutputFromMdast,

  bold: text => `**${text}**`,
  // Note: In markdown mode, dim renders as italic (_text_) since markdown has no "dim" concept.
  dim: text => `_${text}_`,
  italic: text => `_${text}_`,
  strikethrough: text => `~~${text}~~`,
  json: value => '```json\n' + (JSON.stringify(value) ?? 'null') + '\n```',

  code (text) {
    // Use enough backticks to avoid breaking on content containing backticks
    if (!text.includes('`')) return `\`${text}\``;

    const maxRun = Math.max(...[...text.matchAll(/`+/g)].map(m => m[0].length));
    const fence = '`'.repeat(maxRun + 1);

    return `${fence} ${text} ${fence}`;
  },

  hyperlink (text, url) {
    const safeUrl = filterHyperlinkUrl(url);

    return safeUrl ? `[${text}](${safeUrl})` : text;
  },

  list (items) {
    if (items.length === 0) return '';
    return items.map(item => '* ' + this.indent(item).trimStart()).join('\n') + '\n';
  },

  header (text, level = 1) {
    level = Math.max(1, Math.min(6, level ?? 1));
    return `\n${''.padStart(level, '#')} ${text}\n`;
  },

  indent (text, level = 1) {
    const indent = ''.padStart(level * 2, ' ');
    return indent + text.split('\n').join('\n' + indent);
  },

  table: (rows, align, { tablePipeAlign } = {}) =>
    markdownOutputFromMdast(
      mdastTableHelper(rows, align),
      { tablePipeAlign }
    ),

  get logSymbols () {
    return markdownLogSymbols;
  },

  get logSymbolsMdast () {
    return markdownLogSymbols;
  },
}));

export default markdownOutput;
