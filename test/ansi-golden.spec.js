import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import { getOutputStyler } from '../index.js';
import { forceColor } from './force-color.js';

/**
 * Golden output at a *forced* colour level.
 *
 * Every other spec runs at level 0, where all of these collapse to plain text —
 * so a change in how escape sequences are emitted would leave the whole suite
 * green while terminal output changed shape underneath it. These assertions
 * exist to make that impossible. They were written against chalk before the
 * switch to `node:util` styleText, so the two are known to agree.
 *
 * Escapes are rendered as `<ESC>` so a failure diff stays readable.
 */
const ESC = '\u001B';

/**
 * @param {string} value
 * @returns {string}
 */
const readable = value => value.replaceAll(ESC, '<ESC>');

describe('ansi golden output', () => {
  /** @type {() => void} */
  let restoreColor;

  const moc = getOutputStyler('ansi');

  before(() => {
    restoreColor = forceColor('1');
  });

  after(() => {
    restoreColor();
  });

  it('should re-open an outer style after a nested one closes', () => {
    // dim and bold share close code 22, so a naive nesting would leave " tail"
    // unstyled once the inner bold closes
    assert.equal(
      readable(moc.dim('q ' + moc.bold('B') + ' tail')),
      '<ESC>[2mq <ESC>[1mB<ESC>[22m<ESC>[2m tail<ESC>[22m'
    );
  });

  it('should style each line of a multi-line string separately', () => {
    // A single open/close spanning the newline makes terminals style the full
    // width of every line between them, including blank ones
    assert.equal(
      readable(moc.dim('l1\nl2')),
      '<ESC>[2ml1<ESC>[22m\n<ESC>[2ml2<ESC>[22m'
    );
  });

  it('should produce stable emphasis', () => {
    assert.equal(readable(moc.bold('x')), '<ESC>[1mx<ESC>[22m');
    assert.equal(readable(moc.italic('x')), '<ESC>[3mx<ESC>[23m');
    assert.equal(readable(moc.dim('x')), '<ESC>[2mx<ESC>[22m');
    assert.equal(readable(moc.strikethrough('x')), '<ESC>[9mx<ESC>[29m');
  });

  it('should produce a stable header', () => {
    assert.equal(
      readable(moc.header('Title')),
      '<ESC>[4m<ESC>[24m\n<ESC>[4m<ESC>[1mTitle<ESC>[22m<ESC>[24m\n<ESC>[4m<ESC>[24m'
    );
  });

  it('should dim every line of a blockquote through fromMdast', () => {
    const result = readable(moc.fromMdast({
      type: 'blockquote',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'quoted' }] }],
    }));

    assert.match(result, /<ESC>\[2m.*quoted.*<ESC>\[22m/);
  });

  it('should keep an outer dim alive across a nested bold in a blockquote', () => {
    const result = readable(moc.fromMdast({
      type: 'blockquote',
      children: [{
        type: 'paragraph',
        children: [
          { type: 'strong', children: [{ type: 'text', value: 'B' }] },
          { type: 'text', value: ' tail' },
        ],
      }],
    }));

    // The dim must be re-opened after the bold closes, or " tail" loses it
    assert.match(result, /<ESC>\[22m<ESC>\[2m tail/);
  });
});
