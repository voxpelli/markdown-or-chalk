/** @type {Record<string, string>} */
const TEXT_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

/** @type {Record<string, string>} */
const ATTRIBUTE_ENTITIES = {
  ...TEXT_ENTITIES,
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes text for use in element content.
 *
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml (value) {
  return value.replaceAll(/[&<>]/g, character => TEXT_ENTITIES[character] ?? character);
}

/**
 * Escapes text for use inside a double-quoted attribute value.
 *
 * @param {string} value
 * @returns {string}
 */
export function escapeHtmlAttribute (value) {
  return value.replaceAll(/["&'<>]/g, character => ATTRIBUTE_ENTITIES[character] ?? character);
}
