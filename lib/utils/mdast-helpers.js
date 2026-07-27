/** @import { BlockContent, Link, PhrasingContent, Text } from 'mdast' */

/** @typedef {string | BlockContent} BlockContentOrString */
/** @typedef {MaybeArray<BlockContentOrString>} BlockContentOrStringList */

/** @typedef {string | PhrasingContent} PhrasingContentOrString */
/** @typedef {MaybeArray<PhrasingContentOrString>} PhrasingContentOrStringList */

/**
 * @template T
 * @typedef {T[]|T} MaybeArray
 */

/**
 * @template T
 * @template Replacement
 * @typedef {T extends string ? Replacement : T} StringReplace
 */

/**
 * @template { PhrasingContent} T
 * @param {T | string} value
 * @returns {T | Text}
 */
function ensurePhrasingContent (value) {
  if (typeof value === 'string') {
    return { type: 'text', value };
  }
  return value;
}

/**
 * @template {PhrasingContent} T
 * @param {MaybeArray<T | string>} list
 * @returns {Array<T | Text>}
 */
export function ensurePhrasingContentList (list) {
  return (Array.isArray(list) ? list : [list])
    // eslint-disable-next-line unicorn/no-array-callback-reference
    .map(ensurePhrasingContent);
}

/**
 * @param {string} value
 * @param {string | undefined} url
 * @param {boolean} [skipLinks]
 * @returns {Link | Text}
 */
export function mdastLinkify (value, url, skipLinks) {
  return url && !skipLinks
    ? {
        type: 'link',
        url,
        children: [{ type: 'text', value }],
      }
    : { type: 'text', value };
}
