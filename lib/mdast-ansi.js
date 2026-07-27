import boxen from 'boxen';
import chalk from 'chalk';
import { highlight } from 'cli-highlight';
import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
import { toString } from 'mdast-util-to-string';
import stripAnsi from 'strip-ansi';

/** @import { ListItem, Nodes, Parents, } from 'mdast' */
/** @import { Info, Options, State } from 'mdast-util-to-markdown' */
/** @import { TextStylingInterface } from './style-interface-types.js' */

/**
 * Since the `Handle` from mdast-util-to-markdown is not a generic
 *
 * @template N
 * @typedef {(node: N, parent: Parents | undefined, state: State, Info: Info) => string} Handle
 */

/**
 * @param {TextStylingInterface} format
 * @returns {Options}
 */
export function mdastToMarkdownAnsiOptions (format) {
  // Partly based on https://github.com/vweevers/markdown-to-ansi
  return {
    extensions: [
      gfmTableToMarkdown({
        stringLength: str => stripAnsi(str).length,
      }),
    ],
    bullet: '-',
    handlers: /** @satisfies {{ [K in Nodes['type']]?: Handle<Extract<Nodes, { type: K }>> }} */ ({
      text (node) {
        return node.value;
      },
      code (node) {
        const highlighted = highlight(node.value, {
          ...node.lang && { language: node.lang },
        });

        return '\n' + boxen(highlighted, {
          padding: 1,
          ...node.lang && { title: node.lang },
        });
      },
      inlineCode (node) {
        return highlight(node.value);
      },
      link (node) {
        return format.hyperlink(toString(node), node.url);
      },
      heading (node) {
        const depth = Math.max(Math.min(6, node.depth || 1), 1);

        return format.header(toString(node), depth);
      },
      emphasis (node, _parent, state, info) {
        return format.italic(state.containerPhrasing(node, { ...info, before: '', after: '' }));
      },
      strong (node, _parent, state, info) {
        return format.bold(state.containerPhrasing(node, { ...info, before: '', after: '' }));
      },
      ansiTextElement (node) {
        return toString(node);
      },
      blockquote (node, _parent, state, info) {
        const content = state.containerFlow(node, info);
        return content.split('\n').map(line => format.dim('│ ' + line)).join('\n');
      },
      delete (node, _parent, state, info) {
        return format.strikethrough(state.containerPhrasing(node, { ...info, before: '', after: '' }));
      },
      thematicBreak () {
        return '\n' + chalk.dim('─'.repeat(40)) + '\n';
      },
      list (node, _parent, state, info) {
        const items = node.children.map((/** @type {ListItem} */ child, /** @type {number} */ i) => {
          const bullet = node.ordered ? `${(node.start ?? 1) + i}. ` : '- ';
          const content = state.containerPhrasing(child, { ...info, before: '', after: '' });
          return bullet + content;
        });
        return items.join('\n');
      },
    }),
  };
}
