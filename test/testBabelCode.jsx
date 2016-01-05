/**
 * babel 会生成一些代码，此 test 主要用来覆盖 babel 生成的这部分代码
 */

import assert from 'should';
import ElegantApi from '../src/ElegantApi';
import OPTIONS from './server/options';

describe('Babel Code', () => {
  it('should not call class as a function', () => {
    assert.throws(() => ElegantApi(OPTIONS));
  });
});
