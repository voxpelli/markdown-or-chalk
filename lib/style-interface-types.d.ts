// eslint-disable-next-line unicorn/import-style
import type { ChalkInstance } from 'chalk';
import type { AlignType } from 'mdast';

import type { LogSymbols, LogSymbolsMdast } from './log-symbols-types.js';
import type { FromMdast } from './mdast-output-types.js';
import type { PhrasingContentOrStringList } from './utils/mdast-helpers.js';

// *** Fundamental pieces of the main interface ***

interface LogSymbolStylingInterface {
  get logSymbols(): LogSymbols;
  get logSymbolsMdast(): LogSymbolsMdast;
}

interface MdastStylingInterface {
  fromMdast: FromMdast;
  table(rows: PhrasingContentOrStringList[][], align?: AlignType[], options?: { tablePipeAlign?: boolean; }): string;
}

interface TextStylingInterface {
  bold: (text: string) => string;
  dim: (text: string) => string;
  header: (text: string, level?: number) => string;
  hyperlink: (text: string, url: string | undefined, options?: { fallback?: boolean; fallbackToUrl?: boolean; }) => string;
  italic: (text: string) => string;
  strikethrough: (text: string) => string;
}

// *** Main base interface ***

interface StyledOutputInterface extends LogSymbolStylingInterface, MdastStylingInterface, TextStylingInterface {
  type: string;
  code(text: string): string;
  indent(text: string, level?: number): string;
  json(value: unknown): string;
  list(items: string[]): string;
}

// *** Implemented styles ***

export interface AnsiStyledOutput extends StyledOutputInterface {
  type: 'ansi';
}

export interface ChalkStyledOutput extends StyledOutputInterface {
  type: 'chalk';

  /** @deprecated Use generic ansi-style instead */
  get chalk(): ChalkInstance;
}

export interface MarkdownStyledOutput extends StyledOutputInterface {
  type: 'markdown';
}

// *** Unions for implemented styles ***

export type AnyStyledOutput =
  AnsiStyledOutput |
  ChalkStyledOutput |
  MarkdownStyledOutput;
export type StyledOutputTypes = AnyStyledOutput['type'];
