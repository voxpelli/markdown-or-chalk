import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';

import chalk from 'chalk';

import { MarkdownOrChalk } from '../index.js';

describe('list and json', () => {
  describe('list() markdown mode', () => {
    /** @type {MarkdownOrChalk} */
    let moc;

    before(() => {
      moc = new MarkdownOrChalk(true);
    });

    it('should format multiple items as a markdown list', () => {
      assert.equal(moc.list(['a', 'b']), '* a\n* b\n');
    });

    it('should return empty string for empty array', () => {
      assert.equal(moc.list([]), '');
    });

    it('should format a single item', () => {
      assert.equal(moc.list(['a']), '* a\n');
    });
  });

  describe('list() chalk mode', () => {
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

    it('should contain all items', () => {
      const result = moc.list(['a', 'b']);
      assert.equal(typeof result, 'string');
      assert.ok(result.includes('a'));
      assert.ok(result.includes('b'));
    });

    it('should return empty string for empty array', () => {
      assert.equal(moc.list([]), '');
    });
  });

  describe('json() markdown mode', () => {
    /** @type {MarkdownOrChalk} */
    let moc;

    before(() => {
      moc = new MarkdownOrChalk(true);
    });

    it('should wrap JSON in a code block', () => {
      assert.ok(moc.json({ a: 1 }).includes('```json'));
    });

    it('should return a string for undefined', () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      assert.equal(typeof moc.json(undefined), 'string');
    });

    it('should contain null for null value', () => {
      // eslint-disable-next-line unicorn/no-null
      assert.ok(moc.json(null).includes('null'));
    });
  });

  describe('json() chalk mode', () => {
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

    it('should return plain JSON string', () => {
      assert.equal(moc.json({ a: 1 }), '{"a":1}');
    });

    it('should return null string for undefined', () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      assert.equal(moc.json(undefined), 'null');
    });
  });
});
