import type { PhrasingContentOrString } from './utils/mdast-helpers.js';

export type LogSymbols<T = string> = {
  info: T;
  success: T;
  warning: T;
  error: T;
};

export type LogSymbolsMdast = LogSymbols<PhrasingContentOrString>;
