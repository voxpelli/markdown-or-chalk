import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { MarkdownOrChalk } from '../index.js';

describe('indent', () => {
  /** @type {MarkdownOrChalk} */
  let moc;
  before(() => { moc = new MarkdownOrChalk(true); });

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
    const chalk = new MarkdownOrChalk(false);
    assert.equal(chalk.indent('text'), '  text');
  });
});
