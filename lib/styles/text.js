import { toMarkdown } from 'mdast-util-to-markdown';

import { buildStyleOptions, createOptionsCache } from '../mdast-handlers.js';
import { terminalLogSymbols } from '../utils/log-symbols-plain.js';
import { mdastTableHelper } from '../utils/mdast-table.js';
import { clampHeadingLevel, indentText } from '../utils/misc.js';
import { stringWidth } from '../utils/string-width.js';
import { filterHyperlinkUrl } from '../utils/url.js';

/** @import { FromMdast } from '../mdast-output-types.js' */
/** @import { TextStyledOutput, TextStylingInterface } from '../style-interface-types.js' */

const textOptions = createOptionsCache(format => buildStyleOptions(format, {
  // Indented rather than fenced — a plain reader has no syntax to strip
  codeBlock: value => indentText(value, 2),
  // Through `format`, not the module-level styler: a customized copy
  // (`{ ...getOutputStyler('text'), code }`) must have its override honored here
  inlineCode: value => format.code(value),
  quoteLine: line => '> ' + line,
  stringLength: str => stringWidth(str),
  thematicBreak: () => '\n' + '─'.repeat(40) + '\n',
}));

/**
 * @this {TextStylingInterface | void}
 * @param {Parameters<FromMdast>[0]} node
 * @returns {string}
 */
function textOutputFromMdast (node) {
  return toMarkdown(node, textOptions(this || textOutput));
}

const textOutput = /** @satisfies {TextStyledOutput} */ (/** @type {const} */({
  type: 'text',

  fromMdast: textOutputFromMdast,

  /**
   * @this {TextStylingInterface | void}
   * @param {Parameters<TextStyledOutput['table']>[0]} rows
   * @returns {string}
   */
  table (rows) {
    return textOutputFromMdast.call(this, mdastTableHelper(rows));
  },

  // Plain text carries no emphasis of its own — the words are the output
  bold: text => text,
  dim: text => text,
  italic: text => text,
  strikethrough: text => text,
  code: text => text,

  json: value => JSON.stringify(value, undefined, 2) ?? 'null',

  hyperlink (text, url) {
    const safeUrl = filterHyperlinkUrl(url);

    // The URL is content here — dropping it would lose information that no
    // plain-text reader can recover
    return safeUrl && safeUrl !== text ? `${text} (${safeUrl})` : text;
  },

  list (items) {
    if (items.length === 0) return '';
    // Through `this` so an overridden indent() is honoured, falling back when
    // the method is detached from its styler — as markdown's list() already did
    return items.map(item => '- ' + (this?.indent ?? indentText)(item).trimStart()).join('\n') + '\n';
  },

  header (text, level = 1) {
    const singleLineText = text.replaceAll(/\r?\n/g, ' ');

    // Level 1 gets an underline, deeper levels just breathe
    return clampHeadingLevel(level) === 1
      ? `\n${singleLineText}\n${'='.repeat(stringWidth(singleLineText))}\n`
      : `\n${singleLineText}\n`;
  },

  indent: indentText,

  get logSymbols () {
    return terminalLogSymbols;
  },

  get logSymbolsMdast () {
    return terminalLogSymbols;
  },
}));

export default Object.freeze(textOutput);
