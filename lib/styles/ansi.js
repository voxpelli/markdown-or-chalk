import chalk from 'chalk';
import { toMarkdown } from 'mdast-util-to-markdown';
import terminalLink from 'terminal-link';

import { mdastToMarkdownAnsiOptions } from '../mdast-ansi.js';
import { logSymbols, logSymbolsMdast } from '../utils/log-symbols-ansi.js';
import { mdastTableHelper } from '../utils/mdast-table.js';
import { clampHeadingLevel, indentText } from '../utils/misc.js';
import { filterHyperlinkUrl } from '../utils/url.js';

/** @import { FromMdast } from '../mdast-output-types.js' */
/** @import { AnsiStyledOutput, TextStylingInterface } from '../style-interface-types.js' */

/**
 * `this` is the styler the method was reached through, so a customized copy
 * (`{ ...getOutputStyler('ansi'), header }`) renders with its own overrides.
 * Falls back to the base styler when detached — as `getMdastOutputter()` does.
 *
 * @this {TextStylingInterface | void}
 * @param {Parameters<FromMdast>[0]} node
 * @returns {string}
 */
function ansiOutputFromMdast (node) {
  return toMarkdown(node, mdastToMarkdownAnsiOptions(this || ansiOutput));
}

const ansiOutput = /** @satisfies {AnsiStyledOutput} */ (/** @type {const} */({
  type: 'ansi',

  fromMdast: ansiOutputFromMdast,

  /**
   * Alignment is deliberately not forwarded — the :--- / ---: markers are
   * markdown syntax noise in terminal output
   *
   * @this {TextStylingInterface | void}
   * @param {Parameters<AnsiStyledOutput['table']>[0]} rows
   * @returns {string}
   */
  table (rows) {
    return ansiOutputFromMdast.call(this, mdastTableHelper(rows));
  },

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
    return items.map(item => '- ' + item.split('\n').join('\n  ')).join('\n') + '\n';
  },

  header (text, level = 1) {
    return chalk.underline(`\n${clampHeadingLevel(level) === 1 ? chalk.bold(text) : text}\n`);
  },

  indent: indentText,

  get logSymbols () {
    return logSymbols;
  },

  get logSymbolsMdast () {
    return logSymbolsMdast;
  },
}));

export default Object.freeze(ansiOutput);
