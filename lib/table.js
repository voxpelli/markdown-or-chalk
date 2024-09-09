import { ensurePhrasingContentList } from './mdast-helpers.js';

/** @typedef {import('mdast').Table} Table */

/**
 * @param {import('./mdast-helpers.js').PhrasingContentOrStringList[][]} rows
 * @param {import('mdast').AlignType[]} [align]
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
