import assert from 'should';
import ElegantApi from '../src/ElegantApi';
import util from '../src/util';
import OPTIONS from './server/options';
import $ from 'jquery';

describe('ElegantApi on Server', () => {
  let EA;

  afterEach(() => {
    delete window.jQuery;
  });

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

  it('should mock jquery get method', done => {
    window.jQuery = $;
    EA = new ElegantApi(OPTIONS);

    EA.request('userA', {uid: 3}, (err, data) => {
      assert.ok(!err, 'no error happened');
      data.uid.should.eql(3);
      data.category.should.eql('A');
      done();
    });
  });

  it('should mock jquery post method', done => {
    window.jQuery = $;
    EA = new ElegantApi(OPTIONS);

    EA.request('userB', {uid: 3}, (err, data) => {
      assert.ok(!err);
      data.uid.should.eql(3);
      data.category.should.eql('B');
      done();
    });
  });

  it('should mock jquery error status', done => {
    window.jQuery = $;
    EA = new ElegantApi(OPTIONS);

    EA.request('userE', {uid: 3}, (err, data) => {
      assert.ok(err);
      err.status.should.eql(500);
      err.responseText.should.match(/"message":"3"/);
      done();
    });
  });

  it('should proxy jquery get method', done => {
    window.jQuery = $;
    EA = new ElegantApi(util.extend(true, {}, OPTIONS, {mock: {proxy: OPTIONS._proxy}}));

    let uid = Math.round(Math.random() * 1000 + 1);
    EA.request('userA', {uid}, (err, data) => {
      assert.ok(data, 'proxy should return data');
      data.uid.should.eql(uid + '');
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

});
