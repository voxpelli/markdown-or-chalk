import { ensurePhrasingContentList } from './mdast-helpers.js';

/** @import { AlignType } from 'mdast' */
/** @import { PhrasingContentOrStringList } from './mdast-helpers.js' */

/** @typedef {import('mdast').Table} Table */

/**
 * @param {PhrasingContentOrStringList[][]} rows
 * @param {AlignType[]} [align]
 * @returns {Table}
 */
export function mdastTableHelper (rows, align) {
  return {
    type: 'table',
    align,
    children: rows.map(cells => (
      {
        type: 'tableRow',
        children: cells.map(value => (
          {
            type: 'tableCell',
            children: ensurePhrasingContentList(value),
          }
        )),
      }
    )),
  };
}
