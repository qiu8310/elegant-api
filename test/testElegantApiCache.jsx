/* eslint camelcase: 0 */

import assert from 'should';
import ElegantApi from '../src/ElegantApi';

describe('ElegantApi Cache', () => {
  let EA, OPTIONS, MOCKS;

  beforeEach(() => {
    OPTIONS = {

      base: '/api/cache_test/',
      mockDelay: 0,
      global: {
        cacheSize: 2
      },

      routes: {
        userA: {
          query: 'uid=',
          method: 'GET' // cache will be true
        },
        userB: {
          query: 'uid=',
          method: 'POST' // cache will be false
        },
        userC: {
          query: 'uid=',
          method: 'POST',
          cache: true // force cache
        }
      }
    };

    MOCKS = {
      userA(http, cb) {
        cb(null, {category: 'A', uid: parseInt(http.query.uid), timestamp: Date.now()});
      },
      userB(http, cb) {
        cb(null, {category: 'B', uid: parseInt(http.query.uid), timestamp: Date.now()});
      },
      userC(http, cb) {
        cb(null, {category: 'C', uid: parseInt(http.query.uid), timestamp: Date.now()});
      }
    };

    EA = new ElegantApi(OPTIONS, MOCKS);
  });

  it('should cache last request with same query and http method and http data', done => {
    EA.global.cacheSize.should.eql(OPTIONS.global.cacheSize);

    EA.request('userA', {uid: 2}, (err, userA2) => {
      assert.ok(!err);
      userA2.uid.should.eql(2);

      EA.request('userA', {uid: 2}, (err, userA2Clone) => {
        assert.deepEqual(userA2, userA2Clone);
        EA.global.cacheStack.length.should.eql(1);
        done();
      });
    });
  });

  it('should not cache when query is different', done => {
    EA.request('userA', {uid: 2}, (err, userA2) => {
      assert.ok(!err);

      EA.request('userA', {uid: 3}, (err, userA2Clone) => {
        assert.notDeepEqual(userA2, userA2Clone);
        EA.global.cacheStack.length.should.eql(2);
        done();
      });
    });
  });

  it('should not cache when data is different', done => {
    EA.request('userA', {uid: 2}, (err, userA2) => {
      assert.ok(!err);

      EA.request('userA', {uid: 2, foo: 'foo'}, (err, userA2Clone) => {
        assert.notDeepEqual(userA2, userA2Clone);
        EA.global.cacheStack.length.should.eql(2);
        done();
      });
    });
  });

  it('should not cache when method is different', done => {
    EA.request('userA', {uid: 2}, (err, userA2) => {
      assert.ok(!err);

      EA.request('userC', {uid: 2}, (err, userA2Clone) => {
        assert.notDeepEqual(userA2, userA2Clone);
        EA.global.cacheStack.length.should.eql(2);
        done();
      });
    });
  });

  it('should not cache when cacheSize is full', done => {
    EA.request('userA', {uid: 1}, (err, userA1) => {
      EA.request('userA', {uid: 2}, (err, userA2) => {
        EA.request('userA', {uid: 3}, (err, userA3) => {
          EA.request('userA', {uid: 1}, (err, userA1Clone) => {
            assert.notDeepEqual(userA1, userA1Clone);
            done();
          });
        });
      });
    });
  });



});
