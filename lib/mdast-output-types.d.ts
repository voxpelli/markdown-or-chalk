import type { Root, RootContent } from 'mdast';

export type MdastToChalkOrMarkdownOptions = {
  tablePipeAlign?: boolean | undefined;
};

export type FromMdast = (node: Root | RootContent, options?: MdastToChalkOrMarkdownOptions) => string;
