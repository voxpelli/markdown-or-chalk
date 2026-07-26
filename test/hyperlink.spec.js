import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import chalk from 'chalk';

import { MarkdownOrChalk } from '../index.js';

/** @import { ColorSupportLevel } from 'chalk' */

describe('hyperlink', () => {
  describe('markdown mode', () => {
    /** @type {MarkdownOrChalk} */
    let moc;

    before(() => {
      moc = new MarkdownOrChalk(true);
    });

    it('should return a markdown link', () => {
      assert.equal(moc.hyperlink('text', 'https://example.com'), '[text](https://example.com)');
    });

    it('should return plain text when url is undefined', () => {
      // @ts-ignore -- testing missing url
      assert.equal(moc.hyperlink('text'), 'text');
    });

    it('should return plain text when url is empty string', () => {
      assert.equal(moc.hyperlink('text', ''), 'text');
    });

    it('should ignore fallbackToUrl option', () => {
      assert.equal(moc.hyperlink('text', 'url', { fallbackToUrl: true }), '[text](url)');
    });

    it('should ignore fallback option', () => {
      assert.equal(moc.hyperlink('text', 'url', { fallback: false }), '[text](url)');
    });
  });

  describe('chalk mode', () => {
    /** @type {MarkdownOrChalk} */
    let moc;

    /** @type {ColorSupportLevel} */
    let originalLevel;

    before(() => {
      originalLevel = chalk.level;
      chalk.level = /** @type {ColorSupportLevel} */ (0);
      moc = new MarkdownOrChalk(false);
    });

    after(() => {
      chalk.level = originalLevel;
    });

    it('should return a string containing text or url', () => {
      const result = moc.hyperlink('text', 'https://example.com');
      assert.equal(typeof result, 'string');
      assert.ok(result.includes('text') || result.includes('https://example.com'));
    });

    it('should return plain text when url is undefined', () => {
      // @ts-ignore -- testing missing url
      assert.equal(moc.hyperlink('text'), 'text');
    });

    it('should return plain text when url is empty string', () => {
      assert.equal(moc.hyperlink('text', ''), 'text');
    });

    it('should return url when fallbackToUrl is true in non-supporting terminal', () => {
      assert.equal(moc.hyperlink('text', 'url', { fallbackToUrl: true }), 'url');
    });
  });
});
