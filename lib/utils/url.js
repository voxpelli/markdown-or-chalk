const DANGEROUS_PROTOCOLS = new Set([
  'data:',
  'javascript:',
  'vbscript:',
]);

/**
 * Image types that cannot execute script when loaded as an image.
 *
 * `svg+xml` is excluded even though browsers refuse to run script in an SVG
 * loaded via `<img>`: it is the one image type with any scripting surface at
 * all, and it becomes executable the moment the same URL is used in an
 * `<object>`, `<embed>` or `<iframe>`. Nothing here is worth that.
 */
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp|avif|bmp|x-icon)[,;]/i;

/**
 * @param {string} url
 * @returns {string}
 */
function stripControlCharacters (url) {
  // Must happen before any protocol check: WHATWG URL parsers strip tab and
  // newline themselves, so eg. "java\tscript:" is a live javascript: URL in
  // every compliant consumer, and a check on the unstripped string misses it
  // eslint-disable-next-line no-control-regex
  return url.replaceAll(/[\u0000-\u001F\u007F]/g, '');
}

/**
 * @param {string} url
 * @returns {string | undefined}
 */
function protocolOf (url) {
  try {
    return new URL(url).protocol;
  } catch {
    // Not an absolute URL — relative URLs carry no protocol to block
  }
}

/**
 * For URLs that will be *navigated to* — an `href` or an OSC 8 terminal link.
 *
 * @param {string | undefined} url
 * @returns {string | undefined}
 */
export function filterHyperlinkUrl (url) {
  if (!url) return;

  const strippedUrl = stripControlCharacters(url);
  const protocol = protocolOf(strippedUrl);

  if (protocol !== undefined && DANGEROUS_PROTOCOLS.has(protocol)) return;

  return strippedUrl;
}

/**
 * For URLs that will be *loaded as an image* — an `<img src>`.
 *
 * Same rules as a hyperlink, except that a `data:` URL holding a non-scriptable
 * image type is allowed: inlined images are a common and legitimate reason to
 * render to HTML, and `data:` is only an execution vector when it is navigated
 * to or embedded as a document.
 *
 * @param {string | undefined} url
 * @returns {string | undefined}
 */
export function filterImageUrl (url) {
  if (!url) return;

  const strippedUrl = stripControlCharacters(url);

  if (SAFE_DATA_IMAGE.test(strippedUrl)) return strippedUrl;

  return filterHyperlinkUrl(strippedUrl);
}
