import isUnicodeSupported from 'is-unicode-supported';

/** @import { LogSymbols } from '../log-symbols-types.js' */

// From the 'log-symbols' module
/** @type {LogSymbols} */
const unicodeLogSymbols = {
  info: 'ℹ',
  success: '✔',
  warning: '⚠',
  error: '✖',
};

// From the 'log-symbols' module
/** @type {LogSymbols} */
const fallbackLogSymbols = {
  info: 'i',
  success: '√',
  warning: '‼',
  error: '×',
};

/**
 * The uncoloured glyphs. The ansi style colours these; the text and html
 * styles use them as-is.
 */
export const plainLogSymbols = Object.freeze(
  isUnicodeSupported() ? unicodeLogSymbols : fallbackLogSymbols
);
