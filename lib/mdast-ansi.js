import boxen from 'boxen';
import chalk from 'chalk';
import { highlight, supportsLanguage } from 'cli-highlight';
import stringWidth from 'string-width';

import { buildStyleOptions } from './mdast-handlers.js';

/** @import { Options } from 'mdast-util-to-markdown' */
/** @import { TextStylingInterface } from './style-interface-types.js' */

/**
 * Options are resolved per styler rather than once per module, so a styler that
 * overrides eg. header() has that override honored by its own fromMdast(). The
 * WeakMap keeps the hot path a lookup instead of rebuilding the handlers per call.
 *
 * @type {WeakMap<TextStylingInterface, Options>}
 */
const optionsCache = new WeakMap();

/**
 * @param {string} value
 * @param {string | undefined} lang
 * @returns {string}
 */
function highlightCodeBlock (value, lang) {
  let highlighted = value;

  try {
    if (!lang) {
      highlighted = highlight(value);
    } else if (supportsLanguage(lang)) {
      highlighted = highlight(value, { language: lang, ignoreIllegals: true });
    }
    // Unknown languages keep the unhighlighted content — cli-highlight throws
    // on them, and auto-detection would guess wrong anyway
  } catch {
    highlighted = value;
  }

  return '\n' + boxen(highlighted, {
    padding: 1,
    ...lang && { title: lang },
  });
}

/**
 * @param {TextStylingInterface} format
 * @returns {Options}
 */
export function mdastToMarkdownAnsiOptions (format) {
  const cached = optionsCache.get(format);

  if (cached) return cached;

  const options = buildStyleOptions(format, {
    ansiTextElement: value => value,
    codeBlock: highlightCodeBlock,
    inlineCode: value => highlight(value),
    quoteLine: line => format.dim('│ ' + line),
    stringLength: str => stringWidth(str),
    thematicBreak: () => '\n' + chalk.dim('─'.repeat(40)) + '\n',
  });

  optionsCache.set(format, options);

  return options;
}
