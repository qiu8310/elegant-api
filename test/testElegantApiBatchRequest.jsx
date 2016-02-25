import assert from 'should';
import ElegantApi from '../src/ElegantApi';
import { extend } from '../src/libs/util';

import OPTIONS from './server/options';

const options = extend(true, {}, OPTIONS, { mock: {memory: true} });

describe('ElegantApi Batch Request', () => {

  let EA;

  context('parallel', () => {
    it('should send parallel requests', done => {
      EA = new ElegantApi(options);

      EA.request({userA: {uid: 1}, userB: {uid: 2}, userC: {uid: 3}}, (err, data) => {
        assert.ok(!err);

        data.userA.uid.should.eql(1);
        data.userB.uid.should.eql(2);
        data.userC.uid.should.eql(3);

        done();
      });
    });

    it('should handle error on parallel request', done => {
      EA.request({userA: {uid: 1}, userE: {uid: 2}}, (err, data) => {
        assert.ok(err);
        assert.ok(data.userA);
        assert.ok(err.userE);
        done();
      });
    });

    it('should support alias', done => {
      EA.request({A1: {uid: 1}, A2: {uid: 2}}, {alias: {A1: 'userA', A2: 'userA'}}, (err, data) => {
        assert.ok(data.A1);
        assert.ok(data.A2);
        done();
      });
    });
  });

  context('series', () => {
    it('should send series requests', done => {
      let count = 0;
      EA = new ElegantApi(options);
      EA.request(
        ['userA', 'userB', 'userC'],
        {iterator: (key, i, err, data) => {
          assert.ok(!err);
          if (i > 0) data.uid.should.eql(i - 1);
          else assert.ok(!data);

          count++;
          return {uid: i};
        }},
        (err, data) => {
          assert.ok(!err);
          count.should.eql(3);
          data.uid.should.eql(2);
          done();
        }
      );
    });

    it('should stop series requests', done => {
      EA = new ElegantApi(options);
      let count = 0;
      EA.request(
        ['userA', 'userB', 'userC'],
        {iterator: (key, i, err, data) => {
          assert.ok(!err);
          count++;

          // 不会执行 request('userB');
          return key === 'userB' ? false : {uid: i};
        }},
        (err, data) => {
          count.should.eql(2);
          data.uid.should.eql(0);
          done();
        }
      );
    });
  });

});
