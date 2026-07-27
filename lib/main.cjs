/** @import { AnyStyledOutput, StyledOutputTypes } from './style-interface-types.js' */

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
  return outputStyles[style];
}

/**
 * @template {StyledOutputTypes} T
 * @param {T} style
 * @returns {(typeof outputStyles)[T]['fromMdast']}
 */
function getMdastOutputter (style) {
  return outputStyles[style].fromMdast;
}

module.exports = {
  getOutputStyler,
  getMdastOutputter,
};
