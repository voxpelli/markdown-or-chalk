import { buildStyleOptions, createOptionsCache } from './mdast-handlers.js';
import { indentText } from './utils/misc.js';
import { stringWidth } from './utils/string-width.js';

/** @import { StyleRenderers } from './mdast-handlers.js' */
/** @import { TextStylingInterface } from './style-interface-types.js' */

/**
 * The lean terminal renderers — no highlighting. Syntax highlighting and boxed code
 * blocks live in the `ansi-rich` style, which is where boxen and emphasize
 * are loaded; keeping them out of here is what makes this style cheap to start.
 *
 * @param {TextStylingInterface} format
 * @returns {StyleRenderers}
 */
export function ansiRenderers (format) {
  return {
    ansiTextElement: value => value,
    codeBlock: value => indentText(value).split('\n').map(line => format.dim('│') + line).join('\n'),
    inlineCode: value => format.code(value),
    quoteLine: line => format.dim('│ ' + line),
    stringLength: str => stringWidth(str),
    thematicBreak: () => '\n' + format.dim('─'.repeat(40)) + '\n',
  };
}

/** Resolved per styler so overrides are honored */
export const mdastToMarkdownAnsiOptions = createOptionsCache(
  format => buildStyleOptions(format, ansiRenderers(format))
);
