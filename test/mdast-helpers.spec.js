import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mdastLinkify, mdastListHelper } from '../index.js';
import { ensurePhrasingContentList } from '../lib/utils/mdast-helpers.js';

/** @import { Emphasis, Paragraph, Text } from 'mdast' */

describe('mdast helpers', () => {
  describe('mdastLinkify', () => {
    it('should return a link node when url is provided', () => {
      assert.deepEqual(mdastLinkify('text', 'https://example.com'), {
        type: 'link',
        url: 'https://example.com',
        children: [{ type: 'text', value: 'text' }],
      });
    });

    it('should return a text node when url is undefined', () => {
      // @ts-ignore -- testing undefined explicitly
      assert.deepEqual(mdastLinkify('text'), {
        type: 'text',
        value: 'text',
      });
    });

    it('should return a text node when skipLinks is true', () => {
      assert.deepEqual(mdastLinkify('text', 'https://example.com', true), {
        type: 'text',
        value: 'text',
      });
    });

    it('should return a link node when skipLinks is false', () => {
      assert.deepEqual(mdastLinkify('text', 'https://example.com', false), {
        type: 'link',
        url: 'https://example.com',
        children: [{ type: 'text', value: 'text' }],
      });
    });
  });

  describe('ensurePhrasingContentList', () => {
    it('should convert a single string to an array with a text node', () => {
      assert.deepEqual(ensurePhrasingContentList('hello'), [
        { type: 'text', value: 'hello' },
      ]);
    });

    it('should convert an array of strings to an array of text nodes', () => {
      assert.deepEqual(ensurePhrasingContentList(['foo', 'bar']), [
        { type: 'text', value: 'foo' },
        { type: 'text', value: 'bar' },
      ]);
    });

    it('should pass through a single mdast node unchanged', () => {
      /** @type {Text} */
      const node = { type: 'text', value: 'existing' };

      const result = ensurePhrasingContentList(node);

      assert.deepEqual(result, [node]);
    });

    it('should normalize a mixed array of strings and nodes', () => {
      /** @type {Emphasis} */
      const emphNode = { type: 'emphasis', children: [{ type: 'text', value: 'bold' }] };

      assert.deepEqual(ensurePhrasingContentList(['hello', emphNode]), [
        { type: 'text', value: 'hello' },
        emphNode,
      ]);
    });
  });

  describe('mdastListHelper', () => {
    it('should return a list with listItem children from string arrays', () => {
      const result = mdastListHelper(['a', 'b']);

      assert.deepEqual(result, {
        type: 'list',
        spread: false,
        children: [
          {
            type: 'listItem',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: 'a' }] }],
          },
          {
            type: 'listItem',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: 'b' }] }],
          },
        ],
      });
    });

    it('should have listItem type for each child', () => {
      const result = mdastListHelper(['a', 'b']);

      for (const child of result.children) {
        assert.equal(child.type, 'listItem');
        assert.ok(child.children !== undefined);
        assert.equal(/** @type {Paragraph} */ (child.children[0]).type, 'paragraph');
      }
    });

    it('should return a list with empty children for an empty array', () => {
      const result = mdastListHelper([]);

      assert.deepEqual(result, {
        type: 'list',
        spread: false,
        children: [],
      });
    });

    it('should handle mdast node items correctly', () => {
      /** @type {Emphasis} */
      const emphNode = { type: 'emphasis', children: [{ type: 'text', value: 'em' }] };

      const result = mdastListHelper([emphNode]);

      assert.deepEqual(result, {
        type: 'list',
        spread: false,
        children: [
          {
            type: 'listItem',
            children: [{ type: 'paragraph', children: [emphNode] }],
          },
        ],
      });
    });
  });
});
