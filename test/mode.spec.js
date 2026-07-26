import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import chalk from 'chalk';

import { getOutputStyler } from '../index.js';

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
});
