import { gfmFootnoteToMarkdown } from 'mdast-util-gfm-footnote';
import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
import { toString } from 'mdast-util-to-string';

import { mapVisibleText, stripAnsi } from './utils/ansi.js';

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
 * @typedef StyleRenderers
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
 * Escapes a serialized fragment for a table cell, if that is where it landed.
 *
 * This has to happen per handler rather than once in a `tableCell` handler:
 * `mdast-util-gfm-table` calls its own `handleTableCell` directly from
 * `handleTableRowAsData` instead of going through `state.handle`, so a
 * `tableCell` entry in `options.handlers` is never reached. The extension
 * escapes this way too (`inlineCodeWithTable`) — overriding `inlineCode`
 * silently dropped that, which is the bug this restores.
 *
 * `mapVisibleText` keeps escape sequences intact, so a pipe inside an OSC 8
 * hyperlink URL is not escaped like a visible one.
 *
 * @param {string} value
 * @param {State} state
 * @returns {string}
 */
function escapeInCell (value, state) {
  if (!state.stack.includes('tableCell')) return value;

  return mapVisibleText(value, text => text
    .replaceAll(/[\\|]/g, String.raw`\$&`)
    // A newline would end the row entirely, and a lone CR is worse: it returns
    // the cursor to column 0 and overwrites the row already printed
    .replaceAll(/\r\n?|\n/g, ' '));
}

/**
 * Admits a caller-supplied literal — a `text`, `html`, `code` or `inlineCode`
 * value, an alt text, a footnote identifier — into the output.
 *
 * Escape sequences are removed rather than passed through. This package has a
 * node type whose whole purpose is to carry pre-formatted ANSI —
 * `ansiTextElement` — which is what makes a `text` node holding escapes not a
 * feature but a hole: the `text` style promises output safe for a log file, and
 * a raw `ESC[2J` in either style clears the reader's screen. Stripping happens
 * here rather than on the finished string so it lands *before* `escapeInCell`,
 * which would otherwise read a pipe hidden inside an OSC payload as invisible
 * and leave it unescaped.
 *
 * @param {string} value
 * @returns {string}
 */
function literal (value) {
  return stripAnsi(value);
}

/**
 * A language label, restricted rather than merely stripped.
 *
 * `lang` is as caller-supplied as any other literal — free-form on a
 * programmatically built or parsed tree — but it is not content: it names a
 * grammar, and `ansi-rich` puts it in a boxen title where an escape both
 * defeats `literal()` and makes boxen mismeasure the border. Anything that is
 * not a plausible language name is dropped rather than cleaned, matching what
 * lib/styles/html.js does before the same value reaches a class attribute.
 *
 * @param {string | null | undefined} lang
 * @returns {string | undefined}
 */
function literalLang (lang) {
  return lang && /^[\w.+-]+$/.test(lang) ? lang : undefined;
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
        return escapeInCell(literal(node.value), state);
      },
      code (node) {
        return codeBlock(literal(node.value), literalLang(node.lang));
      },
      inlineCode (node, _parent, state) {
        return escapeInCell(inlineCode(literal(node.value)), state);
      },
      link (node, _parent, state, info) {
        // Serialized children rather than toString(), so emphasis, inline code
        // and the rest survive inside link text — as they do in the html style
        const text = state.containerPhrasing(node, { ...info, before: '', after: '' });

        return escapeInCell(format.hyperlink(text, node.url), state);
      },
      html (node, _parent, state) {
        // Raw passthrough, but still escaped in a cell — a pipe from any node
        // type breaks the row, and `html` is legal phrasing content
        return escapeInCell(literal(node.value), state);
      },
      footnoteReference (node, _parent, state) {
        // No markdown syntax in these styles, so the bare marker rather than [^id]
        return escapeInCell(`[${literal(node.identifier)}]`, state);
      },
      footnoteDefinition (node, _parent, state, info) {
        return `[${literal(node.identifier)}] ` + state.containerFlow(node, info);
      },
      image (node, _parent, state) {
        // Rendered as a link so each style expresses it its own way — an OSC 8
        // hyperlink in ansi, "alt (url)" in text — rather than leaking `![]()`
        return escapeInCell(format.hyperlink(literal(node.alt || node.url), node.url), state);
      },
      // Reference-style links carry no url of their own. Without handlers they
      // fall through to markdown serialization and leak `[text][id]`, `![a][id]`
      // and a whole `[id]: url "title"` line into styles that have no markup —
      // and since nothing calls escapeInCell on them, an identifier holding a
      // pipe silently adds a column to the row it lands in
      linkReference (node, _parent, state, info) {
        return state.containerPhrasing(node, { ...info, before: '', after: '' });
      },
      imageReference (node, _parent, state) {
        return escapeInCell(literal(node.alt ?? ''), state);
      },
      definition () {
        // Not rendered content — its url belongs to whoever pairs it with a
        // reference, and these styles resolve nothing
        return '';
      },
      break (_node, _parent, state) {
        return escapeInCell('\n', state);
      },
      heading (node, _parent, state, info) {
        return format.header(
          state.containerPhrasing(node, { ...info, before: '', after: '' }),
          node.depth
        );
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
        ansiTextElement: (
          /** @type {{ value: string }} */ node,
          /** @type {unknown} */ _parent,
          /** @type {State} */ state
        ) => escapeInCell(ansiTextElement(toString(node)), state),
      },
    }),
  };
}
