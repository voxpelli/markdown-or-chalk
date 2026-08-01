import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import { getMdastOutputter, getOutputStyler } from '../index.js';
import { forceColor } from './force-color.js';

/** @import { Heading, Nodes } from 'mdast' */
/** @import { AnsiTextElement } from '../index.js' */

const HEADING = /** @type {Heading} */ ({
  type: 'heading',
  depth: 1,
  children: [{ type: 'text', value: 'Hi' }],
});

const readSuccessValue = () =>
  /** @type {AnsiTextElement} */ (getOutputStyler('ansi').logSymbolsMdast.success).value;

describe('style contract', () => {
  /** @type {() => void} */
  let restoreColor;

  before(() => {
    restoreColor = forceColor('0');
  });

  after(() => {
    restoreColor();
  });

  describe('customized stylers', () => {
    it('should honour an overridden header in its own fromMdast', () => {
      const custom = {
        ...getOutputStyler('ansi'),
        header: (/** @type {string} */ text) => `>>>${text}<<<`,
      };

      assert.equal(custom.fromMdast(HEADING), '>>>Hi<<<\n');
    });

    it('should honour an overridden hyperlink in its own fromMdast', () => {
      const custom = {
        ...getOutputStyler('ansi'),
        hyperlink: (/** @type {string} */ text) => `[[${text}]]`,
      };

      const result = custom.fromMdast({
        type: 'paragraph',
        children: [{
          type: 'link',
          url: 'https://example.com/',
          children: [{ type: 'text', value: 'L' }],
        }],
      });

      assert.equal(result, '[[L]]\n');
    });

    it('should honour overrides through table() too', () => {
      const custom = {
        ...getOutputStyler('ansi'),
        bold: (/** @type {string} */ text) => `B(${text})`,
      };

      const result = custom.table([[[{ type: 'strong', children: [{ type: 'text', value: 'h' }] }]]]);

      assert.match(result, /B\(h\)/);
    });

    it('should fall back to the base styler when fromMdast is detached', () => {
      const { fromMdast } = getOutputStyler('ansi');

      assert.equal(fromMdast(HEADING), getMdastOutputter('ansi')(HEADING));
    });
  });

  describe('cross-style consistency', () => {
    // Compose once, render either way — a construct must never render in one
    // style and throw in another. `ansiTextElement` is deliberately excluded:
    // it is an ANSI-only node by design.
    const SHARED_CONSTRUCTS = {
      strikethrough: { type: 'paragraph', children: [{ type: 'delete', children: [{ type: 'text', value: 'gone' }] }] },
      taskList: { type: 'list', ordered: false, children: [{ type: 'listItem', checked: true, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'done' }] }] }] },
      footnoteReference: { type: 'paragraph', children: [{ type: 'footnoteReference', identifier: 'a' }] },
      footnoteDefinition: { type: 'footnoteDefinition', identifier: 'a', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'note' }] }] },
      table: { type: 'table', children: [{ type: 'tableRow', children: [{ type: 'tableCell', children: [{ type: 'text', value: 'c' }] }] }] },
      // Rows and cells outside a table: the terminal styles get these free from
      // gfmTableToMarkdown, so only html had to be taught them
      tableRow: { type: 'tableRow', children: [{ type: 'tableCell', children: [{ type: 'text', value: 'c' }] }] },
      tableCell: { type: 'tableCell', children: [{ type: 'text', value: 'c' }] },
      listItem: { type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'i' }] }] },
      linkReference: { type: 'paragraph', children: [{ type: 'linkReference', identifier: 'd', referenceType: 'full', children: [{ type: 'text', value: 'L' }] }] },
      imageReference: { type: 'paragraph', children: [{ type: 'imageReference', identifier: 'd', referenceType: 'full', alt: 'A' }] },
      definition: { type: 'definition', identifier: 'd', url: 'https://e.com/' },
      blockquote: { type: 'blockquote', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'q' }] }] },
      thematicBreak: { type: 'thematicBreak' },
    };

    for (const [name, node] of Object.entries(SHARED_CONSTRUCTS)) {
      it(`should render ${name} in every style`, () => {
        // ansi-rich included: it is the style most likely to hide a crash, since
        // it swaps in boxen and emphasize on top of the shared handlers
        for (const style of /** @type {const} */ (['markdown', 'ansi', 'ansi-rich', 'html', 'text'])) {
          assert.doesNotThrow(
            () => getMdastOutputter(style)(/** @type {Nodes} */ (node)),
            `${name} should render in the ${style} style`
          );
        }
      });
    }

    // Reference-style links are exactly what remark-parse emits for `[a][b]`,
    // so leaving them unhandled leaked `[L][d]` and a whole `[d]: url` line into
    // the styles whose entire promise is that they carry no markup
    for (const style of /** @type {const} */ (['ansi', 'html', 'text'])) {
      it(`should not leak reference-link syntax into ${style}`, () => {
        const render = getMdastOutputter(style);

        assert.doesNotMatch(render(/** @type {Nodes} */ (SHARED_CONSTRUCTS.linkReference)), /\[L\]\[d\]/);
        assert.doesNotMatch(render(/** @type {Nodes} */ (SHARED_CONSTRUCTS.imageReference)), /!\[A\]/);
        assert.doesNotMatch(render(/** @type {Nodes} */ (SHARED_CONSTRUCTS.definition)), /\[d\]:/);
      });
    }

    it('should not leak a markdown bullet into html', () => {
      assert.doesNotMatch(
        getMdastOutputter('html')(/** @type {Nodes} */ (SHARED_CONSTRUCTS.listItem)),
        /^\*/
      );
    });
  });

  describe('overrides across styles', () => {
    // Every style but markdown routes its styling nodes through `format`;
    // markdown deliberately serializes stock so its output stays valid markdown.
    // text and html each used to skip `code` alone, which made an override work
    // when called directly and vanish when the same styler rendered a tree.
    for (const style of /** @type {const} */ (['ansi', 'ansi-rich', 'html', 'text'])) {
      it(`should honour an overridden code in the ${style} fromMdast`, () => {
        const custom = {
          ...getOutputStyler(style),
          code: (/** @type {string} */ text) => `CODE(${text})`,
        };

        const result = custom.fromMdast({
          type: 'paragraph',
          children: [{ type: 'inlineCode', value: 'x' }],
        });

        assert.match(result, /CODE\(x\)/, 'the override must reach the inlineCode handler');
      });
    }
  });

  describe('log symbols', () => {
    it('should resolve colour per access, not at import', () => {
      const { logSymbols } = getOutputStyler('ansi');
      const restoreOff = forceColor('0');
      const plain = logSymbols.info;

      restoreOff();

      const restoreOn = forceColor('1');
      const coloured = logSymbols.info;

      restoreOn();

      assert.notEqual(plain, coloured, 'colour policy set after import must be honoured');
      assert.ok(coloured.includes('\u001B'), 'forced colour should emit escapes');
      assert.ok(!plain.includes('\u001B'), 'forced no-colour should emit none');
    });

    it('should not let one consumer mutate them for everyone', () => {
      const before = readSuccessValue();

      assert.throws(() => {
        /** @type {AnsiTextElement} */ (getOutputStyler('ansi').logSymbolsMdast.success).value = 'HACKED';
      }, TypeError);
      assert.equal(readSuccessValue(), before);
    });

    it('should keep node identity stable so consumers can memoise', () => {
      const { logSymbolsMdast } = getOutputStyler('ansi');

      assert.equal(logSymbolsMdast.success, logSymbolsMdast.success);
    });
  });

  describe('task lists', () => {
    it('should keep the checkbox state in markdown', () => {
      const result = getOutputStyler('markdown').fromMdast(/** @type {Nodes} */ ({
        type: 'list',
        ordered: false,
        children: [
          { type: 'listItem', checked: true, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'done' }] }] },
          { type: 'listItem', checked: false, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'todo' }] }] },
        ],
      }));

      assert.match(result, /\[x\] done/);
      assert.match(result, /\[ \] todo/);
    });

    it('should keep the checkbox state in ansi', () => {
      const result = getOutputStyler('ansi').fromMdast(/** @type {Nodes} */ ({
        type: 'list',
        ordered: false,
        children: [
          { type: 'listItem', checked: true, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'done' }] }] },
          { type: 'listItem', checked: false, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'todo' }] }] },
        ],
      }));

      assert.match(result, /\[x\] done/);
      assert.match(result, /\[ \] todo/);
    });
  });
});
