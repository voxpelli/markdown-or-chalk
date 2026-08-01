import { toMarkdown } from 'mdast-util-to-markdown';
import terminalLink from 'terminal-link';

import { mdastToMarkdownAnsiOptions } from '../mdast-ansi.js';
import { logSymbols, logSymbolsMdast } from '../utils/log-symbols-ansi.js';
import { mdastTableHelper } from '../utils/mdast-table.js';
import { clampHeadingLevel, indentText } from '../utils/misc.js';
import { style } from '../utils/style-text.js';
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

  bold: text => style('bold', text),
  code: text => style('cyan', text),
  dim: text => style('dim', text),
  italic: text => style('italic', text),
  strikethrough: text => style('strikethrough', text),
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
    // Through `this` so an overridden indent() is honoured, falling back when
    // the method is detached from its styler — as markdown's list() already did
    return items.map(item => '- ' + (this?.indent ?? indentText)(item).trimStart()).join('\n') + '\n';
  },

  header (text, level = 1) {
    // A heading is single-line by definition — collapse any newlines
    const singleLineText = text.replaceAll(/\r?\n/g, ' ');

    return style('underline', `\n${clampHeadingLevel(level) === 1 ? style('bold', singleLineText) : singleLineText}\n`);
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
