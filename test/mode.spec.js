import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MarkdownOrChalk } from '../index.js';

describe('mode constructor', () => {
  it('boolean true produces markdown output', () => {
    const moc = new MarkdownOrChalk(true);
    assert.equal(moc.bold('x'), '**x**');
  });

  it('boolean false produces chalk output', () => {
    const moc = new MarkdownOrChalk(false);
    assert.equal(typeof moc.bold('x'), 'string');
  });

  it('string "markdown" matches boolean true', () => {
    const bool = new MarkdownOrChalk(true);
    const str = new MarkdownOrChalk('markdown');
    assert.equal(bool.bold('x'), str.bold('x'));
    assert.equal(bool.header('x'), str.header('x'));
  });

  it('string "chalk" matches boolean false', () => {
    const bool = new MarkdownOrChalk(false);
    const str = new MarkdownOrChalk('chalk');
    assert.ok(bool.markdownOnly === undefined);
    assert.ok(str.markdownOnly === undefined);
  });

  it('markdownOnly returns this for markdown mode', () => {
    const moc = new MarkdownOrChalk('markdown');
    assert.ok(moc.markdownOnly !== undefined);
  });

  it('chalkOnly returns this for chalk mode', () => {
    const moc = new MarkdownOrChalk('chalk');
    assert.ok(moc.chalkOnly !== undefined);
  });

  it('invalid mode throws TypeError', () => {
    assert.throws(() => new MarkdownOrChalk(/** @type {any} */ ('invalid')), TypeError);
  });
});
