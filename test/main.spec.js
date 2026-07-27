import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import chalk from 'chalk';

import { MarkdownOrChalk } from '../index.js';

describe('MarkdownOrChalk', () => {
  describe('markdown mode', () => {
    /** @type {MarkdownOrChalk} */
    let moc;

    before(() => {
      moc = new MarkdownOrChalk(true);
    });

    describe('constructor', () => {
      it('should create an instance', () => {
        assert.ok(moc !== undefined && moc !== null);
      });
    });

    describe('header()', () => {
      it('should produce a markdown h1 by default', () => {
        assert.equal(moc.header('Test'), '\n# Test\n');
      });

      it('should default to level 1', () => {
        assert.equal(moc.header('Test'), moc.header('Test', 1));
      });

      it('should produce a markdown h2 for level 2', () => {
        assert.equal(moc.header('Test', 2), '\n## Test\n');
      });

      it('should produce valid output for levels 1 through 6', () => {
        for (let level = 1; level <= 6; level++) {
          const result = moc.header('Test', level);
          assert.equal(typeof result, 'string');
          assert.equal(result, `\n${''.padStart(level, '#')} Test\n`);
        }
      });
    });

    describe('bold()', () => {
      it('should wrap text in double asterisks', () => {
        assert.equal(moc.bold('Test'), '**Test**');
      });
    });

    describe('dim()', () => {
      it('should wrap text in underscores', () => {
        assert.equal(moc.dim('Test'), '_Test_');
      });
    });

    describe('italic()', () => {
      it('should wrap text in underscores', () => {
        assert.equal(moc.italic('Test'), '_Test_');
      });

      it('should produce identical output to dim() in markdown mode', () => {
        assert.equal(moc.italic('Test'), moc.dim('Test'));
      });
    });

    describe('getters', () => {
      it('chalk should be undefined', () => {
        assert.equal(moc.chalk, undefined);
      });

      it('chalkOnly should be undefined', () => {
        assert.equal(moc.chalkOnly, undefined);
      });

      it('markdownOnly should be the instance itself', () => {
        assert.equal(/** @type {MarkdownOrChalk} */ (moc.markdownOnly), moc);
      });

      it('logSymbols should have info, success, warning, error keys with string values', () => {
        const symbols = moc.logSymbols;
        assert.ok('info' in symbols);
        assert.equal(typeof symbols.info, 'string');
        assert.ok('success' in symbols);
        assert.equal(typeof symbols.success, 'string');
        assert.ok('warning' in symbols);
        assert.equal(typeof symbols.warning, 'string');
        assert.ok('error' in symbols);
        assert.equal(typeof symbols.error, 'string');
      });
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

    describe('constructor', () => {
      it('should create an instance', () => {
        assert.ok(moc !== undefined && moc !== null);
      });
    });

    describe('header()', () => {
      it('should contain the text', () => {
        assert.ok(moc.header('Test').includes('Test'));
      });

      it('should default to level 1', () => {
        assert.equal(moc.header('Test'), moc.header('Test', 1));
      });

      it('should produce output for level 2', () => {
        const result = moc.header('Test', 2);
        assert.equal(typeof result, 'string');
        assert.ok(result.includes('Test'));
      });

      it('should produce valid output for levels 1 through 6', () => {
        for (let level = 1; level <= 6; level++) {
          const result = moc.header('Test', level);
          assert.equal(typeof result, 'string');
          assert.ok(result.includes('Test'));
        }
      });
    });

    describe('bold()', () => {
      it('should contain the text', () => {
        assert.ok(moc.bold('Test').includes('Test'));
      });
    });

    describe('dim()', () => {
      it('should contain the text', () => {
        assert.ok(moc.dim('Test').includes('Test'));
      });
    });

    describe('italic()', () => {
      it('should contain the text', () => {
        assert.ok(moc.italic('Test').includes('Test'));
      });
    });

    describe('getters', () => {
      it('chalk should exist and be truthy', () => {
        assert.ok(moc.chalk !== undefined && moc.chalk !== null);
      });

      it('chalkOnly should equal the instance', () => {
        assert.equal(/** @type {MarkdownOrChalk} */ (moc.chalkOnly), moc);
      });

      it('markdownOnly should be undefined', () => {
        assert.equal(moc.markdownOnly, undefined);
      });

      it('logSymbols should have info, success, warning, error keys', () => {
        const symbols = moc.logSymbols;
        assert.ok('info' in symbols);
        assert.ok('success' in symbols);
        assert.ok('warning' in symbols);
        assert.ok('error' in symbols);
      });
    });
  });
});
