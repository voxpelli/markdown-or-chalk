import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getOutputStyler } from '../index.js';

/** @import { AnyStyledOutput, AnsiStyledOutput } from '../index.js' */

describe('mode selector', () => {
  it('markdown selector produces markdown output', () => {
    /** @type {AnyStyledOutput} */
    const moc = getOutputStyler('markdown');
    assert.equal(moc.type, 'markdown');
    assert.equal(moc.bold('x'), '**x**');
  });

  it('ansi selector produces ansi output', () => {
    /** @type {AnsiStyledOutput} */
    const moc = getOutputStyler('ansi');
    assert.equal(moc.type, 'ansi');
    assert.equal(typeof moc.bold('x'), 'string');
  });

  it('chalk selector produces chalk output', () => {
    /** @type {AnyStyledOutput} */
    const moc = getOutputStyler('chalk');
    assert.equal(moc.type, 'chalk');
    assert.equal(typeof moc.bold('x'), 'string');
  });
});
