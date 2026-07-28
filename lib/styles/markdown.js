import { gfmStrikethroughToMarkdown } from 'mdast-util-gfm-strikethrough';
import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
import { toMarkdown } from 'mdast-util-to-markdown';

import { mdastTableHelper } from '../utils/mdast-table.js';
import { clampHeadingLevel, indentText, longestBacktickRun } from '../utils/misc.js';
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
    gfmStrikethroughToMarkdown(),
    gfmTableToMarkdown({ tablePipeAlign }),
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

  json (value) {
    const text = JSON.stringify(value) ?? 'null';
    // Use a fence longer than any backtick run in the content, minimum three
    const fence = '`'.repeat(Math.max(2, longestBacktickRun(text)) + 1);

    return `${fence}json\n${text}\n${fence}`;
  },

  code (text) {
    // Use enough backticks to avoid breaking on content containing backticks
    const maxRun = longestBacktickRun(text);

    if (maxRun === 0) return `\`${text}\``;

    const fence = '`'.repeat(maxRun + 1);

    return `${fence} ${text} ${fence}`;
  },

  hyperlink (text, url) {
    const safeUrl = filterHyperlinkUrl(url);

    if (!safeUrl) return text;

    // Same escaping rules as the link serializer in mdast-util-to-markdown:
    // angle bracket wrapping for URLs with spaces, backslash escaped
    // parentheses otherwise, and backslash escaped square brackets in the text
    const escapedText = text.replaceAll(/[[\]]/g, String.raw`\$&`);
    const escapedUrl = safeUrl.includes(' ')
      ? `<${safeUrl.replaceAll(/[<>\\]/g, String.raw`\$&`)}>`
      : safeUrl.replaceAll(/[()]/g, String.raw`\$&`);

    return `[${escapedText}](${escapedUrl})`;
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
