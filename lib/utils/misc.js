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
  return indent + text.split('\n').join('\n' + indent);
}

/**
 * @param {string} text
 * @returns {number}
 */
export function longestBacktickRun (text) {
  let maxRun = 0;

  for (const [run] of text.matchAll(/`+/g)) {
    if (run.length > maxRun) maxRun = run.length;
  }

  return maxRun;
}

/**
 * @template {Record<string,any>} Obj
 * @template Value
 * @param {Obj} obj
 * @param {(value: Obj[keyof Obj], key: keyof Obj) => Value} callback
 * @returns {Record<keyof Obj, Value>}
 */
export function mapObject (obj, callback) {
  return /** @type {Record<keyof Obj, Value>} */ (Object.fromEntries(
    /** @type {[keyof Obj, Obj[keyof Obj]][]} */ (Object.entries(obj))
      .map(([key, value]) => [key, callback(value, key)])
  ));
}
