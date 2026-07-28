/** @import { AnyStyledOutput, StyledOutputTypes } from './style-interface-types.js' with { 'resolution-mode': 'import' } */

/** @type {{ [K in AnyStyledOutput as K['type']]: K }} */
const outputStyles = {
  get ansi () {
    return require('./styles/ansi.js').default;
  },

  get 'ansi-rich' () {
    return require('./styles/ansi-rich.js').default;
  },

  get chalk () {
    return require('./styles/chalk.js').default;
  },

  get html () {
    return require('./styles/html.js').default;
  },

  get markdown () {
    return require('./styles/markdown.js').default;
  },

  get text () {
    return require('./styles/text.js').default;
  },
};

/**
 * @template {StyledOutputTypes} T
 * @param {T} style
 * @returns {(typeof outputStyles)[T]}
 */
function getOutputStyler (style) {
  // hasOwn, not a truthiness check: a plain lookup also finds inherited members,
  // so 'toString' / 'constructor' / '__proto__' would satisfy the guard and hand
  // back an Object.prototype member instead of throwing
  const styler = Object.hasOwn(outputStyles, style) ? outputStyles[style] : undefined;

  if (!styler) {
    throw new TypeError(`Expected style to be one of ${Object.keys(outputStyles).map(key => `'${key}'`).join(', ')}, got: ${typeof style === 'string' ? `'${style}'` : typeof style}`);
  }

  return styler;
}

/**
 * @template {StyledOutputTypes} T
 * @param {T} style
 * @returns {(typeof outputStyles)[T]['fromMdast']}
 */
function getMdastOutputter (style) {
  return getOutputStyler(style).fromMdast;
}

module.exports = {
  getOutputStyler,
  getMdastOutputter,
};
