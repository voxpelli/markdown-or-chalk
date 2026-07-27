import chalk from 'chalk';

import ansiOutput from './ansi.js';

/** @import { ChalkStyledOutput } from '../style-interface-types.js' */

export default /** @satisfies {ChalkStyledOutput} */ (/** @type {const} */({
  ...ansiOutput,

  type: 'chalk',
  get chalk () {
    return chalk;
  },
}));
