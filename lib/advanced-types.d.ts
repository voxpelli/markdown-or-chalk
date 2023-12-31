import type { Literal as MdastLiteral } from 'mdast';

export interface AnsiTextElement extends MdastLiteral {
  type: 'ansiTextElement';
}

// Add nodes to mdast content.
declare module 'mdast' {
  interface RootContentMap {
    ansiTextElement: AnsiTextElement;
  }
  interface PhrasingContentMap {
    ansiTextElement: AnsiTextElement;
  }
}

// Add custom data tracked to turn a syntax tree into markdown.
declare module 'mdast-util-to-markdown' {
  interface ConstructNameMap {
    ansiTextElement: 'ansiTextElement'
  }
}
