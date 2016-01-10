import assert from 'should';
import ElegantApi from '../src/ElegantApi';
import $ from 'jquery';
import OPTIONS from './server/options';
import { extend } from '../src/libs/util';


const SERVER = 'http://' + OPTIONS._server;
const PROXY = 'http://' + OPTIONS._proxy;

describe('EA Proxy And Server', () => {
  let EA, REAL_EA, SERVER_EA, PROXY_EA, SERVER_PROXY_EA;

  beforeEach(() => {
    window.jQuery = $
    REAL_EA = new ElegantApi(extend(true, {}, OPTIONS, {
      mock: false
    }));
    SERVER_EA = new ElegantApi(extend(true, {}, OPTIONS, {
      mock: {server: SERVER}
    }));
    PROXY_EA = new ElegantApi(extend(true, {}, OPTIONS, {
      mock: {proxy: PROXY}
    }));
    SERVER_PROXY_EA = new ElegantApi(extend(true, {}, OPTIONS, {
      mock: {server: SERVER, proxy: PROXY}
    }));
  });

  afterEach(() => delete window.jQuery);

  context('karma server', () => {
    it('should throws when no jQuery', () => {
      delete window.jQuery;
      EA = new ElegantApi({
        mock: false,
        base: '/api',
        routes: {
          foo: { path: '/foo'}
        }
      });
      EA.request('foo').catch(err => {
        err.message.should.match(/Need implement handler function in options/);
        done();
      });
    });

    it('should get remote response data', done => {
      REAL_EA.request('userA', {uid: 10}).then(data => {
        data.url.should.eql('/api/server/?uid=10'); // response from karma-middleware
        data.method.should.eql('GET');
        done();
      }).catch(done);
    });

    it('should get remote response error', done => {
      EA = new ElegantApi({
        mock: false,
        base: '/api',
        routes: {
          foo: {path: '/error'}
        }
      });
      EA.request('foo').catch(err => {
        err.status.should.eql(500);
        done();
      });
    });
  });

  context('standalone server', () => {
    it('should get response data from fe-server', done => {
      SERVER_EA.request('userA', {uid: 3}).then(data => {
        data.uid.should.eql(3);
        done();
      }).catch(done);
    });

    it('should get response error from fe-server', done => {
      SERVER_EA.request('userE', {uid: 3}).catch(err => {
        err.status.should.eql(500);
        done();
      });
    });
  });

  context('proxy', () => {
    it('should get response data from rd-server', done => {
      SERVER_PROXY_EA.request('userA', {uid: 3}).then(data => {
        data.query.uid.should.eql('3');
        data.from.should.eql('rd-server');
        done();
      }).catch(done);
    });
  });

  context('dataTransformMethod', () => {
    it('should use query', done => {
      EA = new ElegantApi(extend(true, {}, OPTIONS, {
        mock: {server: SERVER},
        handle(target, cb) {
          target.http.url.should.match(/__eaData=/);
          done();
        }
      }));
      EA.request('userA', {uid: 20});
    });
    it('can be config to use cookie', done => {
      EA = new ElegantApi(extend(true, {}, OPTIONS, {
        mock: {server: false},
        dataTransformMethod: 'cookie',
        handle(target, cb) {
          document.cookie.should.match(/__eauserA/);
          done();
        }
      }));
      EA.request('userA', {uid: 20});
    });
    it('should not use cookie when crossSite', () => {
      EA = new ElegantApi(extend(true, {}, OPTIONS, {
        mock: {server: SERVER},
        dataTransformMethod: 'cookie',
        handle(target, cb) {
          target.http.url.should.match(/__eaData=/);
          document.cookie.should.not.match(/__eauserB/);
          done();
        }
      }));
      EA.request('userB', {uid: 20});
    });
    it('should not use cookie or query when online', () => {
      EA = new ElegantApi(extend(true, {}, OPTIONS, {
        mock: false,
        dataTransformMethod: 'cookie',
        handle(target, cb) {
          target.http.url.should.not.match(/__eaData=/);
          document.cookie.should.not.match(/__eauserC/);
          done();
        }
      }));
      EA.request('userC', {uid: 20});
    });
  });
});
