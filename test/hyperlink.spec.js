import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import chalk from 'chalk';

import { getOutputStyler } from '../index.js';

/** @import { AnyStyledOutput } from '../index.js' */
/** @import { ColorSupportLevel } from 'chalk' */

describe('hyperlink', () => {
  describe('markdown mode', () => {
    /** @type {AnyStyledOutput} */
    let moc;

    before(() => {
      moc = getOutputStyler('markdown');
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

  describe('url filtering', () => {
    /** @type {AnyStyledOutput} */
    let moc;

    before(() => {
      moc = getOutputStyler('markdown');
    });

    it('should block javascript: urls', () => {
      assert.equal(moc.hyperlink('text', 'javascript:alert(1)'), 'text');
      assert.equal(moc.hyperlink('text', 'JaVaScRiPt:alert(1)'), 'text');
      assert.equal(moc.hyperlink('text', '  javascript:alert(1)'), 'text');
    });

    it('should block javascript: urls hidden by control characters', () => {
      assert.equal(moc.hyperlink('text', 'java\u0000script:alert(1)'), 'text');
      assert.equal(moc.hyperlink('text', 'java\tscript:alert(1)'), 'text');
      assert.equal(moc.hyperlink('text', '\u0001javascript:alert(1)'), 'text');
    });

    it('should block data: and vbscript: urls', () => {
      assert.equal(moc.hyperlink('text', 'data:text/html,foo'), 'text');
      assert.equal(moc.hyperlink('text', 'vbscript:msgbox'), 'text');
    });

    it('should strip control characters from allowed urls', () => {
      assert.equal(moc.hyperlink('text', 'https://example.com/\u0007a'), '[text](https://example.com/a)');
    });
  });

  describe('markdown escaping', () => {
    /** @type {AnyStyledOutput} */
    let moc;

    before(() => {
      moc = getOutputStyler('markdown');
    });

    it('should escape parentheses in urls', () => {
      assert.equal(
        moc.hyperlink('a', 'https://en.wikipedia.org/wiki/Foo_(bar)'),
        String.raw`[a](https://en.wikipedia.org/wiki/Foo_\(bar\))`
      );
    });

    it('should wrap urls containing spaces in angle brackets', () => {
      assert.equal(moc.hyperlink('a', 'https://example.com/a b'), '[a](<https://example.com/a b>)');
    });

    it('should escape square brackets in the link text', () => {
      assert.equal(moc.hyperlink('a]b', 'https://example.com/'), String.raw`[a\]b](https://example.com/)`);
    });

    it('should escape angle brackets in the link text so they cannot inject html', () => {
      assert.equal(moc.hyperlink('a<b>c', 'https://example.com/'), String.raw`[a\<b>c](https://example.com/)`);
    });

    it('should escape emphasis characters in the link text', () => {
      assert.equal(moc.hyperlink('a*b_c', 'https://example.com/'), String.raw`[a\*b\_c](https://example.com/)`);
    });
  });
});
