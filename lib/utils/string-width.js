import { eastAsianWidth } from 'get-east-asian-width';

import { stripAnsi } from './ansi.js';

/**
 * Segmenter construction is the single most expensive thing in this module, so
 * it is built on first wide-character use rather than at import — the ASCII
 * fast path below means most callers never build one at all.
 *
 * @type {Intl.Segmenter | undefined}
 */
let segmenter;

/** Printable ASCII only, i.e. every character is exactly one column wide */
const ASCII_ONLY = /^[\u0020-\u007E]*$/;

/**
 * Zero-width: a cluster made up *entirely* of combining marks, controls and
 * format characters. Both halves matter. Anchoring keeps a ZWJ emoji sequence —
 * which contains a format character but is a visible two-column glyph — out of
 * it, while the `+` covers clusters more than one code point long: a run of two
 * combining marks with no base is a single cluster and draws nothing, and so is
 * a CRLF pair.
 *
 * `Mn`/`Me` rather than `Mark`, because `Mark` also covers `Mc` — the spacing
 * combining marks, which advance the cursor like any other glyph.
 */
const ZERO_WIDTH = /^[\p{Mn}\p{Me}\p{Control}\p{Format}\p{Default_Ignorable_Code_Point}]+$/u;

/**
 * Emoji drawn as two columns. `Emoji_Presentation` is the property that
 * distinguishes 👍 (emoji by default) from ✔ (text by default) — the latter is
 * `Extended_Pictographic` too, which is why matching on that instead reports
 * this package's own log symbols as double-width. A variation selector-16
 * forces emoji presentation on an otherwise-text character.
 */
const EMOJI_PRESENTATION = /^\p{Emoji_Presentation}/u;
const VARIATION_SELECTOR_16 = '\uFE0F';

/**
 * The rendered column width of a string, ignoring any ANSI escape sequences it
 * carries — used to align table columns.
 *
 * Inlined rather than taken from `string-width`: that package constructs an
 * `Intl.Segmenter` at module scope (the bulk of its ~18ms load) even for
 * consumers who never render a table, and its v7 emoji matching reports the
 * bare `✔ ⚠ ℹ ✖` symbols this package ships as two columns when terminals draw
 * them as one, mis-aligning every table containing a log symbol.
 *
 * @param {string} value
 * @returns {number}
 */
export function stringWidth (value) {
  const plain = stripAnsi(value);

  if (plain === '') return 0;
  if (ASCII_ONLY.test(plain)) return plain.length;

  segmenter ??= new Intl.Segmenter();

  let width = 0;

  for (const { segment } of segmenter.segment(plain)) {
    if (ZERO_WIDTH.test(segment)) continue;

    // A grapheme cluster is one glyph however many code points it spans, so
    // only the first one decides the width
    width += EMOJI_PRESENTATION.test(segment) || segment.includes(VARIATION_SELECTOR_16)
      ? 2
      : eastAsianWidth(/** @type {number} */ (segment.codePointAt(0)), { ambiguousAsWide: false });
  }

  return width;
}
