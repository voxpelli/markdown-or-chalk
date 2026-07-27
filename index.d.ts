// *** Type exports ***

export type * from './lib/mdast-ansi-types.d.ts';
export type * from './lib/mdast-output-types.d.ts';
export type * from './lib/log-symbols-types.d.ts';
export type * from './lib/style-interface-types.d.ts';

export type {
  PhrasingContentOrString,
  PhrasingContentOrStringList,
} from './lib/utils/mdast-helpers.js';

export type {
  Table,
} from './lib/utils/mdast-table.js';

// *** Helpers ***

export { mdastLinkify } from './lib/utils/mdast-helpers.js';
export { mdastListHelper } from './lib/utils/mdast-list.js';
export { mdastTableHelper } from './lib/utils/mdast-table.js';

// *** Main export ***

export {
  getMdastOutputter,
  getOutputStyler,
} from './lib/main.cjs';
