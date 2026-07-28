import { terminalLogSymbols } from './log-symbols-plain.js';
import { mapObject } from './misc.js';
import { style, symbolColours } from './style-text.js';

/** @import { AnsiTextElement } from '../mdast-ansi-types.js' */
/** @import { LogSymbols } from '../log-symbols-types.js' */

// From the 'log-symbols' module
/** @type {LogSymbols} */
export const logSymbols = mapObject(terminalLogSymbols, (value, key) => style(symbolColours[key], value));

/** @type {LogSymbols<AnsiTextElement>} */
export const logSymbolsMdast = mapObject(logSymbols, (value) => /** @type {const} **/ ({
  type: 'ansiTextElement',
  value,
}));
