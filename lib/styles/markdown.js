import { gfmFootnoteToMarkdown } from 'mdast-util-gfm-footnote';
import { gfmStrikethroughToMarkdown } from 'mdast-util-gfm-strikethrough';
import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
import { gfmTaskListItemToMarkdown } from 'mdast-util-gfm-task-list-item';
import { toMarkdown } from 'mdast-util-to-markdown';

import { mdastLinkify } from '../utils/mdast-helpers.js';
import { mdastTableHelper } from '../utils/mdast-table.js';
import { clampHeadingLevel, indentText } from '../utils/misc.js';
import { filterHyperlinkUrl } from '../utils/url.js';

/** @import { Options } from 'mdast-util-to-markdown' */
/** @import { FromMdast } from '../mdast-output-types.js' */
/** @import { LogSymbols } from '../log-symbols-types.js' */
/** @import { MarkdownStyledOutput } from '../style-interface-types.js' */

/**
 * @param {{ tablePipeAlign?: boolean|undefined }} [options]
 * @returns {Options}
 */
const markdownOptions = ({ tablePipeAlign } = {}) => ({
  extensions: [
    gfmFootnoteToMarkdown(),
    gfmStrikethroughToMarkdown(),
    gfmTableToMarkdown({ tablePipeAlign }),
    gfmTaskListItemToMarkdown(),
  ],
});

// Reused across calls — the extensions and handlers are identical for every
// call that doesn't override tablePipeAlign
const defaultMarkdownOptions = markdownOptions();

/** @type {FromMdast} */
const markdownOutputFromMdast = (node, options) => toMarkdown(
  node,
  options?.tablePipeAlign === undefined ? defaultMarkdownOptions : markdownOptions(options)
);

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

  // Both fence through the serializer rather than by hand, so a value's
  // backtick runs and padding are handled the same way fromMdast() handles them
  json: value => markdownOutputFromMdast({
    type: 'code',
    lang: 'json',
    value: JSON.stringify(value) ?? 'null',
  }).trimEnd(),

  code: text => markdownOutputFromMdast({
    type: 'paragraph',
    children: [{ type: 'inlineCode', value: text }],
  }).trimEnd(),

  hyperlink (text, url) {
    const safeUrl = filterHyperlinkUrl(url);

    // Serialized through mdast so the escaping is the same implementation
    // fromMdast() uses — hand-rolled interpolation missed '<', '*' and '_' in
    // the text, letting it inject raw HTML and emphasis
    return safeUrl
      ? markdownOutputFromMdast({ type: 'paragraph', children: [mdastLinkify(text, safeUrl)] }).trimEnd()
      : text;
  },

  list (items) {
    if (items.length === 0) return '';
    return items.map(item => '* ' + indentText(item).trimStart()).join('\n') + '\n';
  },

  header (text, level = 1) {
    // A heading is single-line by definition — collapse any newlines
    const singleLineText = text.replaceAll(/\r?\n/g, ' ');

    return `\n${''.padStart(clampHeadingLevel(level), '#')} ${singleLineText}\n`;
  },

  indent: indentText,

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

export default Object.freeze(markdownOutput);
