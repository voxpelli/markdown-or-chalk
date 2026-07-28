import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import stripAnsi from 'strip-ansi';

import { getMdastOutputter, getOutputStyler } from '../index.js';
import { forceColor } from './force-color.js';

/** @import { AnyStyledOutput } from '../index.js' */

/** @type {() => void} */
let restoreColor;

// Exact string assertions need colour off — see CLAUDE.md
before(() => {
  restoreColor = forceColor('0');
});

after(() => {
  restoreColor();
});

describe('text style', () => {
  /** @type {AnyStyledOutput} */
  let moc;

  before(() => {
    moc = getOutputStyler('text');
  });

  it('should expose its type', () => {
    assert.equal(moc.type, 'text');
  });

  it('should not decorate emphasis at all', () => {
    assert.equal(moc.bold('x'), 'x');
    assert.equal(moc.italic('x'), 'x');
    assert.equal(moc.dim('x'), 'x');
    assert.equal(moc.strikethrough('x'), 'x');
    assert.equal(moc.code('x'), 'x');
  });

  it('should keep the url as readable content', () => {
    assert.equal(moc.hyperlink('text', 'https://example.com/'), 'text (https://example.com/)');
  });

  it('should drop a blocked url rather than render it', () => {
    assert.equal(moc.hyperlink('text', 'javascript:alert(1)'), 'text');
  });

  it('should underline a level 1 header only', () => {
    assert.equal(moc.header('Hi'), '\nHi\n==\n');
    assert.equal(moc.header('Hi', 2), '\nHi\n');
  });

  it('should emit no ansi escape sequences from fromMdast', () => {
    const result = getMdastOutputter('text')({
      type: 'root',
      children: [
        { type: 'heading', depth: 1, children: [{ type: 'text', value: 'T' }] },
        { type: 'paragraph', children: [{ type: 'strong', children: [{ type: 'text', value: 'b' }] }] },
        { type: 'code', lang: 'js', value: 'const x = 1;' },
      ],
    });

    assert.ok(!result.includes('\u001B'), 'should contain no escape character');
    assert.match(result, /const x = 1;/);
  });
});

describe('terminal and plain shared handlers', () => {
  for (const style of /** @type {const} */ (['ansi', 'text'])) {
    describe(`${style} style`, () => {
      it('should render a break as a newline, not a trailing backslash', () => {
        const result = getMdastOutputter(style)({
          type: 'paragraph',
          children: [{ type: 'text', value: 'a' }, { type: 'break' }, { type: 'text', value: 'b' }],
        });

        assert.equal(result, 'a\nb\n');
      });

      it('should render an image without markdown syntax', () => {
        const result = getMdastOutputter(style)({
          type: 'paragraph',
          children: [{ type: 'image', url: 'https://e.com/a.png', alt: 'pic' }],
        });

        assert.match(result, /pic/);
        assert.doesNotMatch(result, /!\[/);
      });

      it('should not put a stray blank line before a code block', () => {
        const result = getMdastOutputter(style)({
          type: 'list',
          ordered: false,
          children: [{
            type: 'listItem',
            children: [
              { type: 'paragraph', children: [{ type: 'text', value: 'item' }] },
              { type: 'code', value: 'const a = 1;' },
            ],
          }],
        });

        assert.doesNotMatch(result, /\n\n\n/);
      });

      it('should not leave trailing whitespace on blank lines in a code block', () => {
        const result = getMdastOutputter(style)({ type: 'code', value: 'a\n\nb' });

        assert.doesNotMatch(result, / +\n/);
      });
    });
  }
});

describe('ansi-rich style', () => {
  /** @type {AnyStyledOutput} */
  let moc;

  before(() => {
    moc = getOutputStyler('ansi-rich');
  });

  it('should expose its type', () => {
    assert.equal(moc.type, 'ansi-rich');
  });

  it('should box a code block and title it with the language', () => {
    // Stripped rather than asserting exact escapes: emphasize ships its own
    // highlight sheet, and the colours are not this package's contract
    const result = stripAnsi(moc.fromMdast({ type: 'code', lang: 'js', value: 'const x = 1;' }));

    assert.match(result, /const x = 1;/);
    assert.match(result, /js/);
    // boxen draws a border, the lean ansi style does not
    assert.match(result, /[┌└│]/);
  });

  it('should not crash on an unknown code block language', () => {
    const result = stripAnsi(moc.fromMdast({ type: 'code', lang: 'not-a-real-language', value: 'plain content' }));

    assert.match(result, /plain content/);
  });

  it('should keep the lean rendering out of the plain ansi style', () => {
    const lean = getOutputStyler('ansi').fromMdast({ type: 'code', lang: 'js', value: 'const x = 1;' });

    assert.match(lean, /const x = 1;/);
    assert.doesNotMatch(lean, /[┌┐└┘]/);
  });
});

describe('html style', () => {
  /** @type {AnyStyledOutput} */
  let moc;

  before(() => {
    moc = getOutputStyler('html');
  });

  it('should expose its type', () => {
    assert.equal(moc.type, 'html');
  });

  it('should use semantic elements', () => {
    assert.equal(moc.bold('x'), '<strong>x</strong>');
    assert.equal(moc.italic('x'), '<em>x</em>');
    assert.equal(moc.strikethrough('x'), '<del>x</del>');
    assert.equal(moc.header('x', 3), '\n<h3>x</h3>\n');
  });

  it('should escape text content in code and json', () => {
    assert.equal(moc.code('a<b>'), '<code>a&lt;b&gt;</code>');
    assert.match(moc.json({ a: '<x>' }), /&lt;x&gt;/);
  });

  it('should escape text nodes rendered through fromMdast', () => {
    const result = getMdastOutputter('html')({
      type: 'paragraph',
      children: [{ type: 'text', value: '<script>alert(1)</script>' }],
    });

    assert.equal(result, '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>\n');
    assert.doesNotMatch(result, /<script>/);
  });

  it('should block dangerous urls in links', () => {
    assert.equal(moc.hyperlink('t', 'javascript:alert(1)'), 't');
    assert.equal(moc.hyperlink('t', 'https://ok.example/'), '<a href="https://ok.example/">t</a>');
  });

  it('should escape quotes in href so an attribute cannot be broken out of', () => {
    const result = moc.hyperlink('t', 'https://ok.example/?a="onmouseover="x');

    assert.doesNotMatch(result, /"onmouseover="/);
    assert.match(result, /&quot;/);
  });

  it('should render tight list items unwrapped and task items with a checkbox', () => {
    const result = getMdastOutputter('html')({
      type: 'list',
      ordered: false,
      spread: false,
      children: [
        { type: 'listItem', checked: true, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'done' }] }] },
        { type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'plain' }] }] },
      ],
    });

    assert.match(result, /<li><input type="checkbox" disabled checked> done<\/li>/);
    assert.match(result, /<li>plain<\/li>/);
  });

  it('should render an ordered list with its start', () => {
    const result = getMdastOutputter('html')({
      type: 'list',
      ordered: true,
      start: 3,
      spread: false,
      children: [{ type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'a' }] }] }],
    });

    assert.match(result, /<ol start="3">/);
  });

  it('should honour styler overrides in fromMdast', () => {
    const custom = {
      ...getOutputStyler('html'),
      header: (/** @type {string} */ text) => `>>>${text}<<<`,
      bold: (/** @type {string} */ text) => `B(${text})`,
    };

    assert.equal(
      custom.fromMdast({ type: 'heading', depth: 1, children: [{ type: 'text', value: 'Hi' }] }),
      '>>>Hi<<<\n'
    );
    assert.equal(
      custom.fromMdast({ type: 'paragraph', children: [{ type: 'strong', children: [{ type: 'text', value: 'b' }] }] }),
      '<p>B(b)</p>\n'
    );
  });

  it('should keep nested markup inside link text', () => {
    const result = getMdastOutputter('html')({
      type: 'paragraph',
      children: [{
        type: 'link',
        url: 'https://e.com/',
        children: [{ type: 'strong', children: [{ type: 'text', value: 'bold' }] }, { type: 'text', value: ' link' }],
      }],
    });

    assert.equal(result, '<p><a href="https://e.com/"><strong>bold</strong> link</a></p>\n');
  });

  it('should not leak markdown syntax from reference-style links', () => {
    const result = getMdastOutputter('html')({
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'linkReference', identifier: 'x', referenceType: 'full', children: [{ type: 'text', value: 'click' }] }] },
        { type: 'definition', identifier: 'x', url: 'https://e.com/' },
      ],
    });

    assert.doesNotMatch(result, /\[click\]/);
    assert.doesNotMatch(result, /^\[x\]:/m);
    assert.match(result, /click/);
  });

  it('should use unicode log symbols regardless of the terminal', () => {
    // is-unicode-supported probes TERM — meaningless for a browser document
    assert.deepEqual(moc.logSymbols, {
      info: 'ℹ', success: '✔', warning: '⚠', error: '✖',
    });
  });

  it('should render a table with a head and a body', () => {
    const result = moc.table([[['H']], [['c']]]);

    assert.match(result, /<thead>\s*<tr><th>H<\/th><\/tr>\s*<\/thead>/);
    assert.match(result, /<tbody>\s*<tr><td>c<\/td><\/tr>\s*<\/tbody>/);
  });
});
