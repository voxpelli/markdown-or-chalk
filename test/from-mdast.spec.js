import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import chalk from 'chalk';
import stripAnsi from 'strip-ansi';

import { getOutputStyler } from '../index.js';

/** @import { AnyStyledOutput } from '../index.js' */
/** @import { ColorSupportLevel } from 'chalk' */

describe('fromMdast', () => {
  describe('markdown mode', () => {
    /** @type {AnyStyledOutput} */
    let moc;

    before(() => {
      moc = getOutputStyler('markdown');
    });

    it('should produce text from a paragraph node', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [{ type: 'text', value: 'Hello world' }],
      });
      assert.match(result, /Hello world/);
    });

    it('should produce italic markdown from an emphasis node', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          { type: 'emphasis', children: [{ type: 'text', value: 'italic text' }] },
        ],
      });
      assert.match(result, /italic text/);
      // mdast-util-to-markdown uses * for emphasis by default, not _
      assert.match(result, /\*italic text\*|_italic text_/);
    });

    it('should produce bold markdown from a strong node', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          { type: 'strong', children: [{ type: 'text', value: 'bold text' }] },
        ],
      });
      assert.match(result, /\*\*bold text\*\*/);
    });

    it('should produce text from a root wrapping a paragraph', () => {
      const result = moc.fromMdast({
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'root paragraph' }],
          },
        ],
      });
      assert.match(result, /root paragraph/);
    });

    it('should produce a heading with hash prefix', () => {
      const result = moc.fromMdast({
        type: 'heading',
        depth: 2,
        children: [{ type: 'text', value: 'Title' }],
      });
      assert.match(result, /## Title/);
    });

    it('should produce a markdown link', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          {
            type: 'link',
            url: 'https://example.com',
            children: [{ type: 'text', value: 'Example' }],
          },
        ],
      });
      assert.match(result, /\[Example\]\(https:\/\/example\.com\)/);
    });

    it('should produce a fenced code block', () => {
      const result = moc.fromMdast({
        type: 'code',
        lang: 'js',
        value: 'const x = 1;',
      });
      assert.match(result, /```js/);
      assert.match(result, /const x = 1;/);
      assert.match(result, /```/);
    });

    it('should produce inline code with backticks', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          { type: 'inlineCode', value: 'foo()' },
        ],
      });
      assert.match(result, /`foo\(\)`/);
    });
  });

  describe('chalk mode', () => {
    /** @type {AnyStyledOutput} */
    let moc;

    /** @type {ColorSupportLevel} */
    let originalLevel;

    before(() => {
      originalLevel = chalk.level;
      chalk.level = /** @type {ColorSupportLevel} */ (0);
      moc = getOutputStyler('ansi');
    });

    after(() => {
      chalk.level = originalLevel;
    });

    it('should produce text from emphasis node', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          { type: 'emphasis', children: [{ type: 'text', value: 'styled' }] },
        ],
      });
      assert.match(result, /styled/);
    });

    it('should produce text from strong node', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
        ],
      });
      assert.match(result, /bold/);
    });

    it('should produce text from heading node', () => {
      const result = moc.fromMdast({
        type: 'heading',
        depth: 1,
        children: [{ type: 'text', value: 'Heading' }],
      });
      assert.match(result, /Heading/);
    });

    it('should produce text or url from link node', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          {
            type: 'link',
            url: 'https://example.com',
            children: [{ type: 'text', value: 'Click here' }],
          },
        ],
      });
      // In chalk mode with level 0 (no hyperlink support), fallback shows text or url
      const hasTextOrUrl = result.includes('Click here') || result.includes('https://example.com');
      assert.ok(hasTextOrUrl);
    });

    it('should render code blocks with content', () => {
      const result = moc.fromMdast({
        type: 'code',
        lang: 'js',
        value: 'const x = 1;',
      });
      assert.match(stripAnsi(result), /const x = 1;/);
    });

    it('should render inline code with content', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          { type: 'inlineCode', value: 'bar()' },
        ],
      });
      assert.match(result, /bar\(\)/);
    });

    it('should render blockquote with content', () => {
      const result = moc.fromMdast({
        type: 'blockquote',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'quoted text' }],
          },
        ],
      });
      assert.match(result, /quoted text/);
    });

    it('should render a list with items', () => {
      const result = moc.fromMdast({
        type: 'list',
        ordered: false,
        children: [
          { type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'item one' }] }] },
          { type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'item two' }] }] },
        ],
      });
      assert.match(result, /item one/);
      assert.match(result, /item two/);
    });

    it('should pass through ansiTextElement value', () => {
      const result = moc.fromMdast({
        type: 'root',
        // @ts-ignore — ansiTextElement is a custom mdast node type
        children: [{ type: 'paragraph', children: [{ type: 'ansiTextElement', value: 'SYMBOL' }] }],
      });
      assert.match(result, /SYMBOL/);
    });

    it('should render delete/strikethrough node', () => {
      const result = moc.fromMdast({
        type: 'root',
        children: [{ type: 'paragraph', children: [{ type: 'delete', children: [{ type: 'text', value: 'removed' }] }] }],
      });
      assert.match(result, /removed/);
    });

    it('should render thematic break as horizontal line', () => {
      const result = moc.fromMdast({
        type: 'root',
        children: [{ type: 'thematicBreak' }],
      });
      assert.match(result, /─/);
    });

    it('should render ordered list with numbers', () => {
      const result = moc.fromMdast({
        type: 'root',
        children: [{
          type: 'list',
          ordered: true,
          start: 1,
          spread: false,
          children: [
            { type: 'listItem', spread: false, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'first' }] }] },
            { type: 'listItem', spread: false, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'second' }] }] },
          ],
        }],
      });
      assert.match(result, /1\./);
      assert.match(result, /2\./);
    });
  });
});
