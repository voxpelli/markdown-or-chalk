import { terminalLogSymbols } from './log-symbols-plain.js';
import { style, symbolColours } from './style-text.js';

/** @import { AnsiTextElement } from '../mdast-ansi-types.js' */
/** @import { LogSymbols } from '../log-symbols-types.js' */

/**
 * @param {keyof LogSymbols} key
 * @returns {string}
 */
const coloured = key => style(symbolColours[key], terminalLogSymbols[key]);

/**
 * @param {keyof LogSymbols} key
 * @returns {AnsiTextElement}
 */
const colouredNode = key => ({ type: 'ansiTextElement', value: coloured(key) });

/**
 * Colour is resolved per access rather than baked at import. `styleText` reads
 * NO_COLOR / FORCE_COLOR / TTY on every call, so a consumer that settles its
 * colour policy after import — a CLI parsing `--color`, or this suite's
 * test/force-color.js — would otherwise get styled text beside plain symbols.
 *
 * Returning fresh values also means these cannot be mutated for other
 * consumers, which `Object.freeze` alone does not achieve for nested objects.
 *
 * @type {LogSymbols}
 */
export const logSymbols = Object.freeze({
  get info () { return coloured('info'); },
  get success () { return coloured('success'); },
  get warning () { return coloured('warning'); },
  get error () { return coloured('error'); },
});

/** @type {LogSymbols<AnsiTextElement>} */
export const logSymbolsMdast = Object.freeze({
  get info () { return colouredNode('info'); },
  get success () { return colouredNode('success'); },
  get warning () { return colouredNode('warning'); },
  get error () { return colouredNode('error'); },
});
