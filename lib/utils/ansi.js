/**
 * CSI (colour, cursor) and OSC (hyperlink, title) sequences.
 *
 * Deliberately not the `ansi-regex` pattern: that one restricts OSC payloads to
 * a URL-ish character class that excludes `|`, so an OSC 8 hyperlink whose URL
 * contains a pipe is only partially matched. This uses the general grammar —
 * OSC runs to its BEL or ST terminator whatever it contains.
 */
const ANSI_PATTERN = '\\u001B\\][\\s\\S]*?(?:\\u0007|\\u001B\\\\)|[\\u001B\\u009B]\\[[\\u0030-\\u003F]*[\\u0020-\\u002F]*[\\u0040-\\u007E]';

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
