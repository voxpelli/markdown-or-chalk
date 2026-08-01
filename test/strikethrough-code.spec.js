import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import { getOutputStyler } from '../index.js';
import { forceColor } from './force-color.js';

/** @import { AnyStyledOutput } from '../index.js' */

describe('strikethrough and code', () => {
  describe('markdown mode', () => {
    /** @type {AnyStyledOutput} */
    let moc;
    before(() => { moc = getOutputStyler('markdown'); });

    it('strikethrough should wrap in ~~', () => {
      assert.equal(moc.strikethrough('text'), '~~text~~');
    });

    it('code should wrap in backticks', () => {
      assert.equal(moc.code('text'), '`text`');
    });

    it('code should pick a fence that does not collide with the content', () => {
      assert.equal(moc.code('a`b'), '``a`b``');
      // A single backtick is enough here — the content has no run of exactly one
      assert.equal(moc.code('a``b'), '`a``b`');
    });

    it('code should preserve leading and trailing spaces', () => {
      assert.equal(moc.code(' x '), '`  x  `');
    });

    it('code should handle very large content without a call stack overflow', () => {
      const text = '`a'.repeat(150_000);
      assert.ok(moc.code(text).includes(text));
    });

    it('code should agree with fromMdast on the same content', () => {
      for (const value of ['text', 'a`b', 'a``b', ' x ', '`']) {
        assert.equal(
          moc.code(value),
          moc.fromMdast({ type: 'paragraph', children: [{ type: 'inlineCode', value }] }).trimEnd(),
          `code(${JSON.stringify(value)}) should match the mdast serializer`
        );
      }
    });
  });

  describe('ansi style', () => {
    /** @type {AnyStyledOutput} */
    let moc;
    /** @type {() => void} */
    let restoreColor;
    before(() => {
      restoreColor = forceColor('0');
      moc = getOutputStyler('ansi');
    });
    after(() => { restoreColor(); });

    it('strikethrough should contain text', () => {
      assert.ok(moc.strikethrough('text').includes('text'));
    });

    it('code should return plain text', () => {
      assert.equal(moc.code('text'), 'text');
    });
  });
});
