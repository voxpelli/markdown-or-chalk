import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import chalk from 'chalk';

import { getOutputStyler } from '../index.js';

/** @import { AnyStyledOutput } from '../index.js' */
/** @import { ColorSupportLevel } from 'chalk' */

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

    it('code should lengthen the fence for content with backticks', () => {
      assert.equal(moc.code('a`b'), '`` a`b ``');
      assert.equal(moc.code('a``b'), '``` a``b ```');
    });

    it('code should handle very large content without a call stack overflow', () => {
      const text = '`a'.repeat(150_000);
      assert.ok(moc.code(text).includes(text));
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
    after(() => { chalk.level = originalLevel; });

    it('strikethrough should contain text', () => {
      assert.ok(moc.strikethrough('text').includes('text'));
    });

    it('code should return plain text', () => {
      assert.equal(moc.code('text'), 'text');
    });
  });
});
