import boxen from 'boxen';
import chalk from 'chalk';
import { highlight, supportsLanguage } from 'cli-highlight';
import { gfmFootnoteToMarkdown } from 'mdast-util-gfm-footnote';
import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
import { toString } from 'mdast-util-to-string';
import stringWidth from 'string-width';

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
 * Options are resolved per styler rather than once per module, so a styler that
 * overrides eg. header() has that override honored by its own fromMdast(). The
 * WeakMap keeps the hot path a lookup instead of rebuilding ~13 closures per call.
 *
 * @type {WeakMap<TextStylingInterface, Options>}
 */
const optionsCache = new WeakMap();

/**
 * @param {TextStylingInterface} format
 * @returns {Options}
 */
export function mdastToMarkdownAnsiOptions (format) {
  const cached = optionsCache.get(format);

  if (cached) return cached;

  const options = buildAnsiOptions(format);

  optionsCache.set(format, options);

  return options;
}

/**
 * @param {TextStylingInterface} format
 * @returns {Options}
 */
function buildAnsiOptions (format) {
  // Partly based on https://github.com/vweevers/markdown-to-ansi
  return {
    extensions: [
      gfmFootnoteToMarkdown(),
      gfmTableToMarkdown({
        stringLength: str => stringWidth(str),
      }),
    ],
    bullet: '-',
    handlers: /** @satisfies {{ [K in Nodes['type']]?: Handle<Extract<Nodes, { type: K }>> }} */ ({
      text (node, _parent, state) {
        // Raw value everywhere else — backslash escapes are markdown noise in a
        // terminal — but a literal pipe inside a table cell reads as a column
        // break and misaligns the whole table
        return state.stack.includes('tableCell')
          ? node.value.replaceAll('|', String.raw`\|`)
          : node.value;
      },
      code (node) {
        let highlighted = node.value;

        try {
          if (!node.lang) {
            highlighted = highlight(node.value);
          } else if (supportsLanguage(node.lang)) {
            highlighted = highlight(node.value, { language: node.lang, ignoreIllegals: true });
          }
          // Unknown languages keep the unhighlighted content — cli-highlight
          // throws on them, and auto-detection would guess wrong anyway
        } catch {
          highlighted = node.value;
        }

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
        return format.header(toString(node), node.depth);
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
          const marker = node.ordered ? `${(node.start ?? 1) + i}. ` : '- ';
          // A task list item keeps its checkbox — dropping it loses the state
          const bullet = typeof child.checked === 'boolean'
            ? `${marker}[${child.checked ? 'x' : ' '}] `
            : marker;
          const continuationIndent = ' '.repeat(bullet.length);
          // List items are block containers — multiple paragraphs, nested
          // lists — so serialize them as flow, not phrasing
          const content = state.containerFlow(child, info);

          return bullet + content
            .split('\n')
            .map((line, lineIndex) => lineIndex === 0 || line === '' ? line : continuationIndent + line)
            .join('\n');
        });
        return items.join('\n');
      },
    }),
  };
}
