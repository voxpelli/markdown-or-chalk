import chalk from 'chalk';

import { plainLogSymbols } from './log-symbols-plain.js';
import { mapObject } from './misc.js';

/** @import { AnsiTextElement } from '../mdast-ansi-types.js' */
/** @import { LogSymbols } from '../log-symbols-types.js' */

/** @type {LogSymbols<(text: string) => string>} */
const symbolColours = {
  info: text => chalk.blue(text),
  success: text => chalk.green(text),
  warning: text => chalk.yellow(text),
  error: text => chalk.red(text),
};

// From the 'log-symbols' module
/** @type {LogSymbols} */
export const logSymbols = mapObject(plainLogSymbols, (value, key) => symbolColours[key](value));

/** @type {LogSymbols<AnsiTextElement>} */
export const logSymbolsMdast = mapObject(logSymbols, (value) => /** @type {const} **/ ({
  type: 'ansiTextElement',
  value,
}));
