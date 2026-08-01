import baseStringWidth from 'string-width';

import { stripAnsi } from './ansi.js';

/**
 * The rendered column width of a string, ignoring any ANSI escape sequences it
 * carries — used to align table columns.
 *
 * Escapes are stripped here rather than left to `string-width`'s own pass,
 * because this package deliberately does not use `ansi-regex`'s pattern: its
 * OSC payload class excludes `|`, so an OSC 8 hyperlink whose URL contains a
 * pipe is only partially matched. Feeding an already-plain string past that
 * makes `string-width`'s internal strip a no-op and keeps one definition of
 * "what is an escape" across measuring and escaping.
 *
 * This was briefly inlined over `get-east-asian-width` — `string-width@7`
 * measured this package's own log symbols (`✔ ⚠ ℹ ✖`) as two columns, which
 * mis-aligned any table containing one. `string-width@8` switched from
 * `emoji-regex` to `\p{RGI_Emoji}` and reports them as one, so the reason is
 * gone and Unicode width is upstream's problem again — which is where it
 * belongs. Do not re-inline it without re-checking that.
 *
 * @param {string} value
 * @returns {number}
 */
export function stringWidth (value) {
  return baseStringWidth(stripAnsi(value));
}
