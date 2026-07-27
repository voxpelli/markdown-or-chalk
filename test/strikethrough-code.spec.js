import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import chalk from 'chalk';

import { MarkdownOrChalk } from '../index.js';

describe('strikethrough and code', () => {
  describe('markdown mode', () => {
    /** @type {MarkdownOrChalk} */
    let moc;
    before(() => { moc = new MarkdownOrChalk(true); });

    it('strikethrough should wrap in ~~', () => {
      assert.equal(moc.strikethrough('text'), '~~text~~');
    });

    it('code should wrap in backticks', () => {
      assert.equal(moc.code('text'), '`text`');
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
    after(() => { chalk.level = originalLevel; });

    it('strikethrough should contain text', () => {
      assert.ok(moc.strikethrough('text').includes('text'));
    });

    it('code should return plain text', () => {
      assert.equal(moc.code('text'), 'text');
    });
  });
});
