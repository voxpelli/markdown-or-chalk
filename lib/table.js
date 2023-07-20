import { ensurePhrasingContentList } from './mdast-helpers.js';

/**
 * @param {import('./mdast-helpers.js').PhrasingContentOrStringList[][]} rows
 * @param {import('mdast').AlignType[]} [align]
 * @returns {import('mdast').Table}
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
