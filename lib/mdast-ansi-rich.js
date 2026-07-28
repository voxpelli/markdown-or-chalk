import boxen from 'boxen';
import { highlight, supportsLanguage } from 'cli-highlight';

import { ansiRenderers } from './mdast-ansi.js';
import { buildStyleOptions, createOptionsCache } from './mdast-handlers.js';

/**
 * @param {string} value
 * @param {string | undefined} lang
 * @returns {string}
 */
function highlightCodeBlock (value, lang) {
  let highlighted = value;

  try {
    if (!lang) {
      highlighted = highlight(value);
    } else if (supportsLanguage(lang)) {
      highlighted = highlight(value, { language: lang, ignoreIllegals: true });
    }
    // Unknown languages keep the unhighlighted content — cli-highlight throws
    // on them, and auto-detection would guess wrong anyway
  } catch {
    highlighted = value;
  }

  return '\n' + boxen(highlighted, {
    padding: 1,
    ...lang && { title: lang },
  });
}

/** Resolved per styler so overrides are honored */
export const mdastToMarkdownAnsiRichOptions = createOptionsCache(
  format => buildStyleOptions(format, {
    ...ansiRenderers(format),
    codeBlock: highlightCodeBlock,
    inlineCode: value => {
      try {
        return highlight(value);
      } catch {
        return value;
      }
    },
  })
);
