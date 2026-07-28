import boxen from 'boxen';
import { common, createEmphasize } from 'emphasize';

import { ansiRenderers } from './mdast-ansi.js';
import { buildStyleOptions, createOptionsCache } from './mdast-handlers.js';

/**
 * `common` is highlight.js' 37-language set rather than all ~190 — the long
 * tail costs load time for languages a terminal rarely sees, and an
 * unrecognised language already degrades to plain content below.
 */
const emphasize = createEmphasize(common);

/**
 * @param {string} value
 * @param {string | undefined} lang
 * @returns {string}
 */
function highlightCodeBlock (value, lang) {
  let highlighted = value;

  try {
    if (lang && emphasize.registered(lang)) {
      highlighted = emphasize.highlight(lang, value).value;
    } else if (!lang) {
      highlighted = emphasize.highlightAuto(value).value;
    }
    // A language we do not have a grammar for keeps its plain content — better
    // than guessing, and better than throwing mid-render
  } catch {
    highlighted = value;
  }

  return boxen(highlighted, {
    padding: 1,
    ...lang && { title: lang },
  });
}

/** Resolved per styler so overrides are honored */
export const mdastToMarkdownAnsiRichOptions = createOptionsCache(
  format => buildStyleOptions(format, {
    ...ansiRenderers(format),
    codeBlock: highlightCodeBlock,
    // inlineCode deliberately keeps the lean rendering: auto-detecting a
    // language from a few characters of identifier is guaranteed-wrong guessing
  })
);
