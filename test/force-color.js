/**
 * The styleText equivalent of the old `chalk.level = 0` switch.
 *
 * `styleText` has no global level; its `shouldColorize` re-reads FORCE_COLOR on
 * every call, so setting the variable at runtime works after modules are loaded
 * and — unlike `chalk.level` — also reaches nested dependencies that do their
 * own colour detection.
 *
 * @param {string} level
 * @returns {() => void} restores the previous value
 */
/* eslint-disable n/no-process-env -- reading the switch is the point of this helper */
export function forceColor (level) {
  const original = process.env['FORCE_COLOR'];

  process.env['FORCE_COLOR'] = level;

  return () => {
    if (original === undefined) {
      delete process.env['FORCE_COLOR'];
    } else {
      process.env['FORCE_COLOR'] = original;
    }
  };
}
