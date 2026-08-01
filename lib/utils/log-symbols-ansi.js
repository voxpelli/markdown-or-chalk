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
 * Cached per resolved value, so repeated reads return the *same* node: a
 * consumer memoising nodes in a WeakMap, or comparing identity during a tree
 * walk, would otherwise silently miss every time. Bounded — at most one entry
 * per symbol per colour state — and frozen, so a stray write cannot leak
 * between consumers.
 *
 * @type {Map<string, AnsiTextElement>}
 */
const nodeCache = new Map();

/**
 * @param {keyof LogSymbols} key
 * @returns {AnsiTextElement}
 */
function colouredNode (key) {
  const value = coloured(key);
  let node = nodeCache.get(value);

  if (!node) {
    node = Object.freeze({ type: 'ansiTextElement', value });
    nodeCache.set(value, node);
  }

  return node;
}

/**
 * Colour is resolved per access rather than baked at import: a consumer that
 * settles its colour policy after import — a CLI parsing `--color`, or this
 * suite's test/force-color.js — would otherwise get styled text beside plain
 * symbols.
 *
 * Note this means destructuring (`const { info } = logSymbols`) snapshots the
 * value at that moment, which is the price of staying a string-valued API
 * rather than becoming a function call.
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
