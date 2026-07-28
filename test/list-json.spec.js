import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import chalk from 'chalk';

import { getOutputStyler } from '../index.js';

/** @import { AnyStyledOutput } from '../index.js' */
/** @import { ColorSupportLevel } from 'chalk' */

describe('list and json', () => {
  describe('list() markdown mode', () => {
    /** @type {AnyStyledOutput} */
    let moc;

    before(() => {
      moc = getOutputStyler('markdown');
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

    it('should work when destructured from the styler', () => {
      const { list } = getOutputStyler('markdown');
      assert.equal(list(['a', 'b']), '* a\n* b\n');
    });

    it('should indent continuation lines of multiline items', () => {
      assert.equal(moc.list(['line1\nline2', 'x']), '* line1\n  line2\n* x\n');
    });
  });

  describe('list() chalk mode', () => {
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

    it('should contain all items', () => {
      const result = moc.list(['a', 'b']);
      assert.equal(typeof result, 'string');
      assert.ok(result.includes('a'));
      assert.ok(result.includes('b'));
    });

    it('should return empty string for empty array', () => {
      assert.equal(moc.list([]), '');
    });

    it('should render bullets and indent continuation lines', () => {
      assert.equal(moc.list(['line1\nline2', 'x']), '- line1\n  line2\n- x\n');
    });
  });

  describe('json() markdown mode', () => {
    /** @type {AnyStyledOutput} */
    let moc;

    before(() => {
      moc = getOutputStyler('markdown');
    });

    it('should wrap JSON in a code block', () => {
      assert.ok(moc.json({ a: 1 }).includes('```json'));
    });

    it('should lengthen the fence when the content contains backticks', () => {
      assert.equal(moc.json({ a: 'x ``` y' }), '````json\n{"a":"x ``` y"}\n````');
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

    it('should return plain JSON string', () => {
      assert.equal(moc.json({ a: 1 }), '{"a":1}');
    });

    it('should return null string for undefined', () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      assert.equal(moc.json(undefined), 'null');
    });
  });
});
