/**
 * CSI (colour, cursor) and OSC (hyperlink, title) sequences.
 *
 * Deliberately not the `ansi-regex` pattern: that one restricts OSC payloads to
 * a URL-ish character class that excludes `|`, so an OSC 8 hyperlink whose URL
 * contains a pipe is only partially matched. This uses the general grammar —
 * OSC runs to its BEL or ST terminator whatever it contains.
 *
 * Two deliberate narrowings, both because a caller-supplied string reaches this
 * and a character wrongly counted as part of an escape is a character
 * `escapeInCell` never escapes:
 *
 * - `\` (0x5C) and `|` (0x7C) are cut out of the CSI final-byte class. ECMA-48
 *   admits them and no terminal emits them, so admitting them here bought
 *   nothing and let `ESC[|` swallow the one character that most needs escaping.
 * - A lone introducer matches as a one-character sequence. Without it an
 *   unterminated OSC opener made the payload run to the *next* terminator
 *   anywhere in the string, hiding everything in between; with it, the opener
 *   is consumed and the rest of the string stays visible. It also keeps a stray
 *   ESC out of text the `text` style promises is escape-free.
 *
 * The OSC payload is a *negated* class rather than `[\s\S]*?`, and bounded. A
 * lazy open class made an unterminated opener scan to end of string before
 * failing, so a string of repeated `ESC]` cost O(n²) — measurably: 1k openers
 * took 4ms and 8k took 146ms. Excluding the terminator bytes means the payload
 * stops at the next introducer instead, and the bound caps the backtracking
 * that remains. No terminal emits a multi-kilobyte OSC payload, and this runs
 * on caller-supplied `text`, `html` and `code` values whose size this package
 * does not control.
 *
 * C1 introducers are matched alongside their `ESC`-prefixed forms — `U+009B`
 * for CSI, `U+009D` for OSC, `U+009C` as an ST terminator — so a raw one cannot
 * survive into output documented as escape-free.
 */
const ANSI_PATTERN = '(?:\\u001B\\]|\\u009D)[^\\u0007\\u001B\\u009C]{0,4096}(?:\\u0007|\\u001B\\\\|\\u009C)|(?:\\u001B\\[|\\u009B)[\\u0030-\\u003F]*[\\u0020-\\u002F]*[\\u0040-\\u005B\\u005D-\\u007B\\u007D\\u007E]|[\\u001B\\u009B\\u009D]';

// Compiled once: this runs per table cell and per text node. Safe to share —
// `matchAll` iterates a clone and `replaceAll` resets lastIndex itself.
const ANSI_REGEXP = new RegExp(ANSI_PATTERN, 'g');

/**
 * Splits a string into alternating plain-text and escape-sequence runs, so a
 * caller can transform the visible text without touching the escapes — a pipe
 * inside an OSC 8 hyperlink URL must not be escaped like a visible one.
 *
 * @param {string} value
 * @param {(text: string) => string} callback
 * @returns {string}
 */
export function mapVisibleText (value, callback) {
  let result = '';
  let lastIndex = 0;

  for (const match of value.matchAll(ANSI_REGEXP)) {
    result += callback(value.slice(lastIndex, match.index)) + match[0];
    lastIndex = match.index + match[0].length;
  }

  return result + callback(value.slice(lastIndex));
}

/**
 * @param {string} value
 * @returns {string}
 */
export function stripAnsi (value) {
  return value.replaceAll(ANSI_REGEXP, '');
}
