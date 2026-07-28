import { styleText } from 'node:util';

/** @import { LogSymbols } from '../log-symbols-types.js' */

/**
 * `styleText` opens once and closes once, so a multi-line string is left with a
 * style spanning the newlines — terminals then style the full width of every
 * line in between, including blank ones. chalk re-opens per line; this keeps
 * that behaviour so output shape does not change with the implementation.
 *
 * `validateStream: false` because the decision of whether to emit colour at all
 * belongs to the caller's environment (NO_COLOR / FORCE_COLOR / TTY), which
 * `shouldColorize` already reads per call for the default stream.
 *
 * @param {Parameters<typeof styleText>[0]} format
 * @param {string} text
 * @returns {string}
 */
export function style (format, text) {
  return text.includes('\n')
    ? text.split('\n').map(line => styleText(format, line)).join('\n')
    : styleText(format, text);
}

/** @type {LogSymbols<Parameters<typeof styleText>[0]>} */
export const symbolColours = {
  info: 'blue',
  success: 'green',
  warning: 'yellow',
  error: 'red',
};
