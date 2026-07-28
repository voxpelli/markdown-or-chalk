import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import chalk from 'chalk';

import { getMdastOutputter, getOutputStyler } from '../index.js';

/** @import { AnsiStyledOutput, ChalkStyledOutput, MarkdownStyledOutput } from '../index.js' */

describe('mode selector', () => {
  it('markdown selector produces markdown output', () => {
    /** @type {MarkdownStyledOutput} */
    const moc = getOutputStyler('markdown');
    assert.equal(moc.type, 'markdown');
    assert.equal(moc.bold('x'), '**x**');
  });

  it('ansi selector produces ansi output', () => {
    /** @type {AnsiStyledOutput} */
    const moc = getOutputStyler('ansi');
    assert.equal(moc.type, 'ansi');
    assert.equal(moc.bold('x'), chalk.bold('x'));
  });

  it('chalk selector produces chalk output', () => {
    /** @type {ChalkStyledOutput} */
    const moc = getOutputStyler('chalk');
    assert.equal(moc.type, 'chalk');
    assert.equal(moc.bold('x'), chalk.bold('x'));
  });

  it('chalk selector exposes chalk object', () => {
    assert.equal(getOutputStyler('chalk').chalk, chalk);
  });

  it('unknown style throws a TypeError', () => {
    // @ts-expect-error -- testing invalid input
    assert.throws(() => getOutputStyler('nope'), { name: 'TypeError', message: /'nope'/ });
  });

  it('inherited Object.prototype members do not satisfy the guard', () => {
    for (const key of ['toString', 'constructor', 'valueOf', 'hasOwnProperty', '__proto__']) {
      // @ts-expect-error -- testing invalid input
      assert.throws(() => getOutputStyler(key), { name: 'TypeError' }, `getOutputStyler(${key})`);
      // @ts-expect-error -- testing invalid input
      assert.throws(() => getMdastOutputter(key), { name: 'TypeError' }, `getMdastOutputter(${key})`);
    }
  });

  it('log symbols are frozen so one consumer cannot corrupt them', () => {
    for (const style of /** @type {const} */ (['markdown', 'ansi', 'chalk', 'html', 'text', 'ansi-rich'])) {
      assert.ok(Object.isFrozen(getOutputStyler(style).logSymbols), `${style} logSymbols`);
      assert.ok(Object.isFrozen(getOutputStyler(style).logSymbolsMdast), `${style} logSymbolsMdast`);
    }
  });

  it('legacy boolean style throws a TypeError', () => {
    // @ts-expect-error -- testing the old MarkdownOrChalk boolean argument
    assert.throws(() => getOutputStyler(true), { name: 'TypeError', message: /boolean/ });
    // @ts-expect-error -- testing the old MarkdownOrChalk boolean argument
    assert.throws(() => getMdastOutputter(false), { name: 'TypeError', message: /boolean/ });
  });
});
