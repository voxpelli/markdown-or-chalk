const DANGEROUS_PROTOCOLS = new Set([
  'data:',
  'javascript:',
  'vbscript:',
]);

/**
 * @param {string | undefined} url
 * @returns {string | undefined}
 */
export function filterHyperlinkUrl (url) {
  if (!url) return;

  // Strip control characters to prevent ANSI injection via OSC 8. Must happen
  // before the protocol check: WHATWG URL parsers strip tab / newline, so
  // eg. "java\tscript:" is a live javascript: URL in every compliant consumer
  // eslint-disable-next-line no-control-regex
  const strippedUrl = url.replaceAll(/[\u0000-\u001F\u007F]/g, '');

  try {
    if (DANGEROUS_PROTOCOLS.has(new URL(strippedUrl).protocol)) return;
  } catch {
    // Not an absolute URL — relative URLs carry no protocol to block
  }

  return strippedUrl;
}
