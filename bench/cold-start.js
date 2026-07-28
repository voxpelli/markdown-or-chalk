/**
 * Measures what selecting one style actually costs at process start, and how
 * much of that each heavy dependency accounts for.
 *
 * Every measurement runs in its own child process — module loading is cached,
 * so a single process can only ever measure the first import honestly. Each is
 * repeated and the minimum kept, since noise only ever adds time.
 *
 * Dependency costs are reported **marginal in the graph that actually loads
 * them** — the delta on top of an already-imported `ansi` style — not in
 * isolation. Measured alone, boxen looks like ~38ms; but it shares
 * string-width, chalk and wrap-ansi with `ansi`, so the cost of *adding* it is
 * far smaller. Isolated figures systematically over-charge shared subtrees and
 * mis-rank which dependency is worth removing.
 *
 * Usage: node bench/cold-start.js
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const STYLES = ['markdown', 'text', 'html', 'ansi', 'ansi-rich'];
const DEPENDENCIES = ['emphasize', 'boxen', 'terminal-link', 'get-east-asian-width'];
const RUNS = 5;

const [mode, target] = process.argv.slice(2);
const self = fileURLToPath(import.meta.url);

/**
 * @param {string} childMode
 * @param {string} childTarget
 * @returns {number}
 */
function measure (childMode, childTarget) {
  let best = Number.POSITIVE_INFINITY;

  for (let run = 0; run < RUNS; run++) {
    // eslint-disable-next-line n/no-sync -- a benchmark runs its children in sequence on purpose
    const elapsed = Number(execFileSync(process.execPath, [self, childMode, childTarget], { encoding: 'utf8' }));

    if (elapsed < best) best = elapsed;
  }

  return best;
}

/**
 * @param {number} value
 * @returns {string}
 */
const ms = value => value.toFixed(1).padStart(9);

if (mode === 'style') {
  const started = performance.now();
  const { getOutputStyler } = await import('../index.js');
  const styler = getOutputStyler(/** @type {any} */ (target));

  // Touch fromMdast so lazily-built serializer options are included
  styler.fromMdast({ type: 'paragraph', children: [{ type: 'text', value: 'x' }] });

  process.stdout.write(String(performance.now() - started));
} else if (mode === 'dependency') {
  // Load a baseline style first, so what we time is the *marginal* cost of the
  // dependency on top of a graph that already exists, not its isolated cost
  const [baseline, dependency] = target.split('|');

  await import(`../lib/styles/${baseline}.js`);

  const started = performance.now();

  await import(/** @type {string} */ (dependency));

  process.stdout.write(String(performance.now() - started));
} else {
  process.stdout.write('Cold start per style (first import in a fresh process)\n\n');
  process.stdout.write('style      load (ms)\n');
  process.stdout.write('---------  ---------\n');

  for (const style of STYLES) {
    process.stdout.write(`${style.padEnd(9)}  ${ms(measure('style', style))}\n`);
  }

  process.stdout.write('\nDependency cost, marginal on top of an already-loaded style\n');
  process.stdout.write('(0.0 means that style already loads it)\n\n');
  process.stdout.write('dependency      +markdown  +ansi\n');
  process.stdout.write('--------------  ---------  ---------\n');

  for (const dependency of DEPENDENCIES) {
    process.stdout.write(
      `${dependency.padEnd(14)}  ${ms(measure('dependency', `markdown|${dependency}`))}  ${ms(measure('dependency', `ansi|${dependency}`))}\n`
    );
  }
}
