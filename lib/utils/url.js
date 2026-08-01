/**
 * Protocols safe to put in front of a reader.
 *
 * An allowlist rather than a denylist, matching `hast-util-sanitize` (the
 * unified ecosystem's own sanitizer), `sanitize-html`, GitHub's markup pipeline
 * and CommonMark's safe mode. A denylist is the wrong shape here, and
 * especially so for the ANSI style: an OSC 8 hyperlink is handed to the OS
 * scheme handler (`open` / `xdg-open` / `ShellExecute`), so any scheme an
 * installed application registered becomes reachable. That is not theoretical —
 * iTerm2 CVE-2023-46321 reached code execution through `x-man-page://` and
 * CVE-2023-46322 arbitrary file writes through `ssh://`. Neither is a scheme
 * anyone would think to deny, which is the point.
 */
const SAFE_PROTOCOLS = new Set([
  'http:',
  'https:',
  'irc:',
  'ircs:',
  'mailto:',
  'xmpp:',
]);

/**
 * Image types that cannot carry script.
 *
 * `svg+xml` is excluded: it needs no crafting to be dangerous, has full DOM and
 * script capability, and executes in more contexts than any raster format.
 * Mozilla's own block on top-level `data:` navigation carves out `data:image`
 * with exactly one exception, and that exception is `svg+xml`.
 *
 * Content sniffing cannot subvert this: the MIME Sniffing Standard's image
 * table has no SVG entry, so an SVG payload declared as `image/png` reaches the
 * PNG decoder and renders as a broken image rather than as markup.
 */
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp|avif|bmp|x-icon)[,;]/i;

/**
 * The scheme as it is literally written, which is what decides where a url
 * goes. Matches the WHATWG scheme grammar — ASCII alpha, then alphanumerics and
 * `+-.` — so a string this does not match cannot carry a scheme for any
 * consumer either, and is a relative reference posing no scheme risk.
 */
const SCHEME_PREFIX = /^[a-z][\d+.a-z-]*:/i;

/** C0, DEL and C1 — see `stripUnsafeControls` */
// eslint-disable-next-line no-control-regex
const UNSAFE_CONTROLS = /[\u0000-\u001F\u007F-\u009F]/g;

/**
 * @param {string} url
 * @returns {string}
 */
function stripUnsafeControls (url) {
  // C0 and DEL would let an OSC 8 payload break out of its sequence, and a tab
  // or newline inside `java\tscript:` would hide the scheme from the check
  // below — WHATWG parsers discard those, so the scheme a consumer resolves is
  // the one left after stripping, not the one written. C1 goes for the same
  // reason plus one of our own: lib/utils/ansi.js treats U+009B as a CSI
  // introducer, so leaving it here would have the two halves of this package
  // disagree about whether it is an escape. Leading and trailing spaces go too,
  // since url parsing discards those as well.
  return url.replaceAll(UNSAFE_CONTROLS, '').trim();
}

/**
 * For urls that will be *navigated to* — an `href`, or an OSC 8 terminal link.
 *
 * The scheme is read off the string rather than out of `new URL().protocol`.
 * WHATWG parsing is far stricter than what actually dispatches a url: it
 * rejects `ssh://host:99999999/x` and `x-man-page://[ls` over an out-of-range
 * port and a forbidden host character, while `open` / `xdg-open` /
 * `ShellExecute` — which is what a terminal hands an OSC 8 link to — take both
 * happily. Reading a parse failure as "relative, therefore safe" would give
 * every blocked scheme a one-character bypass, the two CVEs above included.
 *
 * @param {string | undefined} url
 * @returns {string | undefined}
 */
export function filterHyperlinkUrl (url) {
  if (!url) return;

  const safeUrl = stripUnsafeControls(url);
  const scheme = SCHEME_PREFIX.exec(safeUrl)?.[0].toLowerCase();

  if (scheme !== undefined && !SAFE_PROTOCOLS.has(scheme)) return;

  return safeUrl || undefined;
}

/**
 * For urls that will be *loaded as an image* — an `<img src>`.
 *
 * Same rules, plus `data:` holding a non-scriptable image type: inlining images
 * is a common and legitimate reason to render HTML, and `data:` is only an
 * execution vector when navigated to or embedded as a document.
 *
 * @param {string | undefined} url
 * @returns {string | undefined}
 */
export function filterImageUrl (url) {
  if (!url) return;

  const safeUrl = stripUnsafeControls(url);

  if (SAFE_DATA_IMAGE.test(safeUrl)) return safeUrl;

  return filterHyperlinkUrl(safeUrl);
}
