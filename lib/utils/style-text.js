import { styleText } from 'node:util';

/** @import { LogSymbols } from '../log-symbols-types.js' */

/**
 * `styleText` opens once and closes once, so a multi-line string is left with a
 * style spanning the newlines — terminals then style the full width of every
 * line in between, including blank ones. chalk re-opens per line; this keeps
 * that behaviour so output shape does not change with the implementation.
 *
 * Colour is decided once per call rather than once per line. `shouldColorize`
 * reads FORCE_COLOR — and, only when that is unset, the stream's TTY state and
 * NO_COLOR — so the environment still governs, but a forty-line block no longer
 * pays forty environment scans.
 *
 * @param {Parameters<typeof styleText>[0]} format
 * @param {string} text
 * @returns {string}
 */
export function style (format, text) {
  // Hand non-strings straight over, so Node's ERR_INVALID_ARG_TYPE surfaces
  // instead of a confusing "text.includes is not a function"
  if (typeof text !== 'string') return styleText(format, text);

  // chalk returns an empty string untouched rather than a bare open/close pair
  if (text === '') return text;

  // One probe resolves the colour decision for the whole call. `validateStream`
  // is then off for the rest, which would colour unconditionally on its own.
  if (styleText(format, ' ') === ' ') return text;

  if (!text.includes('\n')) return styleText(format, text, { validateStream: false });

  // Separators are captured and left unstyled, so a CR stays outside the styled
  // run exactly where chalk puts it. Blank segments are still opened and closed
  // — chalk emits that zero-width pair too, and matching it keeps the output
  // byte-identical rather than merely equivalent.
  return text
    .split(/(\r?\n)/)
    .map((part, index) => index % 2 === 0
      ? styleText(format, part, { validateStream: false })
      : part)
    .join('');
}

/** @type {LogSymbols<Parameters<typeof styleText>[0]>} */
export const symbolColours = {
  info: 'blue',
  success: 'green',
  warning: 'yellow',
  error: 'red',
};
