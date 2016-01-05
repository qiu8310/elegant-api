/* eslint camelcase: 0 */

import assert from 'should';
import ElegantApi from '../src/ElegantApi';

let EA, OPTIONS, USERS = {
  1: {
    id: 1,
    user_name: 'Alex',
    nick_name: 'A',
    age: 20,
    sex: 'man'
  },

  2: {
    id: 2,
    user_name: 'MeiMei',
    nick_name: 'M',
    age: 18,
    sex: 'woman'
  }
};

before(() => {

  OPTIONS = {
    debug: true,
    mock: 'local',
    mockDelay: 20,
    base: '/api',
    path: '',
    cache: 'smart',

    http: {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    },

    request: {
      naming: null,
      order: ['alias', 'computed', 'map', 'naming']
    },

    response: {
      naming: 'camel',
      order: ['alias', 'computed', 'map', 'naming']
    },

    routes: {
      foo: {
        query: {
          id: {
            required: true,
            validate: /^\d+$/
          }
        },
        data: {
          a: {
            required: true
          },
          b: {
            required: false
          },
          cc: {
            alias: 'c',
            validate(val) { return /^c+$/.test(val); }
          }
        }
      }
    },

    mocks: {
      foo(http, cb) {
        cb(new Error('foo error'));
      }
    }
  };

  EA = new ElegantApi(OPTIONS);
});

describe('ElegantApi on Local', () => {

  it('should support request query and data params', done => {
    // request 的参数的两种写法
    assert.doesNotThrow(() => EA.request('foo', {id: 3, a: 'a', c: 'c'}));
    assert.doesNotThrow(() => EA.request('foo', {query: {id: 3}, data: {a: 'a', c: 'c'}}));
    done();
  });

  it('should mock get user', done => {

    let count = 0;

    EA.api('user', {
      path: '/uc/index.php',
      query: 'apiversion=1&uid=:id&optional',
      headers: {
        Custom: 'Get User Info'
      },

      response: {
        alias: {
          user_name: 'username'
        },
        computed: {
          birth() {
            return new Date().getFullYear() - this.age;
          }
        }
      }
    });

    EA.mock('user', (http, callback) => {
      count++;
      http.method.should.eql('GET');

      assert.deepEqual(http.query, {id: 1, apiversion: '1', __ea: 'user'});
      assert.deepEqual(http.data, {ts: 'data field'});
      assert.equal(http.data, http.body);

      http.headers.Custom.should.eql('Get User Info');

      let id = http.query.id;
      if (USERS[id]) callback(null, USERS[id]);
      else callback(new Error('NO_USER'));
    });

    EA.request('user', {id: 1, ts: 'data field'}, (err, data) => {

      assert.equal(err, null);
      assert.deepEqual(data, {id: 1, nickName: 'A', age: 20, sex: 'man', username: 'Alex', birth: 1996});

      count.should.eql(1);
      done();
    });
  });

  it('should mock user list', done => {
    let count = 0;

    EA.api('users', {
      path: '/uc/users',
      query: '',
      response: {
        alias: {
          'list.[].user_name': 'un',
          list: {
            '[]': {
              nick_name: 'nn'
            },
            '[].age': 'ag'
          },
          length: 'size'
        },
        map(obj) {
          obj.maped = true;
          return obj;
        }
      }
    }, (http, callback) => {
      let list = [];
      for (let key in USERS) list.push(USERS[key]);
      count++;
      http.url.should.eql('/api/uc/users?__ea=users');
      callback(null, {
        length: list.length,
        list
      });
    });

    EA.request('users', (err, data) => {
      count.should.eql(1);

      data.maped.should.eql(true);
      data.list.should.have.a.length(2);
      assert.deepEqual(data.list[1], {id: 2, un: 'MeiMei', nn: 'M', ag: 18, sex: 'woman'});
      done();
    })
  });

  it('should mock create a user', done => {
    EA.api('create', {
      path: '/uc/user',
      method: 'post',
      data: 'uid=0&name=&nick=&age=&sex',
      request: {
        alias: {
          name: 'user_name',
          nick: 'nick_name',
          uid: 'id'
        },
        map(data) {
          if (!('sex' in data)) data.sex = 'man';
          data.id = parseInt(data.id, 10);
          return data;
        }
      }
    }, (http, cb) => {
      USERS[3] = http.data;
      http.data.id = 3;
      assert.deepEqual(http.data, {age: 21, user_name: 'Mora', nick_name: 'M', id: 3, sex: 'man'})
      cb();
    });

    EA.request('create', {name: 'Mora', nick: 'M', age: 21}, (err, data) => {
      assert.ok(!err);
      done();
    });
  });

  it('should errors', done => {

    assert.throws(() => EA.request('foo'), /Missing parameter: id/);
    assert.throws(() => EA.request('foo', {id: 3}), /Missing parameter: a/);
    assert.throws(() => EA.request('foo', {id: 'ab'}), /Parameter id validate error/);
    assert.throws(() => EA.request('foo', {id: 3, a: 'a', c: 'a'}), /Parameter c validate error/);

    EA.request('foo', {id: 3, a: 'a'}, (err, data) => {
      assert.ok(err);
      err.message.should.eql('foo error');
      done();
    });
  });

  it('alias value should be string', () => {
    EA.api('bar', {
      method: 'post',
      request: {
        alias: {
          a: true
        }
      }
    });
    assert.throws(() => EA.request('bar'), /Expect string value for alias/);
  });

  it('computed value should be function', () => {
    EA.api('bar', {
      method: 'post',
      request: {
        computed: {
          a: 'aa'
        }
      }
    });
    assert.throws(() => EA.request('bar'), /Expect function value for computed/);
  });

  it('should throws when no local mock target', done => {
    EA.api('bar', {});
    EA.request('bar', err => {
      assert.ok(err);
      err.message.should.eql('Not found "bar" in mocks options.');
      done();
    });
  });

  it('should throws when request key not string or object or array', () => {
    assert.throws(() => EA.request(null, err => {}), /Illegal arguments/);
  });

  it('should have 3 users now', () => {
    Object.keys(USERS).length.should.eql(3);
  });

  it('should overwrite exists api', (done) => {
    EA.api('user', {query: 'id=2', mockDelay: {min: 1, max: 5}}, USERS[2]);
    EA.request('user', (err, data) => {
      assert.deepEqual(data, USERS[2]);
      assert.notEqual(data, USERS[2]);
      done();
    });
  });
});
