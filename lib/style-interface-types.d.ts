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
  /**
   * `align` and `tablePipeAlign` are markdown-only — the terminal styles ignore
   * them, since `:---` / `---:` markers are markdown syntax rather than output.
   */
  table(rows: PhrasingContentOrStringList[][], align?: AlignType[], options?: { tablePipeAlign?: boolean; }): string;
}

export interface TextStylingInterface {
  bold: (text: string) => string;
  dim: (text: string) => string;
  header: (text: string, level?: number) => string;
  hyperlink: (text: string, url: string | undefined, options?: { fallback?: boolean; fallbackToUrl?: boolean; }) => string;
  italic: (text: string) => string;
  strikethrough: (text: string) => string;
}

// *** Main base interface ***

export interface StyledOutputInterface extends LogSymbolStylingInterface, MdastStylingInterface, TextStylingInterface {
  /** Narrowed to a literal by each implementing style — the registry keys on it */
  type: StyledOutputTypes;
  code(text: string): string;
  indent(text: string, level?: number): string;
  json(value: unknown): string;
  list(items: string[]): string;
}

// *** Implemented styles ***

export interface AnsiStyledOutput extends StyledOutputInterface {
  type: 'ansi';
}

/** `ansi` plus boxed, syntax-highlighted code blocks — loads boxen + emphasize */
export interface AnsiRichStyledOutput extends StyledOutputInterface {
  type: 'ansi-rich';
}

export interface ChalkStyledOutput extends StyledOutputInterface {
  type: 'chalk';

  /** @deprecated Use generic ansi-style instead */
  get chalk(): ChalkInstance;
}

export interface MarkdownStyledOutput extends StyledOutputInterface {
  type: 'markdown';
}

/** Semantic HTML — no classes or inline styles, consumers bring their own CSS */
export interface HtmlStyledOutput extends StyledOutputInterface {
  type: 'html';
}

/** No ANSI and no markup — for pipes, log files and `NO_COLOR` */
export interface TextStyledOutput extends StyledOutputInterface {
  type: 'text';
}

// *** Unions for implemented styles ***

export type AnyStyledOutput =
  AnsiRichStyledOutput |
  AnsiStyledOutput |
  ChalkStyledOutput |
  HtmlStyledOutput |
  MarkdownStyledOutput |
  TextStyledOutput;
export type StyledOutputTypes = AnyStyledOutput['type'];
