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

export class MarkdownOrChalk {
  /** @type {boolean} */
  #useMarkdown;

  /**
   * @param {boolean} useMarkdown
   */
  constructor (useMarkdown) {
    this.#useMarkdown = !!useMarkdown;
  }

  /**
   * @param {string} text
   * @param {number} [level]
   * @returns {string}
   */
  header (text, level = 1) {
    level = Math.max(1, Math.min(6, level ?? 1));
    return this.#useMarkdown
      ? `\n${''.padStart(level, '#')} ${text}\n`
      : chalk.underline(`\n${level === 1 ? chalk.bold(text) : text}\n`);
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  bold (text) {
    return this.#useMarkdown
      ? `**${text}**`
      : chalk.bold(`${text}`);
  }

  /**
   * @returns {import('chalk').ChalkInstance|undefined}
   */
  get chalk () {
    return this.#useMarkdown ? undefined : chalk;
  }

  /**
   * @returns {this | undefined}
   */
  get chalkOnly () {
    return this.#useMarkdown ? undefined : this;
  }

  /**
   * Note: In markdown mode, dim renders as italic (_text_) since markdown has no "dim" concept.
   *
   * @param {string} text
   * @returns {string}
   */
  dim (text) {
    return this.#useMarkdown
      ? `_${text}_`
      : chalk.dim(`${text}`);
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  italic (text) {
    return this.#useMarkdown
      ? `_${text}_`
      : chalk.italic(`${text}`);
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  strikethrough (text) {
    return this.#useMarkdown
      ? `~~${text}~~`
      : chalk.strikethrough(`${text}`);
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  code (text) {
    if (!this.#useMarkdown) return text;
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
    return this.#useMarkdown
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
    return this.#useMarkdown
      ? items.map(item => '* ' + this.indent(item).trimStart()).join('\n') + '\n'
      : items.map(item => '- ' + item).join('\n') + '\n';
  }

  /**
   * @returns {import('./symbols.js').LogSymbols}
   */
  get logSymbols () {
    return this.#useMarkdown ? markdownLogSymbols : logSymbols;
  }

  /**
   * @returns {Record<keyof import('./symbols.js').LogSymbols, import('./mdast-helpers.js').PhrasingContentOrString>}
   */
  get logSymbolsMdast () {
    return this.#useMarkdown ? markdownLogSymbols : logSymbolsMdast;
  }

  /**
   * @returns {this | undefined}
   */
  get markdownOnly () {
    return this.#useMarkdown ? this : undefined;
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
    return this.#useMarkdown
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
      mdastTableHelper(rows, this.#useMarkdown ? align : undefined),
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
