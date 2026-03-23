import chalk from 'chalk';
import { toMarkdown } from 'mdast-util-to-markdown';
import terminalLink from 'terminal-link';
import { mdastToMarkdownOptions } from './mdast.js';
import { mdastTableHelper } from './table.js';
import {
  logSymbols,
  logSymbolsMdast,
  markdownLogSymbols,
} from './symbols.js';

/** @typedef {'markdown' | 'chalk'} MarkdownOrChalkMode */

/** @type {ReadonlySet<string>} */
const VALID_MODES = new Set(['markdown', 'chalk']);

export class MarkdownOrChalk {
  /** @type {MarkdownOrChalkMode} */
  #mode;

  /**
   * @param {boolean | MarkdownOrChalkMode} mode
   */
  constructor (mode) {
    if (typeof mode === 'boolean') {
      this.#mode = mode ? 'markdown' : 'chalk';
    } else if (VALID_MODES.has(mode)) {
      this.#mode = /** @type {MarkdownOrChalkMode} */ (mode);
    } else {
      throw new TypeError(`Invalid mode: ${String(mode)}. Expected boolean, 'markdown', or 'chalk'.`);
    }
  }

  /**
   * @param {string} text
   * @param {number} [level]
   * @returns {string}
   */
  header (text, level = 1) {
    level = Math.max(1, Math.min(6, level ?? 1));
    return this.#mode === 'markdown'
      ? `\n${''.padStart(level, '#')} ${text}\n`
      : chalk.underline(`\n${level === 1 ? chalk.bold(text) : text}\n`);
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  bold (text) {
    return this.#mode === 'markdown'
      ? `**${text}**`
      : chalk.bold(`${text}`);
  }

  /**
   * @returns {import('chalk').ChalkInstance|undefined}
   */
  get chalk () {
    return this.#mode === 'chalk' ? chalk : undefined;
  }

  /**
   * @returns {this | undefined}
   */
  get chalkOnly () {
    return this.#mode === 'chalk' ? this : undefined;
  }

  /**
   * Note: In markdown mode, dim renders as italic (_text_) since markdown has no "dim" concept.
   *
   * @param {string} text
   * @returns {string}
   */
  dim (text) {
    return this.#mode === 'markdown'
      ? `_${text}_`
      : chalk.dim(`${text}`);
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  italic (text) {
    return this.#mode === 'markdown'
      ? `_${text}_`
      : chalk.italic(`${text}`);
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  strikethrough (text) {
    return this.#mode === 'markdown'
      ? `~~${text}~~`
      : chalk.strikethrough(`${text}`);
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  code (text) {
    if (this.#mode !== 'markdown') return text;
    // Use enough backticks to avoid breaking on content containing backticks
    if (!text.includes('`')) return `\`${text}\``;
    const maxRun = Math.max(...[...text.matchAll(/`+/g)].map(m => m[0].length));
    const fence = '`'.repeat(maxRun + 1);
    return `${fence} ${text} ${fence}`;
  }

  /**
   * @param {string} text
   * @param {string|undefined} url
   * @param {{ fallback?: boolean, fallbackToUrl?: boolean }} options
   * @returns {string}
   */
  hyperlink (text, url, { fallback = true, fallbackToUrl } = {}) {
    if (!url) return text;
    // Block javascript: URIs (case-insensitive, ignore leading whitespace/control chars)
    if (/^\s*javascript:/i.test(url)) return text;
    // Strip control characters to prevent ANSI injection via OSC 8
    // eslint-disable-next-line no-control-regex
    const safeUrl = url.replaceAll(/[\u0000-\u001F\u007F]/g, '');
    return this.#mode === 'markdown'
      ? `[${text}](${safeUrl})`
      : terminalLink(text, safeUrl, {
        fallback: fallbackToUrl ? (_text, url) => url : fallback,
      });
  }

  /**
   * @param {string[]} items
   * @returns {string}
   */
  list (items) {
    if (items.length === 0) return '';
    return this.#mode === 'markdown'
      ? items.map(item => '* ' + this.indent(item).trimStart()).join('\n') + '\n'
      : items.map(item => '- ' + item).join('\n') + '\n';
  }

  /**
   * @returns {import('./symbols.js').LogSymbols}
   */
  get logSymbols () {
    return this.#mode === 'markdown' ? markdownLogSymbols : logSymbols;
  }

  /**
   * @returns {Record<keyof import('./symbols.js').LogSymbols, import('./mdast-helpers.js').PhrasingContentOrString>}
   */
  get logSymbolsMdast () {
    return this.#mode === 'markdown' ? markdownLogSymbols : logSymbolsMdast;
  }

  /**
   * @returns {this | undefined}
   */
  get markdownOnly () {
    return this.#mode === 'markdown' ? this : undefined;
  }

  /**
   * @param {string} text
   * @param {number} [level]
   * @returns {string}
   */
  indent (text, level = 1) {
    const indent = ''.padStart(level * 2, ' ');
    return indent + text.split('\n').join('\n' + indent);
  }

  /**
   * @param {unknown} value
   * @returns {string}
   */
  json (value) {
    const str = JSON.stringify(value) ?? 'null';
    return this.#mode === 'markdown'
      ? '```json\n' + str + '\n```'
      : str;
  }

  /**
   * @param {import('./mdast-helpers.js').PhrasingContentOrStringList[][]} rows
   * @param {import('mdast').AlignType[]} [align]
   * @param {{ tablePipeAlign?: boolean }} [options]
   * @returns {string}
   */
  table (rows, align, { tablePipeAlign } = {}) {
    return this.fromMdast(
      mdastTableHelper(rows, this.#mode === 'markdown' ? align : undefined),
      { tablePipeAlign }
    );
  }

  /**
   * @param {import('mdast').Root | import('mdast').RootContent} node
   * @param {import('./mdast.js').MdastToChalkOrMarkdownOptions} [options]
   * @returns {string}
   */
  fromMdast (node, options) {
    return toMarkdown(node, mdastToMarkdownOptions(this, options));
  }
}
