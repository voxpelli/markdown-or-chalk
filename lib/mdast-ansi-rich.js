import boxen from 'boxen';
import { common, createEmphasize } from 'emphasize';

import { ansiRenderers } from './mdast-ansi.js';
import { buildStyleOptions, createOptionsCache } from './mdast-handlers.js';
import { style } from './utils/style-text.js';

/** @import { Sheet } from 'emphasize' */

/**
 * `common` is highlight.js' 37-language set rather than all ~190. This does not
 * save load time — `emphasize` re-exports `lowlight`'s `all`, so importing it at
 * all pulls every grammar file into the module graph — but it does shrink the
 * `highlightAuto` search space and the per-instance registration cost, and an
 * unrecognised language already degrades to plain content below.
 */
const emphasize = createEmphasize(common);

/**
 * emphasize's own sheet is built on `new Chalk({ level: 2 })` at module scope,
 * so it colours unconditionally — `NO_COLOR`, `FORCE_COLOR=0` and a piped stdout
 * are all ignored, and `ansi-rich` was the one style that disagreed with the
 * rest of the package about whether to emit escapes. Rebuilding the same colour
 * map over `style()` decides that per call, like everything else here does.
 *
 * The classes and their colours mirror emphasize's default sheet, so the swap
 * changes when colour appears, not which token gets which colour.
 *
 * @type {Sheet}
 */
const colourSheet = Object.fromEntries(
  Object.entries({
    gray: ['comment', 'quote'],
    green: ['keyword', 'selector-tag', 'addition'],
    cyan: ['number', 'string', 'meta meta-string', 'literal', 'doctag', 'regexp'],
    blue: ['title', 'section', 'name', 'selector-id', 'selector-class'],
    yellow: ['attribute', 'attr', 'variable', 'template-variable', 'class title', 'type'],
    magenta: ['symbol', 'bullet', 'subst', 'meta', 'meta keyword', 'selector-attr', 'selector-pseudo', 'link'],
    red: ['built_in', 'deletion'],
    italic: ['emphasis'],
    bold: ['strong'],
    inverse: ['formula'],
  }).flatMap(([format, classes]) => classes.map(
    className => /** @type {const} */ ([
      className,
      (/** @type {string} */ value) => style(/** @type {Parameters<typeof style>[0]} */ (format), value),
    ])
  ))
);

/**
 * Below this, `highlightAuto` is guessing rather than detecting.
 *
 * Measured against `common` on samples of the shape CLI output actually
 * contains: a real js block scores 7, a real json block 7.04 and a shell session
 * 6, while every misdetection lands at 4 or under — `{"a": 1}` reads as css (2),
 * a line of prose as csharp (1), `const a = 1;` as ini (3) and a node stack
 * trace as javascript (4). A missed highlight costs a plain but correct block; a
 * wrong one colours tokens by a grammar the code is not written in.
 */
const MINIMUM_AUTO_RELEVANCE = 5;

/**
 * @param {string} value
 * @param {string | undefined} lang
 * @returns {string}
 */
function highlightCodeBlock (value, lang) {
  let highlighted = value;

  try {
    if (lang && emphasize.registered(lang)) {
      highlighted = emphasize.highlight(lang, value, colourSheet).value;
    } else if (!lang) {
      const auto = emphasize.highlightAuto(value, { sheet: colourSheet });

      if ((auto.relevance ?? 0) >= MINIMUM_AUTO_RELEVANCE) highlighted = auto.value;
    }
    // A language we do not have a grammar for keeps its plain content — better
    // than guessing, and better than throwing mid-render
  } catch {
    highlighted = value;
  }

  return boxen(highlighted, {
    padding: 1,
    ...lang && { title: lang },
  });
}

/** Resolved per styler so overrides are honored */
export const mdastToMarkdownAnsiRichOptions = createOptionsCache(
  format => buildStyleOptions(format, {
    ...ansiRenderers(format),
    codeBlock: highlightCodeBlock,
    // inlineCode deliberately keeps the lean rendering: auto-detecting a
    // language from a few characters of identifier is guaranteed-wrong guessing
  })
);
