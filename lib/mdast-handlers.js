import { gfmFootnoteToMarkdown } from 'mdast-util-gfm-footnote';
import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
import { toString } from 'mdast-util-to-string';

/** @import { ListItem, Nodes, Parents } from 'mdast' */
/** @import { Info, Options, State } from 'mdast-util-to-markdown' */
/** @import { TextStylingInterface } from './style-interface-types.js' */

/**
 * Since the `Handle` from mdast-util-to-markdown is not a generic
 *
 * @template N
 * @typedef {(node: N, parent: Parents | undefined, state: State, Info: Info) => string} Handle
 */

/**
 * The parts that differ between the non-markdown styles. Everything else is
 * shared — those styles differ in decoration, not in structure.
 *
 * @typedef {object} StyleRenderers
 * @property {(value: string, lang: string | undefined) => string} codeBlock
 * @property {(value: string) => string} inlineCode
 * @property {() => string} thematicBreak
 * @property {(line: string) => string} quoteLine
 * @property {(str: string) => number} [stringLength]
 * @property {((value: string) => string) | undefined} [ansiTextElement]
 */

/**
 * Options are resolved per styler rather than once per module, so a styler that
 * overrides eg. header() has that override honored by its own fromMdast(). The
 * cache keeps the hot path a lookup instead of rebuilding the handlers per call.
 *
 * @param {(format: TextStylingInterface) => Options} build
 * @returns {(format: TextStylingInterface) => Options}
 */
export function createOptionsCache (build) {
  /** @type {WeakMap<TextStylingInterface, Options>} */
  const cache = new WeakMap();

  return format => {
    const cached = cache.get(format);

    if (cached) return cached;

    const options = build(format);

    cache.set(format, options);

    return options;
  };
}

/**
 * Builds `mdast-util-to-markdown` options whose handlers render through
 * `format`, so a customized styler renders with its own overrides.
 *
 * @param {TextStylingInterface} format
 * @param {StyleRenderers} renderers
 * @returns {Options}
 */
export function buildStyleOptions (format, renderers) {
  // Partly based on https://github.com/vweevers/markdown-to-ansi
  const {
    ansiTextElement,
    codeBlock,
    inlineCode,
    quoteLine,
    stringLength,
    thematicBreak,
  } = renderers;

  return {
    extensions: [
      gfmFootnoteToMarkdown(),
      gfmTableToMarkdown(stringLength ? { stringLength } : {}),
    ],
    bullet: '-',
    handlers: /** @satisfies {{ [K in Nodes['type']]?: Handle<Extract<Nodes, { type: K }>> }} */ ({
      text (node, _parent, state) {
        // Raw value everywhere else — backslash escapes are markdown noise in
        // these styles — but a literal pipe inside a table cell reads as a
        // column break and misaligns the whole table
        return state.stack.includes('tableCell')
          ? node.value.replaceAll('|', String.raw`\|`)
          : node.value;
      },
      code (node) {
        return codeBlock(node.value, node.lang ?? undefined);
      },
      inlineCode (node) {
        return inlineCode(node.value);
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
      blockquote (node, _parent, state, info) {
        const content = state.containerFlow(node, info);
        return content.split('\n').map(line => quoteLine(line)).join('\n');
      },
      delete (node, _parent, state, info) {
        return format.strikethrough(state.containerPhrasing(node, { ...info, before: '', after: '' }));
      },
      thematicBreak () {
        return thematicBreak();
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
      // ANSI-only: embeds pre-formatted ANSI. Styles that cannot carry escape
      // sequences leave it unhandled, the same way the markdown style does.
      ...ansiTextElement && {
        ansiTextElement: (/** @type {{ value: string }} */ node) => ansiTextElement(toString(node)),
      },
    }),
  };
}
