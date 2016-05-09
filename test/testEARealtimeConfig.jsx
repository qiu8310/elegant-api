import assert from 'should';
import ElegantApi from '../src/ElegantApi';

let EA, MOCK = {delay: 0, memory: true};

describe('EA Realtime Config', () => {

  it('should support mock config', (done) => {
    let i = 0;
    let EA = new ElegantApi({
      mock: MOCK,
      cache: false,
      routes: {
        foo: {
          mock: { memory: false, debug: false }
        }
      },
      handle(target, cb) {
        let {memory, debug} = this.mock;
        if (i === 0) {
          memory.should.eql(false);
          debug.should.eql(false);
          i++;
          cb(null, null);
        } else {
          memory.should.eql(true);
          debug.should.eql(true);
          done();
        }
      }
    });

    EA.request('foo').then(() => EA.request('foo', {}, {mock: {memory: true, debug: true}})).catch(done);
  });

  it('should support debug config', done => {
    let EA = new ElegantApi({
      mock: MOCK,
      routes: {
        foo: {
          mock: { memory: false }
        }
      },
      handle(target, cb) {
        let {debug} = this.mock;
        debug.should.eql(false);
        done();
      }
    });

    EA.request('foo', null, {debug: false}).catch(done);
  });

  it('should support cache config', done => {
    let EA = new ElegantApi({
      mock: MOCK,
      routes: {
        foo: {
          cache: true
        }
      },
      handle(target, cb) {
        this.cache.enable.should.eql(false);
        done();
      }
    });

    EA.request('foo', null, {cache: false}).catch(done);
  });

  it('should support http config', done => {
    let EA = new ElegantApi({
      mock: MOCK,
      routes: {
        foo: {
          base: '/ab',
          headers: {a: 'a'}
        }
      },
      handle(target, cb) {
        let http = this.http;
        http.method.should.eql('POST');
        http.path.should.eql('/ab/xx');
        assert.deepEqual(http.headers, {a: 'a', b: 'b'});
        assert.deepEqual(http.data, {x: 'xx'});
        done();
      }
    });

    EA.request('foo', {x: 'xx'}, {http: {method: 'post', path: '/xx', headers: {b: 'b'}}}).catch(done);
  });

});

describe('EA Realtime Config in Batch Request', () => {

  describe('parallel', () => {
    it('should work', done => {
      let i = 0;
      let EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: true,
          bar: true
        },
        handle(target, cb) {
          i++;
          if (this.name === 'foo') {
            this.mock.debug.should.eql(false);
            this.mock.memory.should.eql(false);
          } else if (this.name === 'bar') {
            this.mock.debug.should.eql(true);
            this.mock.memory.should.eql(true);
          }
          cb(null, null);
        }
      });

      EA.request(
        {foo: true, bar: true},
        {},
        {
          foo: {debug: false, mock: {memory: false}},
          bar: {mock: {debug: true, memory: true}}
        }
      ).then(() => { i.should.eql(2); done(); }).catch(done);
    });
  });


  describe('series', () => {
    it('should work', done => {
      let i = 0;
      let EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: true,
          bar: true
        },
        handle(target, cb) {
          i++;
          if (this.name === 'foo') {
            this.mock.debug.should.eql(false);
            this.mock.memory.should.eql(false);
          } else if (this.name === 'bar') {
            this.mock.debug.should.eql(true);
            this.mock.memory.should.eql(true);
          }
          cb(null, null);
        }
      });

      EA.request(
        ['foo', 'bar'],
        {},
        {
          foo: {debug: false, mock: {memory: false}},
          bar: {mock: {debug: true, memory: true}}
        }
      ).then(() => { i.should.eql(2); done(); }).catch(done);
    });
  });
});
