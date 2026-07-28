import { toMarkdown } from 'mdast-util-to-markdown';

import { mdastToMarkdownAnsiRichOptions } from '../mdast-ansi-rich.js';
import { mdastTableHelper } from '../utils/mdast-table.js';
import ansiOutput from './ansi.js';

/** @import { FromMdast } from '../mdast-output-types.js' */
/** @import { AnsiRichStyledOutput, TextStylingInterface } from '../style-interface-types.js' */

/**
 * @this {TextStylingInterface | void}
 * @param {Parameters<FromMdast>[0]} node
 * @returns {string}
 */
function ansiRichOutputFromMdast (node) {
  return toMarkdown(node, mdastToMarkdownAnsiRichOptions(this || ansiRichOutput));
}

/**
 * `ansi` plus boxed, syntax-highlighted code blocks. Split out because boxen
 * and emphasize together cost more to load than everything else in the
 * package combined — see bench/cold-start.js.
 */
const ansiRichOutput = /** @satisfies {AnsiRichStyledOutput} */ (/** @type {const} */({
  ...ansiOutput,

  type: 'ansi-rich',

  fromMdast: ansiRichOutputFromMdast,

  /**
   * @this {TextStylingInterface | void}
   * @param {Parameters<AnsiRichStyledOutput['table']>[0]} rows
   * @returns {string}
   */
  table (rows) {
    return ansiRichOutputFromMdast.call(this, mdastTableHelper(rows));
  },
}));

export default Object.freeze(ansiRichOutput);
