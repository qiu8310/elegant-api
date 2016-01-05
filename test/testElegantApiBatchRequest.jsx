import assert from 'should';
import ElegantApi from '../src/ElegantApi';
import OPTIONS from './server/options';

OPTIONS.mock = 'local';

describe('ElegantApi Batch Request', () => {

  let EA;

  context('parallel', () => {
    it('should send parallel requests', done => {
      EA = new ElegantApi(OPTIONS);

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
  });

  context('series', () => {
    it('should send series requests', done => {
      let count = 0;
      EA = new ElegantApi(OPTIONS);
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
      EA = new ElegantApi(OPTIONS);
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
