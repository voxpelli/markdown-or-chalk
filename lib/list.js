import { ensurePhrasingContentList } from './mdast-helpers.js';

/** @import { List } from 'mdast' */
/** @import { PhrasingContentOrStringList } from './mdast-helpers.js' */

/**
 * @param {PhrasingContentOrStringList[]} items
 * @returns {List}
 */
export function mdastListHelper (items) {
  return {
    type: 'list',
    spread: false,
    children: items.map(item => ({
      type: 'listItem',
      children: [{
        type: 'paragraph',
        children: ensurePhrasingContentList(item),
      }],
    })),
  };
}
