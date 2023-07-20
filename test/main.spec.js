import chai from 'chai';

import { MarkdownOrChalk } from '../index.js';

const should = chai.should();

describe('something', () => {
  it('should work', async () => {
    const foo = new MarkdownOrChalk(false);
    should.exist(foo);
  });
});
