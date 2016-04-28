import assert from 'should';
import ElegantApi from '../src/ElegantApi';


let EA, MOCK = {delay: 0, memory: true};
describe('Mock Helper', () => {

  it('should $fetch', done => {

    EA = new ElegantApi({
      http: {
        method: 'POST'
      },
      mock: MOCK,
      mocks: {
        bar(target, cb) {
          // console.log('bar', target.data);
          cb(null, ++target.data.count);
        },
        foo(target, cb) {
          // console.log('foo', target.data);
          assert.equal(target.data.count, 0);

          this.$fetch(target, 'bar')
            .then(count => {
              assert.equal(count, 1);
              cb(null, ++count);
            })
            .catch(cb);
        },
        tar(target, cb) {
          // body 和 data 是等同的
          this.$fetchAll(target, {foo: {data: {count: 0}}, bar: {body: {count: 0}}})
            .then(data => {
              // console.log('tar', data);
              assert.equal(data.bar, 1);
              assert.equal(data.foo, 2);
              cb();
            })
            .catch(cb);
        }
      }
    });

    EA.request('foo', {count: 0})
      .then(count => {
        assert.equal(count, 2);
        return EA.request('tar').then(() => done());
      })
      .catch(done);
  });

  it('should $objectify', done => {
    EA = new ElegantApi({
      mock: MOCK,
      mocks: {
        bar(target, cb) {
          cb(null, {bar: 'bar'});
        },
        foo(target, cb) {
          this.$objectify(target, 'bar')
            .then(bar => {
              assert.deepEqual(bar, {bar: 'bar'});
              cb(null, {
                foo: 'foo',
                bar: bar.bar
              });
            })
            .catch(cb);
        },
        tar(target, cb) {
          this.$objectifyAll(target, ['bar', 'foo'])
            .then(list => {
              let [bar, foo] = list;
              assert.deepEqual(bar, {bar: 'bar'});
              assert.deepEqual(foo, {bar: 'bar', foo: 'foo'});

              cb(null, null);
            })
            .catch(cb);
        },
        err(target, cb) {
          cb('err');
        },
        objErr(target, cb) {
          this.$objectify(target, 'err')
            .then(() => {
              cb(new Error('unexpected'));
            })
            .catch(e => {
              e.should.eql('err');
              cb();
            });
        }
      }
    });

    EA.request('foo')
      .then(data => {
        assert.deepEqual(data, {foo: 'foo', bar: 'bar'});
        return EA.request('tar');
      })
      .then(data => {
        return EA.request('objErr');
      })
      .then(data => {
        done();
      })
      .catch(done);
  });


});
