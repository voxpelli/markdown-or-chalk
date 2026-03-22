import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';

import chalk from 'chalk';

import { MarkdownOrChalk } from '../index.js';

describe('fromMdast', () => {
  describe('markdown mode', () => {
    /** @type {MarkdownOrChalk} */
    let moc;

    before(() => {
      moc = new MarkdownOrChalk(true);
    });

    it('should produce text from a paragraph node', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [{ type: 'text', value: 'Hello world' }],
      });
      assert.ok(result.includes('Hello world'));
    });

    it('should produce italic markdown from an emphasis node', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          { type: 'emphasis', children: [{ type: 'text', value: 'italic text' }] },
        ],
      });
      assert.ok(result.includes('italic text'));
      // mdast-util-to-markdown uses * for emphasis by default, not _
      assert.ok(result.includes('*italic text*') || result.includes('_italic text_'));
    });

    it('should produce bold markdown from a strong node', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          { type: 'strong', children: [{ type: 'text', value: 'bold text' }] },
        ],
      });
      assert.ok(result.includes('**bold text**'));
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
      assert.ok(result.includes('root paragraph'));
    });

    it('should produce a heading with hash prefix', () => {
      const result = moc.fromMdast({
        type: 'heading',
        depth: 2,
        children: [{ type: 'text', value: 'Title' }],
      });
      assert.ok(result.includes('## Title'));
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
      assert.ok(result.includes('[Example](https://example.com)'));
    });

    it('should produce a fenced code block', () => {
      const result = moc.fromMdast({
        type: 'code',
        lang: 'js',
        value: 'const x = 1;',
      });
      assert.ok(result.includes('```js'));
      assert.ok(result.includes('const x = 1;'));
      assert.ok(result.includes('```'));
    });

    it('should produce inline code with backticks', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          { type: 'inlineCode', value: 'foo()' },
        ],
      });
      assert.ok(result.includes('`foo()`'));
    });
  });

  describe('chalk mode', () => {
    /** @type {MarkdownOrChalk} */
    let moc;

    /** @type {import('chalk').ColorSupportLevel} */
    let originalLevel;

    before(() => {
      originalLevel = chalk.level;
      chalk.level = /** @type {import('chalk').ColorSupportLevel} */ (0);
      moc = new MarkdownOrChalk(false);
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
      assert.ok(result.includes('styled'));
    });

    it('should produce text from strong node', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
        ],
      });
      assert.ok(result.includes('bold'));
    });

    it('should produce text from heading node', () => {
      const result = moc.fromMdast({
        type: 'heading',
        depth: 1,
        children: [{ type: 'text', value: 'Heading' }],
      });
      assert.ok(result.includes('Heading'));
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
      assert.ok(result.includes('const x = 1;'));
    });

    it('should render inline code with content', () => {
      const result = moc.fromMdast({
        type: 'paragraph',
        children: [
          { type: 'inlineCode', value: 'bar()' },
        ],
      });
      assert.ok(result.includes('bar()'));
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
      assert.ok(result.includes('quoted text'));
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
      assert.ok(result.includes('item one'));
      assert.ok(result.includes('item two'));
    });
  });
});
