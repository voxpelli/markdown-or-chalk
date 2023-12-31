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
   * @param {string|undefined} url
   * @param {{ fallback?: boolean, fallbackToUrl?: boolean }} options
   * @returns {string}
   */
  hyperlink (text, url, { fallback = true, fallbackToUrl } = {}) {
    if (!url) return text;
    return this.#useMarkdown
      ? `[${text}](${url})`
      : terminalLink(text, url, {
        fallback: fallbackToUrl ? (_text, url) => url : fallback,
      });
  }

  /**
   * @param {string[]} items
   * @returns {string}
   */
  list (items) {
    const indentedContent = items.map(item => this.indent(item).trimStart());
    return this.#useMarkdown
      ? '* ' + indentedContent.join('\n* ') + '\n'
      : indentedContent.join('\n') + '\n';
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
    return this.#useMarkdown
      ? '```json\n' + JSON.stringify(value) + '\n```'
      : JSON.stringify(value);
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
   * @param {import('mdast').Root | import('mdast').Content} node
   * @param {import('./mdast.js').MdastToChalkOrMarkdownOptions} [options]
   * @returns {string}
   */
  fromMdast (node, options) {
    return toMarkdown(node, mdastToMarkdownOptions(this, options));
  }
}
