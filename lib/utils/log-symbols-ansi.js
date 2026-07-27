import chalk from 'chalk';
import isUnicodeSupported from 'is-unicode-supported';

import { mapObject } from './misc.js';

/** @import { AnsiTextElement } from '../mdast-ansi-types.js' */
/** @import { LogSymbols } from '../log-symbols-types.js' */

// From the 'log-symbols' module
/** @type {LogSymbols} */
const unicodeLogSymbols = {
  info: chalk.blue('ℹ'),
  success: chalk.green('✔'),
  warning: chalk.yellow('⚠'),
  error: chalk.red('✖'),
};

// From the 'log-symbols' module
/** @type {LogSymbols} */
const fallbackLogSymbols = {
  info: chalk.blue('i'),
  success: chalk.green('√'),
  warning: chalk.yellow('‼'),
  error: chalk.red('×'),
};

// From the 'log-symbols' module
export const logSymbols = isUnicodeSupported() ? unicodeLogSymbols : fallbackLogSymbols;

/** @type {LogSymbols<AnsiTextElement>} */
export const logSymbolsMdast = mapObject(logSymbols, (value) => /** @type {const} **/ ({
  type: 'ansiTextElement',
  value,
}));
