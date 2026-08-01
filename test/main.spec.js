import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import { getOutputStyler } from '../index.js';
import { forceColor } from './force-color.js';

/** @import { AnyStyledOutput } from '../index.js' */

describe('output styler', () => {
  describe('markdown mode', () => {
    /** @type {AnyStyledOutput} */
    let moc;

    before(() => {
      moc = getOutputStyler('markdown');
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

      it('should clamp out of range and invalid levels', () => {
        assert.equal(moc.header('Test', 0), '\n# Test\n');
        assert.equal(moc.header('Test', 42), '\n###### Test\n');
        assert.equal(moc.header('Test', Number.NaN), '\n# Test\n');
      });

      it('should collapse newlines in the heading text', () => {
        assert.equal(moc.header('Line1\nLine2', 2), '\n## Line1 Line2\n');
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
      it('style should expose its type', () => {
        assert.equal(moc.type, 'markdown');
      });

      it('should expose a markdown-style output object', () => {
        assert.equal(moc.type, 'markdown');
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

  describe('ansi style', () => {
    /** @type {AnyStyledOutput} */
    let moc;

    /** @type {() => void} */
    let restoreColor;

    before(() => {
      restoreColor = forceColor('0');
      moc = getOutputStyler('ansi');
    });

    after(() => {
      restoreColor();
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
      it('style should expose its type', () => {
        assert.equal(moc.type, 'ansi');
      });

      it('should expose an ansi-style output object', () => {
        assert.equal(moc.type, 'ansi');
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
