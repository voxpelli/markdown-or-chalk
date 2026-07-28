import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import chalk from 'chalk';

import { getOutputStyler, mdastTableHelper } from '../index.js';
import { stringWidth } from '../lib/utils/string-width.js';

/** @import { AnyStyledOutput } from '../index.js' */
/** @import { ColorSupportLevel } from 'chalk' */
/** @import { Emphasis, TableCell, TableRow } from 'mdast' */
/** @import { PhrasingContentOrString } from '../index.js' */

describe('table', () => {
  describe('mdastTableHelper', () => {
    it('should return correct mdast Table structure', () => {
      const result = mdastTableHelper(
        [
          [['Name'], ['Value']],
          [['foo'], ['bar']],
        ]
      );

      assert.deepEqual(result, {
        type: 'table',
        align: undefined,
        children: [
          {
            type: 'tableRow',
            children: [
              { type: 'tableCell', children: [{ type: 'text', value: 'Name' }] },
              { type: 'tableCell', children: [{ type: 'text', value: 'Value' }] },
            ],
          },
          {
            type: 'tableRow',
            children: [
              { type: 'tableCell', children: [{ type: 'text', value: 'foo' }] },
              { type: 'tableCell', children: [{ type: 'text', value: 'bar' }] },
            ],
          },
        ],
      });
    });

    it('should normalize strings to text nodes in cells', () => {
      const result = mdastTableHelper([['hello']]);

      const row = /** @type {TableRow} */ (result.children[0]);
      const cell = /** @type {TableCell} */ (row.children[0]);

      assert.deepEqual(cell, {
        type: 'tableCell',
        children: [{ type: 'text', value: 'hello' }],
      });
    });

    it('should pass through phrasing content nodes unchanged', () => {
      /** @type {Emphasis} */
      const emphasisNode = {
        type: 'emphasis',
        children: [{ type: 'text', value: 'important' }],
      };

      const result = mdastTableHelper([[emphasisNode]]);
      const row = /** @type {TableRow} */ (result.children[0]);
      const cell = /** @type {TableCell} */ (row.children[0]);

      assert.deepEqual(cell, {
        type: 'tableCell',
        children: [emphasisNode],
      });
    });

    it('should include align parameter when provided', () => {
      const result = mdastTableHelper(
        [
          [['A'], ['B']],
        ],
        ['left', 'right']
      );

      assert.ok('align' in result);
      assert.deepEqual(result.align, ['left', 'right']);
    });

    it('should have undefined align when not provided', () => {
      const result = mdastTableHelper([[['A']]]);

      assert.equal(result.align, undefined);
    });
  });

  describe('table() markdown mode', () => {
    /** @type {AnyStyledOutput} */
    let moc;

    before(() => {
      moc = getOutputStyler('markdown');
    });

    it('should produce markdown with pipe characters', () => {
      const result = moc.table([
        [['Name'], ['Value']],
        [['foo'], ['bar']],
      ]);

      assert.equal(typeof result, 'string');
      assert.ok(result.includes('|'));
      assert.ok(result.includes('Name'));
      assert.ok(result.includes('Value'));
      assert.ok(result.includes('foo'));
      assert.ok(result.includes('bar'));
    });

    it('should produce alignment row with dashes', () => {
      const result = moc.table(
        [
          [['A'], ['B']],
          [['1'], ['2']],
        ],
        ['left', 'right']
      );

      assert.equal(typeof result, 'string');
      assert.ok(result.includes('|'));
      // Alignment row uses : and - characters
      assert.match(result, /[|:-]+/);
    });

    it('should include a separator row between header and body', () => {
      const result = moc.table([
        [['Header']],
        [['Data']],
      ]);

      const lines = result.trim().split('\n');
      // A table with a header and one data row should produce at least 3 lines
      // (header, separator, data)
      assert.ok(lines.length >= 3);
    });
  });

  describe('table() chalk mode', () => {
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

    it('should produce string output containing cell content', () => {
      const result = moc.table([
        [['Name'], ['Value']],
        [['foo'], ['bar']],
      ]);

      assert.equal(typeof result, 'string');
      assert.ok(result.includes('Name'));
      assert.ok(result.includes('Value'));
      assert.ok(result.includes('foo'));
      assert.ok(result.includes('bar'));
    });

    it('should escape pipes in cell content so columns stay aligned', () => {
      const result = moc.table([
        [['a|b'], ['c']],
        [['1'], ['2']],
      ]);

      assert.ok(result.includes(String.raw`a\|b`));
      // Every row has the same number of unescaped column separators
      const separators = result.trim().split('\n').map(line => line.split(/(?<!\\)\|/).length);
      assert.equal(new Set(separators).size, 1);
    });

    it('should escape a backslash before a pipe, not just the pipe', () => {
      // Without escaping the backslash the row gains an unescaped delimiter
      const result = moc.table([[[String.raw`a\|b`]], [['c']]]);

      assert.ok(result.includes(String.raw`a\\\|b`), result);
    });

    it('should keep a newline in a cell from splitting the row', () => {
      const result = moc.table([[['x\ny']], [['c']]]);

      assert.equal(result.trim().split('\n').length, 3);
    });

    it('should escape pipes reaching a cell from any node type', () => {
      /** @type {PhrasingContentOrString[]} */
      const nodes = [
        { type: 'inlineCode', value: 'x|y' },
        { type: 'ansiTextElement', value: 'x|y' },
      ];

      for (const node of nodes) {
        const result = moc.table([[[node]], [['c']]]);

        assert.ok(result.includes(String.raw`x\|y`), result);
      }
    });

    it('should measure column widths the way a terminal renders them', () => {
      // Table alignment is only as good as the width measurement behind it.
      // The log symbols are the case string-width@7 got wrong: they are
      // Extended_Pictographic but *not* Emoji_Presentation, so terminals draw
      // them in one column while that version reserved two.
      /** @type {[string, number][]} */
      const widths = [
        ['a', 1],
        ['', 0],
        ['中文', 4],
        ['ｆｕｌｌ', 8],
        ['✔ ok', 4],
        ['⚠ warn', 6],
        ['ℹ info', 6],
        ['✖ fail', 6],
        ['👍', 2],
        ['✔️', 2],
        ['👩‍👩‍👧‍👦', 2],
        [chalk.bold('bold'), 4],
      ];

      for (const [value, expected] of widths) {
        assert.equal(stringWidth(value), expected, JSON.stringify(value));
      }
    });

    it('should align columns containing wide characters', () => {
      const result = moc.table([[['中文'], ['b']], [['ab'], ['c']]]);
      const [header, , body] = result.trim().split('\n');

      // Both rows occupy the same rendered width once measured properly
      assert.equal(stringWidth(/** @type {string} */ (header)), stringWidth(/** @type {string} */ (body)));
    });

    it('should not pass align to mdast in chalk mode', () => {
      // In chalk mode, align is set to undefined regardless of input
      // This means the output should still work but without alignment hints
      const result = moc.table(
        [
          [['A'], ['B']],
          [['1'], ['2']],
        ],
        ['left', 'right']
      );

      assert.equal(typeof result, 'string');
      assert.ok(result.includes('A'));
      assert.ok(result.includes('B'));
    });
  });
});
