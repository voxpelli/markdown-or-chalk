import { toMarkdown } from 'mdast-util-to-markdown';

import { createOptionsCache } from '../mdast-handlers.js';
import { escapeHtml, escapeHtmlAttribute } from '../utils/html-escape.js';
import { plainLogSymbols } from '../utils/log-symbols-plain.js';
import { mdastTableHelper } from '../utils/mdast-table.js';
import { clampHeadingLevel, indentText } from '../utils/misc.js';
import { filterHyperlinkUrl } from '../utils/url.js';

/** @import { Nodes, Parents, TableCell, TableRow } from 'mdast' */
/** @import { Info, State } from 'mdast-util-to-markdown' */
/** @import { FromMdast } from '../mdast-output-types.js' */
/** @import { HtmlStyledOutput, TextStylingInterface } from '../style-interface-types.js' */

/**
 * @template N
 * @typedef {(node: N, parent: Parents | undefined, state: State, Info: Info) => string} Handle
 */

/**
 * Semantic HTML only — no classes and no inline styles, per the project's
 * "emit semantic HTML, consumers style it" rule. The one exception is the
 * conventional `language-*` class on code blocks, which is the hook every
 * client-side highlighter looks for (highlighting itself is out of scope).
 */
const htmlOptions = createOptionsCache(() => ({
  handlers: /** @satisfies {{ [K in Nodes['type']]?: Handle<Extract<Nodes, { type: K }>> }} */ ({
    text (node) {
      return escapeHtml(node.value);
    },
    paragraph (node, _parent, state, info) {
      return `<p>${state.containerPhrasing(node, { ...info, before: '', after: '' })}</p>`;
    },
    heading (node, _parent, state, info) {
      const level = clampHeadingLevel(node.depth);
      return `<h${level}>${state.containerPhrasing(node, { ...info, before: '', after: '' })}</h${level}>`;
    },
    strong (node, _parent, state, info) {
      return `<strong>${state.containerPhrasing(node, { ...info, before: '', after: '' })}</strong>`;
    },
    emphasis (node, _parent, state, info) {
      return `<em>${state.containerPhrasing(node, { ...info, before: '', after: '' })}</em>`;
    },
    delete (node, _parent, state, info) {
      return `<del>${state.containerPhrasing(node, { ...info, before: '', after: '' })}</del>`;
    },
    inlineCode (node) {
      return `<code>${escapeHtml(node.value)}</code>`;
    },
    code (node) {
      const languageClass = node.lang ? ` class="language-${escapeHtmlAttribute(node.lang)}"` : '';
      return `<pre><code${languageClass}>${escapeHtml(node.value)}</code></pre>`;
    },
    link (node, _parent, state, info) {
      const safeUrl = filterHyperlinkUrl(node.url);
      const content = state.containerPhrasing(node, { ...info, before: '', after: '' });

      return safeUrl ? `<a href="${escapeHtmlAttribute(safeUrl)}">${content}</a>` : content;
    },
    image (node) {
      const safeUrl = filterHyperlinkUrl(node.url);
      const alt = ` alt="${escapeHtmlAttribute(node.alt ?? '')}"`;
      const title = node.title ? ` title="${escapeHtmlAttribute(node.title)}"` : '';

      return safeUrl ? `<img src="${escapeHtmlAttribute(safeUrl)}"${alt}${title}>` : escapeHtml(node.alt ?? '');
    },
    blockquote (node, _parent, state, info) {
      return `<blockquote>\n${state.containerFlow(node, info)}\n</blockquote>`;
    },
    footnoteReference (node) {
      const id = escapeHtmlAttribute(node.identifier);
      return `<sup><a href="#fn-${id}" id="fnref-${id}">${escapeHtml(node.label ?? node.identifier)}</a></sup>`;
    },
    footnoteDefinition (node, _parent, state, info) {
      const id = escapeHtmlAttribute(node.identifier);
      return `<div id="fn-${id}">\n${state.containerFlow(node, info)}\n</div>`;
    },
    thematicBreak () {
      return '<hr>';
    },
    break () {
      return '<br>';
    },
    html (node) {
      // Raw HTML passes through — that is what an `html` node means
      return node.value;
    },
    list (node, _parent, state, info) {
      const tag = node.ordered ? 'ol' : 'ul';
      const start = node.ordered && typeof node.start === 'number' && node.start !== 1
        ? ` start="${node.start}"`
        : '';

      const spread = node.spread ?? node.children.some(child => child.spread);

      const items = node.children.map(child => {
        const [onlyChild] = child.children;
        // A tight list keeps its items unwrapped, as CommonMark renders them
        const content = !spread && child.children.length === 1 && onlyChild?.type === 'paragraph'
          ? state.containerPhrasing(onlyChild, { ...info, before: '', after: '' })
          : state.containerFlow(child, info);

        // Task list items render as a disabled checkbox, matching how GitHub
        // and other renderers express `listItem.checked`
        const checkbox = typeof child.checked === 'boolean'
          ? `<input type="checkbox" disabled${child.checked ? ' checked' : ''}> `
          : '';

        return `<li>${checkbox}${content}</li>`;
      });

      return `<${tag}${start}>\n${items.join('\n')}\n</${tag}>`;
    },
    table (node, _parent, state, info) {
      const [headerRow, ...bodyRows] = node.children;

      /**
       * @param {TableRow | undefined} row
       * @param {'th' | 'td'} cellTag
       * @returns {string}
       */
      const renderRow = (row, cellTag) => {
        const cells = (row?.children ?? []).map((/** @type {TableCell} */ cell) =>
            `<${cellTag}>${state.containerPhrasing(cell, { ...info, before: '', after: '' })}</${cellTag}>`
        );

        return `<tr>${cells.join('')}</tr>`;
      };

      const head = headerRow ? `<thead>\n${renderRow(headerRow, 'th')}\n</thead>\n` : '';
      const body = bodyRows.length
        ? `<tbody>\n${bodyRows.map(row => renderRow(row, 'td')).join('\n')}\n</tbody>\n`
        : '';

      return `<table>\n${head}${body}</table>`;
    },
  }),
}));

/**
 * @this {TextStylingInterface | void}
 * @param {Parameters<FromMdast>[0]} node
 * @returns {string}
 */
function htmlOutputFromMdast (node) {
  return toMarkdown(node, htmlOptions(this || htmlOutput));
}

/**
 * The string methods compose already-formatted fragments, so — as in every
 * other style — they do not escape their input. Build trees and render them
 * with fromMdast() when the content is untrusted; that path escapes text nodes.
 */
const htmlOutput = /** @satisfies {HtmlStyledOutput} */ (/** @type {const} */({
  type: 'html',

  fromMdast: htmlOutputFromMdast,

  /**
   * @this {TextStylingInterface | void}
   * @param {Parameters<HtmlStyledOutput['table']>[0]} rows
   * @returns {string}
   */
  table (rows) {
    return htmlOutputFromMdast.call(this, mdastTableHelper(rows));
  },

  bold: text => `<strong>${text}</strong>`,
  // No semantic element means "dim"; emphasis matches what markdown mode does
  dim: text => `<em>${text}</em>`,
  italic: text => `<em>${text}</em>`,
  strikethrough: text => `<del>${text}</del>`,
  code: text => `<code>${escapeHtml(text)}</code>`,

  json: value => `<pre><code class="language-json">${escapeHtml(JSON.stringify(value, undefined, 2) ?? 'null')}</code></pre>`,

  hyperlink (text, url) {
    const safeUrl = filterHyperlinkUrl(url);

    return safeUrl ? `<a href="${escapeHtmlAttribute(safeUrl)}">${text}</a>` : text;
  },

  list (items) {
    if (items.length === 0) return '';
    return `<ul>\n${items.map(item => `<li>${item}</li>`).join('\n')}\n</ul>\n`;
  },

  header (text, level = 1) {
    const htmlLevel = clampHeadingLevel(level);
    return `\n<h${htmlLevel}>${text.replaceAll(/\r?\n/g, ' ')}</h${htmlLevel}>\n`;
  },

  indent: indentText,

  get logSymbols () {
    return plainLogSymbols;
  },

  get logSymbolsMdast () {
    return plainLogSymbols;
  },
}));

export default Object.freeze(htmlOutput);
