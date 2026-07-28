import assert from 'node:assert/strict';
import {
  after, before, describe, it,
} from 'node:test';

import { getMdastOutputter, getOutputStyler } from '../index.js';
import { forceColor } from './force-color.js';

/** @import { Heading, Nodes } from 'mdast' */

const HEADING = /** @type {Heading} */ ({
  type: 'heading',
  depth: 1,
  children: [{ type: 'text', value: 'Hi' }],
});

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
      blockquote: { type: 'blockquote', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'q' }] }] },
      thematicBreak: { type: 'thematicBreak' },
    };

    for (const [name, node] of Object.entries(SHARED_CONSTRUCTS)) {
      it(`should render ${name} in every style`, () => {
        for (const style of /** @type {const} */ (['markdown', 'ansi', 'html', 'text'])) {
          assert.doesNotThrow(
            () => getMdastOutputter(style)(/** @type {Nodes} */ (node)),
            `${name} should render in the ${style} style`
          );
        }
      });
    }
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
