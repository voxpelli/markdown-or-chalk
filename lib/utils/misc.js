/**
 * @param {number | undefined} level
 * @returns {number}
 */
export function clampHeadingLevel (level) {
  return typeof level === 'number' && Number.isFinite(level)
    ? Math.max(1, Math.min(6, Math.trunc(level)))
    : 1;
}

/**
 * @param {string} text
 * @param {number} [level]
 * @returns {string}
 */
export function indentText (text, level = 1) {
  const indent = ''.padStart(level * 2, ' ');

  // Blank lines stay blank — indenting them only adds trailing whitespace
  return text
    .split('\n')
    .map(line => line === '' ? line : indent + line)
    .join('\n');
}
