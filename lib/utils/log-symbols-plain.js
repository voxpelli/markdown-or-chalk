import isUnicodeSupported from 'is-unicode-supported';

/** @import { LogSymbols } from '../log-symbols-types.js' */

// From the 'log-symbols' module
/** @type {LogSymbols} */
export const unicodeLogSymbols = Object.freeze({
  info: 'ℹ',
  success: '✔',
  warning: '⚠',
  error: '✖',
});

// From the 'log-symbols' module
/** @type {LogSymbols} */
const fallbackLogSymbols = Object.freeze({
  info: 'i',
  success: '√',
  warning: '‼',
  error: '×',
});

/**
 * The glyphs a *terminal* can render. `is-unicode-supported` reads `TERM`,
 * `WT_SESSION` and friends, so this is only the right question for output that
 * is actually going to a terminal — the ansi style colours these, and the text
 * style may reach a console. Output destined for a browser must not consult it.
 */
export const terminalLogSymbols = isUnicodeSupported() ? unicodeLogSymbols : fallbackLogSymbols;
