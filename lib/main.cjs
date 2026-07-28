/** @import { AnyStyledOutput, StyledOutputTypes } from './style-interface-types.js' with { 'resolution-mode': 'import' } */

/** @type {{ [K in AnyStyledOutput as K['type']]: K }} */
const outputStyles = {
  get ansi () {
    return require('./styles/ansi.js').default;
  },

  get chalk () {
    return require('./styles/chalk.js').default;
  },

  get markdown () {
    return require('./styles/markdown.js').default;
  },
};

/**
 * @template {StyledOutputTypes} T
 * @param {T} style
 * @returns {(typeof outputStyles)[T]}
 */
function getOutputStyler (style) {
  const styler = outputStyles[style];

  if (!styler) {
    throw new TypeError(`Expected style to be 'markdown', 'ansi' or 'chalk', got: ${typeof style === 'string' ? `'${style}'` : typeof style}`);
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
