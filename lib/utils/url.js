/**
 * @param {string | undefined} url
 * @returns {string | undefined}
 */
export function filterHyperlinkUrl (url) {
  if (!url) return;

  // Block javascript: URIs (case-insensitive, ignore leading whitespace/control chars)
  if (/^\s*javascript:/i.test(url)) return;

  // Strip control characters to prevent ANSI injection via OSC 8
  // eslint-disable-next-line no-control-regex
  return url.replaceAll(/[\u0000-\u001F\u007F]/g, '');
}
