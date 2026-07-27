import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { getOutputStyler } from '../index.js';

/** @import { AnyStyledOutput } from '../index.js' */

describe('indent', () => {
  /** @type {AnyStyledOutput} */
  let moc;
  before(() => { moc = getOutputStyler('markdown'); });

  it('should indent by 2 spaces by default', () => {
    assert.equal(moc.indent('text'), '  text');
  });

  it('should indent by 4 spaces at level 2', () => {
    assert.equal(moc.indent('text', 2), '    text');
  });

  it('should indent all lines of multi-line text', () => {
    assert.equal(moc.indent('a\nb'), '  a\n  b');
  });

  it('should be mode-agnostic', () => {
    const ansi = getOutputStyler('ansi');
    assert.equal(ansi.indent('text'), '  text');
  });
});
