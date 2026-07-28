/** @import { AnyStyledOutput, StyledOutputTypes } from './style-interface-types.js' with { 'resolution-mode': 'import' } */

/** @type {{ [K in AnyStyledOutput as K['type']]: K }} */
const outputStyles = {
  get ansi () {
    return require('./styles/ansi.js').default;
  },

  get 'ansi-rich' () {
    try {
      return require('./styles/ansi-rich.js').default;
    } catch (cause) {
      // boxen and emphasize are optional peers, so this is the one style that
      // can be selected without its dependencies present. Throw rather than
      // quietly falling back to `ansi` — a silent downgrade turns "why is there
      // no box?" into an undebuggable question. Being able to catch this at all
      // is why the registry is CommonJS: a static ESM import could not.
      // Both codes matter: requiring this ESM file surfaces a failed resolution
      // inside it as ERR_MODULE_NOT_FOUND, not the CommonJS MODULE_NOT_FOUND
      const code = /** @type {NodeJS.ErrnoException} */ (cause)?.code;

      if (code !== 'MODULE_NOT_FOUND' && code !== 'ERR_MODULE_NOT_FOUND') throw cause;

      throw new Error(
        "The 'ansi-rich' style needs its optional peer dependencies. Install them with: npm install boxen emphasize",
        { cause }
      );
    }
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
