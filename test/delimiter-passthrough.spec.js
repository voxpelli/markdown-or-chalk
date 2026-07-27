import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MarkdownOrChalk } from '../lib/main.js';

describe('delimiter characters in markdown mode input', () => {
  /** @type {MarkdownOrChalk} */
  let md;

  /** @param {undefined} [_] */
  const setup = (_) => { md = new MarkdownOrChalk(true); };

  it('bold() wraps input containing ** delimiters, doubling them', () => {
    setup();
    const result = md.bold('**text**');
    // Input already has bold delimiters — they get wrapped again
    assert.equal(result, '****text****');
  });

  it('italic() wraps input containing _ delimiters, doubling them', () => {
    setup();
    const result = md.italic('_text_');
    // Input already has italic delimiters — they get wrapped again
    assert.equal(result, '__text__');
  });

  it('strikethrough() wraps input containing ~~ delimiters, doubling them', () => {
    setup();
    const result = md.strikethrough('~~text~~');
    // Input already has strikethrough delimiters — they get wrapped again
    assert.equal(result, '~~~~text~~~~');
  });

  it('code() wraps input containing backtick delimiters, doubling them', () => {
    setup();
    const result = md.code('`text`');
    // Input contains backticks — code() uses double-backtick fence with spaces per CommonMark
    assert.equal(result, '`` `text` ``');
  });
});
