import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';

import chalk from 'chalk';

import { MarkdownOrChalk, mdastTableHelper } from '../index.js';

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

      const row = /** @type {import('mdast').TableRow} */ (result.children[0]);
      const cell = /** @type {import('mdast').TableCell} */ (row.children[0]);

      assert.deepEqual(cell, {
        type: 'tableCell',
        children: [{ type: 'text', value: 'hello' }],
      });
    });

    it('should pass through phrasing content nodes unchanged', () => {
      /** @type {import('mdast').Emphasis} */
      const emphasisNode = {
        type: 'emphasis',
        children: [{ type: 'text', value: 'important' }],
      };

      const result = mdastTableHelper([[emphasisNode]]);
      const row = /** @type {import('mdast').TableRow} */ (result.children[0]);
      const cell = /** @type {import('mdast').TableCell} */ (row.children[0]);

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
    /** @type {MarkdownOrChalk} */
    let moc;

    before(() => {
      moc = new MarkdownOrChalk(true);
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
