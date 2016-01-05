import assert from 'should';
import elegantApi from '../src/index';
import OPTIONS from './server/options';

OPTIONS.mock = 'local';
let api = elegantApi(OPTIONS);

describe('index', () => {

  it('should contains routes and $request function', () => {
    assert.ok(api.$request);
    for (let key in OPTIONS.routes) {
      assert.ok(api[key]);
    }
  });

  it('should work', done => {
    api.$request('userA', {uid: 1}, (err, data) => {
      assert.ok(data);
      data.uid.should.eql(1);

      api.userA({uid: 2}, (err, data) => {
        assert.ok(data);
        data.uid.should.eql(2);
        done();
      });
    });
  });
});
