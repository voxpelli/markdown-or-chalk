import assert from 'node:assert/strict';
import {
  afterEach, beforeEach, describe, it,
} from 'node:test';

import stripAnsi from 'strip-ansi';

import { getMdastOutputter } from '../index.js';
import { forceColor } from './force-color.js';

/** @import { FromMdast } from '../index.js' */

describe('fromMdast', () => {
  describe('markdown mode', () => {
    /** @type {FromMdast} */
    let fromMdast;

    beforeEach(() => {
      fromMdast = getMdastOutputter('markdown');
    });

    it('should produce text from a paragraph node', () => {
      const result = fromMdast({
        type: 'paragraph',
        children: [{ type: 'text', value: 'Hello world' }],
      });
      assert.match(result, /Hello world/);
    });

    it('should produce italic markdown from an emphasis node', () => {
      const result = fromMdast({
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
      const result = fromMdast({
        type: 'paragraph',
        children: [
          { type: 'strong', children: [{ type: 'text', value: 'bold text' }] },
        ],
      });
      assert.match(result, /\*\*bold text\*\*/);
    });

    it('should produce text from a root wrapping a paragraph', () => {
      const result = fromMdast({
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
      const result = fromMdast({
        type: 'heading',
        depth: 2,
        children: [{ type: 'text', value: 'Title' }],
      });
      assert.match(result, /## Title/);
    });

    it('should produce a markdown link', () => {
      const result = fromMdast({
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
      const result = fromMdast({
        type: 'code',
        lang: 'js',
        value: 'const x = 1;',
      });
      assert.match(result, /```js/);
      assert.match(result, /const x = 1;/);
      assert.match(result, /```/);
    });

    it('should produce inline code with backticks', () => {
      const result = fromMdast({
        type: 'paragraph',
        children: [
          { type: 'inlineCode', value: 'foo()' },
        ],
      });
      assert.match(result, /`foo\(\)`/);
    });

    it('should render strikethrough (delete) nodes', () => {
      const result = fromMdast({
        type: 'paragraph',
        children: [{ type: 'delete', children: [{ type: 'text', value: 'gone' }] }],
      });
      assert.equal(result, '~~gone~~\n');
    });
  });

  describe('ansi mode', () => {
    /** @type {FromMdast} */
    let fromMdast;

    /** @type {() => void} */
    let restoreColor;

    beforeEach(() => {
      restoreColor = forceColor('0');
      fromMdast = getMdastOutputter('ansi');
    });

    afterEach(() => {
      restoreColor();
    });

    it('should produce text from emphasis node', () => {
      const result = fromMdast({
        type: 'paragraph',
        children: [
          { type: 'emphasis', children: [{ type: 'text', value: 'styled' }] },
        ],
      });
      assert.match(result, /styled/);
    });

    it('should produce text from strong node', () => {
      const result = fromMdast({
        type: 'paragraph',
        children: [
          { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
        ],
      });
      assert.match(result, /bold/);
    });

    it('should produce text from heading node', () => {
      const result = fromMdast({
        type: 'heading',
        depth: 1,
        children: [{ type: 'text', value: 'Heading' }],
      });
      assert.match(result, /Heading/);
    });

    it('should produce text or url from link node', () => {
      const result = fromMdast({
        type: 'paragraph',
        children: [
          {
            type: 'link',
            url: 'https://example.com',
            children: [{ type: 'text', value: 'Click here' }],
          },
        ],
      });
      // With colour off (no hyperlink support), fallback shows text or url
      const hasTextOrUrl = result.includes('Click here') || result.includes('https://example.com');
      assert.ok(hasTextOrUrl);
    });

    it('should render code blocks with content', () => {
      const result = fromMdast({
        type: 'code',
        lang: 'js',
        value: 'const x = 1;',
      });
      assert.match(stripAnsi(result), /const x = 1;/);
    });

    it('should render inline code with content', () => {
      const result = fromMdast({
        type: 'paragraph',
        children: [
          { type: 'inlineCode', value: 'bar()' },
        ],
      });
      assert.match(result, /bar\(\)/);
    });

    it('should render blockquote with content', () => {
      const result = fromMdast({
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
      const result = fromMdast({
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
      const result = fromMdast({
        type: 'root',
        // @ts-ignore — ansiTextElement is a custom mdast node type
        children: [{ type: 'paragraph', children: [{ type: 'ansiTextElement', value: 'SYMBOL' }] }],
      });
      assert.match(result, /SYMBOL/);
    });

    it('should render delete/strikethrough node', () => {
      const result = fromMdast({
        type: 'root',
        children: [{ type: 'paragraph', children: [{ type: 'delete', children: [{ type: 'text', value: 'removed' }] }] }],
      });
      assert.match(result, /removed/);
    });

    it('should render thematic break as horizontal line', () => {
      const result = fromMdast({
        type: 'root',
        children: [{ type: 'thematicBreak' }],
      });
      assert.match(result, /─/);
    });

    it('should render ordered list with numbers', () => {
      const result = fromMdast({
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

    it('should not crash on unknown code block languages', () => {
      const result = fromMdast({ type: 'code', lang: 'not-a-real-language', value: 'plain content' });
      assert.match(stripAnsi(result), /plain content/);
    });

    it('should separate multiple paragraphs in a list item', () => {
      const result = fromMdast({
        type: 'list',
        ordered: false,
        children: [{
          type: 'listItem',
          children: [
            { type: 'paragraph', children: [{ type: 'text', value: 'para one' }] },
            { type: 'paragraph', children: [{ type: 'text', value: 'para two' }] },
          ],
        }],
      });
      assert.equal(result, '- para one\n\n  para two\n');
    });

    it('should indent nested lists under their parent item', () => {
      const result = fromMdast({
        type: 'list',
        ordered: false,
        children: [{
          type: 'listItem',
          children: [
            { type: 'paragraph', children: [{ type: 'text', value: 'parent' }] },
            { type: 'list', ordered: false, children: [{ type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'nested' }] }] }] },
          ],
        }],
      });
      assert.equal(result, '- parent\n\n  - nested\n');
    });
  });
});
