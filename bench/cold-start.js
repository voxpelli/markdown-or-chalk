/**
 * Measures what selecting one style actually costs at process start, and how
 * much of that each heavy dependency accounts for.
 *
 * Every measurement runs in its own child process — module loading is cached,
 * so a single process can only ever measure the first import honestly.
 *
 * Usage: node bench/cold-start.js
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const STYLES = ['markdown', 'text', 'html', 'ansi', 'chalk', 'ansi-rich'];
const DEPENDENCIES = ['cli-highlight', 'boxen', 'chalk', 'terminal-link', 'string-width'];

const [mode, target] = process.argv.slice(2);
const self = fileURLToPath(import.meta.url);

/**
 * @param {string} childMode
 * @param {string} childTarget
 * @returns {number}
 */
function measure (childMode, childTarget) {
  // eslint-disable-next-line n/no-sync -- a benchmark runs its children in sequence on purpose
  return Number(execFileSync(process.execPath, [self, childMode, childTarget], { encoding: 'utf8' }));
}

if (mode === 'style') {
  const started = performance.now();
  const { getOutputStyler } = await import('../index.js');
  const styler = getOutputStyler(/** @type {any} */ (target));

  // Touch fromMdast so lazily-built serializer options are included
  styler.fromMdast({ type: 'paragraph', children: [{ type: 'text', value: 'x' }] });

  process.stdout.write(String(performance.now() - started));
} else if (mode === 'dependency') {
  const started = performance.now();

  await import(target);

  process.stdout.write(String(performance.now() - started));
} else {
  process.stdout.write('Cold start per style (first import in a fresh process)\n\n');
  process.stdout.write('style     load (ms)\n');
  process.stdout.write('--------  ---------\n');

  for (const style of STYLES) {
    process.stdout.write(`${style.padEnd(8)}  ${measure('style', style).toFixed(1).padStart(9)}\n`);
  }

  process.stdout.write('\nIsolated cost of each dependency\n\n');
  process.stdout.write('dependency      load (ms)\n');
  process.stdout.write('--------------  ---------\n');

  for (const dependency of DEPENDENCIES) {
    process.stdout.write(`${dependency.padEnd(14)}  ${measure('dependency', dependency).toFixed(1).padStart(9)}\n`);
  }
}
