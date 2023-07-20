import chalk from 'chalk';
import isUnicodeSupported from 'is-unicode-supported';

import { mapObject } from './utils.js';

// From the 'log-symbols' module
const unicodeLogSymbols = {
  info: chalk.blue('ℹ'),
  success: chalk.green('✔'),
  warning: chalk.yellow('⚠'),
  error: chalk.red('✖'),
};

// From the 'log-symbols' module
const fallbackLogSymbols = {
  info: chalk.blue('i'),
  success: chalk.green('√'),
  warning: chalk.yellow('‼'),
  error: chalk.red('×'),
};

// From the 'log-symbols' module
export const logSymbols = isUnicodeSupported() ? unicodeLogSymbols : fallbackLogSymbols;

/** @typedef {typeof logSymbols} LogSymbols */

/** @type {Record<keyof LogSymbols, import('./advanced-types.js').AnsiTextElement>} */
export const logSymbolsMdast = mapObject(logSymbols, (value) => {
  return {
    type: 'ansiTextElement',
    value,
  };
});

export const markdownLogSymbols = /** @satisfies {typeof logSymbols} */ {
  info: ':information_source:',
  error: ':stop_sign:',
  success: ':white_check_mark:',
  warning: ':warning:',
};
