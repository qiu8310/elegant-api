import assert from 'should';
import ElegantApi from '../src/ElegantApi';
import util from '../src/util';
import OPTIONS from './server/options';
import $ from 'jquery';

let base = OPTIONS.mock.replace(/^\w+:/, '') + '/';

describe('ElegantApi on Server', () => {
  let EA;

  it('should mock error', done => {
    EA = new ElegantApi(OPTIONS);
    assert.throws(() => EA.request('userA', {uid: 3}), /Need implement handler function in options/);
    done();
  });

  it('should mock handler', done => {
    let mockData = {user: 'xxx'}, count = 0;

    let options = util.extend({}, OPTIONS, {mock: false, debug: false, handler(http, callback) {
      count = 1;
      callback(null, mockData);
    }});

    EA = new ElegantApi(options);

    EA.request('userA', {uid: 3}, (err, data) => {
      count.should.eql(1);
      assert.ok(!err);
      assert.deepEqual(data, mockData);
      done();
    });
  });

  xit('should mock jquery get method', done => {
    window.jQuery = $;
    let options = util.extend({}, OPTIONS, {base});

    EA = new ElegantApi(options);

    EA.request('userA', {uid: 3}, (err, data) => {
      assert.ok(!err);
      data.uid.should.eql(3);
      data.category.should.eql('A');
      delete window.jQuery;
      done();
    });
  });

  xit('should mock jquery post method', done => {
    window.jQuery = $;
    let options = util.extend({}, OPTIONS, {base});

    EA = new ElegantApi(options);

    EA.request('userB', {uid: 3}, (err, data) => {
      assert.ok(!err);
      data.uid.should.eql(3);
      data.category.should.eql('B');
      delete window.jQuery;
      done();
    });
  });

  xit('should mock jquery error status', done => {
    window.jQuery = $;
    let options = util.extend({}, OPTIONS, {base});

    EA = new ElegantApi(options);

    EA.request('userS', {uid: 3}, (err, data) => {
      assert.ok(err);
      err.status.should.eql(-1);
      delete window.jQuery;
      done();
    });
  });

  xit('should mock jquery request error', done => {
    window.jQuery = $;
    let options = util.extend({}, OPTIONS, {base});

    EA = new ElegantApi(options);

    EA.request('userA', {uid: 3, error: ''}, (err, data) => {
      assert.ok(err);
      err.status.should.eql(500);
      delete window.jQuery;
      done();
    });
  });

  it('should emulateHTTP when http method in [PUT PATCH DELETE]', done => {
    let mockData = {timestamp: Date.now()};
    let count = 0;
    let options = util.extend({}, OPTIONS, {
      base: 'http://' + OPTIONS.mock + '/',
      emulateHTTP: true,
      handler(http, callback) {
        http.method.should.eql('POST');
        http.headers['X-HTTP-Method-Override'].should.eql('PUT');
        count = 1;
        callback(null, mockData);
      }
    });
    EA = new ElegantApi(options);
    EA.api('put_api', {method: 'PUT'});

    EA.request('put_api', (err, data) => {
      assert.deepEqual(data, mockData);
      count.should.eql(1);
      done();
    });
  });

  it('should emulateJSON', done => {
    let mockData = {timestamp: Date.now()};
    let options = util.extend({}, OPTIONS, {
      base: 'http://' + OPTIONS.mock + '/',
      emulateJSON: true,
      handler(http, callback) {
        http.headers['Content-Type'].should.eql('application/x-www-form-urlencoded');
        http.body.should.eql(http.data);
        http.data.should.eql('a=a&b=b');
        callback(null, mockData);
      }
    });

    EA = new ElegantApi(options);
    EA.api('emulateJSON', {method: 'POST'});
    EA.request('emulateJSON', {a: 'a', b: 'b'}, (err, data) => {
      done();
    });
  });

  it('should not emulateJSON when mock = "local"', done => {
    let mockData = {timestamp: Date.now()};
    let options = util.extend({}, OPTIONS, {
      base: 'http://' + OPTIONS.mock + '/',
      emulateJSON: true,
      mock: 'local',
      handler(http, callback) {
        http.headers['Content-Type'].should.not.eql('application/x-www-form-urlencoded');
        assert.deepEqual(http.data, {a: 'a', b: 'b'});
        callback(null, mockData);
      }
    });

    EA = new ElegantApi(options);
    EA.api('notEmulateJSON', {method: 'POST'}, mockData);
    EA.request('notEmulateJSON', {a: 'a', b: 'b'}, (err, data) => {
      done();
    });
  });
});
