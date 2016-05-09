import assert from 'should';
import ElegantApi from '../src/ElegantApi';


describe('EA Config', () => {
  let EA, MOCK = {delay: 0, memory: true};

  beforeEach(() => {
    if (window.localStorage) delete window.localStorage.__ea;
  });

  context('promise', () => {
    it('should support promise when it is available', done => {
      EA = new ElegantApi({mock: MOCK, routes: {foo: true}, mocks: {foo: true}});
      assert.ok(EA.request('foo').then);
      assert.ok(EA.request('foo').catch);
      done();
    });

    it('should support callback when promise is not available', done => {
      let p = window.Promise;
      window.Promise = null;
      EA = new ElegantApi({mock: MOCK, routes: {foo: true}, mocks: {foo: true}});
      EA.request('foo', (err, data) => {
        assert.equal(data, true);
        window.Promise = p;
        done();
      });
    });

    it('should also support callback when promise is available', done => {
      EA = new ElegantApi({mock: MOCK, routes: {foo: true}, mocks: {foo: true}});
      EA.request('foo', (err, data) => {
        assert.equal(data, true);
        done();
      });
    });
  });

  context('route.name', () => {
    it('should use key as route\'s name', () => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: true
        }
      });
      assert.ok(EA.apis.foo);
    });

    it('should support specify any string as route\'s name', () => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            name: 'fff'
          }
        }
      });
      assert.ok(EA.apis.fff);
      assert.ok(!EA.apis.foo);
    });

    it('should throws when request a not exists route name', done => {
      EA = new ElegantApi();
      EA.request('foo').catch(err => {
        err.message.should.match(/Request key 'foo' not exists/);
        done();
      });
    });

    it('should not throws when no route but only mock', done => {
      EA = new ElegantApi({mocks: {foo: true}});
      EA.request('foo').then(res => {
        assert.ok(res === true);
        done();
      }).catch(done);
    })
  });

  context('globals', () => {

    it('should be setted in initialize', done => {
      EA = new ElegantApi({
        globals: {
          custom: 'abc',
          eaQueryPrefix: 'ea_'
        }
      });
      EA.globals.custom.should.eql('abc');
      EA.globals.eaQueryPrefix.should.eql('ea_');
      done();
    });

    it('should persistence location.search paramaters when support localStorage', done => {
      if (!window.localStorage) return done();

      let random = Math.random().toString();
      EA = new ElegantApi({
        mock: MOCK,
        mocks: {
          foo(trans, cb) {
            trans.ea.abc.should.eql(random);
            cb('foo');
          },
          bar(trans, cb) {
            trans.ea.abc.should.eql(random);
            done();
          }
        },
        routes: {
          foo: {
            // __search 表示 location.search 参数（只在测试环境下有效）
            __search: '__abc=' + random
          },
          bar: {}
        }
      });

      EA.request('foo', () => EA.request('bar'));
    });

    it('should support change ea paramater\'s prefix with eaQueryPrefix', done => {
      EA = new ElegantApi({
        mock: MOCK,
        globals: {
          eaQueryPrefix: 'ea_'
        },
        mocks: {foo(trans, cb) {
          trans.ea.abc.should.eql('override');
          Object.keys(trans.ea).should.have.length(1);
          done()
        }},
        routes: {foo: {
          __search: '__abc=default&ea_abc=override'
        }}
      });

      EA.request('foo');
    });
  });

  // cache 的配置放在 globals，所以将此模块写在 globals 下面
  context('cache', () => {
    it('should default cache GET and HEAD request', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {method: 'GET'},
          bar: {method: 'HEAD'},
          tee: {method: 'POST'}
        },
        mocks: { foo: 1, bar: 2, tee: 3 }
      });
      let {cacheStack} = EA.globals;
      cacheStack.should.have.a.length(0);

      EA.request('foo')
      .then(() => {
        cacheStack.should.have.a.length(1);
        return EA.request('foo');
      })
      .then(() => {
        cacheStack.should.have.a.length(1);
        return EA.request('bar');
      })
      .then(() => {
        cacheStack.should.have.a.length(2);
        return EA.request('foo');
      })
      .then(() => {
        cacheStack.should.have.a.length(2);
        return EA.request('tee');
      })
      .then(() => {
        cacheStack.should.have.a.length(2);
        return EA.request('tee');
      }).
      then(() => {
        cacheStack.should.have.a.length(2);
        done();
      }).catch(done);
    });

    it('should use cache when enabled', done => {
      EA = new ElegantApi({
        mock: {delay: 0},
        routes: {
          foo: {method: 'POST', cache: true}
        },
        mocks: {
          foo: 'foo'
        }
      });

      let {cacheStack} = EA.globals;
      cacheStack.should.have.a.length(0);
      EA.request('foo').then(() => {
        cacheStack.should.have.a.length(1);
        done();
      }).catch(done);
    });

    it('should not use cache when disabled', done => {
      EA = new ElegantApi({
        mock: {delay: 0},
        routes: {
          foo: {method: 'GET', cache: false}
        },
        mocks: {
          foo: 'foo'
        }
      });

      let {cacheStack} = EA.globals;
      cacheStack.should.have.a.length(0);
      EA.request('foo').then(() => {
        cacheStack.should.have.a.length(0);
        done();
      }).catch(done);
    });

    it('should remove cached route name through api', done => {
      let count = 0;
      EA = new ElegantApi({
        mock: {delay: 0},
        mocks: {
          foo(target, cb) {
            cb(null, ++count);
          }
        }
      });

      EA.request('foo')
        .then(data => {
          EA.globals.cacheStack.should.have.a.length(1);
          data.should.eql(1);
        })
        .then(() => {
          return EA.request('foo').then(data => {
            data.should.eql(1);
          });
        })
        .then(() => {
          EA.removeCache('foo');
          EA.globals.cacheStack.should.have.a.length(0);
        })
        .then(() => {
          return EA.request('foo').then(data => {
            data.should.eql(2);
            done();
          });
        })
        .catch(done);
    });

    it('should remove cached route name through config', done => {
      let count = 0;
      EA = new ElegantApi({
        mock: {delay: 0},
        cache: true,
        routes: {
          bar: {
            removeCache: 'foo'
          }
        },
        mocks: {
          foo(target, cb) {
            cb(null, ++count);
          },
          bar: true
        }
      });

      EA.request('foo')
        .then(() => {
          return EA.request('foo')
            .then(data => {
              data.should.be.eql(1); // cached
            });
        })
        .then(() => {
          return EA.request('bar'); // will remove cache foo
        })
        .then(() => {
          return EA.request('foo').then(data => {
            data.should.be.eql(2); // no cache
            done()
          });
        })
        .catch(done);
    });

    it('should append a timestamp query to url after remove cache', done => {
      let i = 0;
      EA = new ElegantApi({
        mock: {delay: 0},
        handle(target, cb) {
          if (i === 3) {
            target.http.url.should.containEql('?_t=')
          }
          cb(target.error, target.data);
        },
        routes: {
          foo: {method: 'POST', cache: true},
          bar: {removeCache: 'foo'}
        },
        mocks: {
          $default(target, cb) { cb(null, ++i); }
        }
      });

      EA.request('foo')
        .then(data => {
          data.should.eql(1);
          return EA.request('foo')
        })
        .then(data => {
          data.should.eql(1); // cached
          return EA.request('bar'); // remove cache
        })
        .then(data => {
          data.should.eql(2);
          return EA.request('foo');
        })
        .then(data => {
          data.should.eql(3);
          done();
        })
        .catch(done);
    });

    it('should not cache error response even if cache is enabled', done => {
      EA = new ElegantApi({
        mock: {delay: 0},
        routes: {
          foo: {method: 'GET', cache: true}
        },
        mocks: {
          foo(trans, cb) { cb(new Error('foo')); }
        }
      });

      let {cacheStack} = EA.globals;
      cacheStack.should.have.a.length(0);
      EA.request('foo').catch(err => {
        cacheStack.should.have.a.length(0);
        done();
      });
    });

    it('should support cache size config', done => {
      EA = new ElegantApi({
        mock: {delay: 0},
        globals: {cacheSize: 2},
        routes: {
          foo: true, bar: true, tee: true
        },
        mocks: { foo: 1, bar: 2, tee: 3 }
      });
      let {cacheStack} = EA.globals;

      EA.request('foo')
      .then(() => {
        cacheStack.should.have.a.length(1);
        return EA.request('bar');
      })
      .then(() => {
        cacheStack.should.have.a.length(2);
        return EA.request('tee');
      })
      .then(() => {
        cacheStack.should.have.a.length(2);
        done();
      }).catch(done);
    });

    it('should support expire', done => {
      EA = new ElegantApi({
        mock: {delay: 0},
        routes: {
          foo: {
            cache: {enable: true, expireSeconds: 0.1}
          }
        },
        mocks: { $default(target, cb) { cb(null, Math.random()); } }
      });

      let value;
      EA.request('foo')
      .then(d => {
        value = d;
        return EA.request('foo');
      })
      .then(d => {
        d.should.eql(value);
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            EA.request('foo').then(resolve, reject)
          }, 300);
        });
      })
      .then(d => {
        d.should.not.eql(value);
        done();
      })
      .catch(done);

    });
  });

  context('emulate', () => {
    it('should support emulateJSON', done => {
      EA = new ElegantApi({
        mock: MOCK, emulateJSON: true,
        routes: {
          foo: {method: 'post'}
        },
        handle(target, cb) {
          let http = target.http;
          http.headers['Content-Type'].should.eql('application/x-www-form-urlencoded');
          http.data.should.eql('a=a');
          cb()
        },
        mocks: {
          foo: null
        }
      });

      EA.request('foo', {a: 'a'}).then(done).catch(done);
    });

    it('should support emulateHTTP', done => {
      EA = new ElegantApi({
        mock: MOCK, emulateHTTP: true,
        routes: {
          foo: {method: 'put'}
        },
        handle(target, cb) {
          let http = target.http;
          http.headers['X-HTTP-Method-Override'].should.eql('PUT');
          http.method.should.eql('POST');
          cb()
        },
        mocks: { foo: null }
      });

      EA.request('foo', {a: 'a'}).then(done).catch(done);
    });

    it('should not support emulateHTTP when enable it but crossOrigin is on', done => {
      EA = new ElegantApi({
        mock: MOCK, emulateHTTP: true, crossOrigin: true,
        routes: {
          foo: {method: 'put'}
        },
        handle(target, cb) {
          let http = target.http;
          assert.ok(!http.headers['X-HTTP-Method-Override']);
          http.method.should.eql('PUT');
          cb()
        },
        mocks: { foo: null }
      });

      EA.request('foo', {a: 'a'}).then(done).catch(done);
    });
  });

  context('http.url', () => {

    it('should not configable', done => {
      let url = 'http://www.baidu.com/foo';
      EA = new ElegantApi({
        mock: MOCK,
        routes: {foo: {url}},
        mocks: {foo: true},
        handle(target, cb) {
          target.http.url.should.not.eql(url);
          done();
        }
      });

      EA.request('foo');
    });

    it('should consist of base + path', done => {
      EA = new ElegantApi({
        mock: MOCK,
        base: '/api/server',
        mocks: {foo: true},
        routes: {
          foo: {
            path: '/user'
          }
        },
        handle(target, cb) {
          target.http.url.should.eql('/api/server/user');
          done();
        }
      });
      EA.request('foo');
    });

    it('base and path should extendable', done => {
      EA = new ElegantApi({
        mock: MOCK,
        path: '/user',
        mocks: {foo: true},
        routes: {
          foo: {
            base: '/api/server'
          }
        },
        handle(target, cb) {
          target.http.url.should.eql('/api/server/user');
          done();
        }
      });
      EA.request('foo');
    });
  });

  context('http.params', () => {
    it('should support config http.path variable', done => {
      EA = new ElegantApi({
        mock: MOCK,
        base: '/api/users',
        routes: {
          foo: {
            path: '/:uid'
          }
        },
        handle(target, cb) {
          target.http.url.should.eql('/api/users/3');
          done();
        },
        mocks: {
          foo(trans, cb) {
            trans.params.uid.should.eql(3);
            cb();
          }
        }
      });
      EA.request('foo', {uid: 3});
    });
    it('should support config http.base variable', done => {
      EA = new ElegantApi({
        mock: MOCK,
        base: '/api/:resource',
        routes: {
          foo: {
            path: '/5'
          }
        },
        handle(target, cb) {
          target.http.url.should.eql('/api/dogs/5');
          done();
        },
        mocks: {
          foo(trans, cb) {
            trans.params.resource.should.eql('dogs');
            cb();
          }
        }
      });
      EA.request('foo', {resource: 'dogs'});
    });
    it('should throws when config variable not provide', done => {
      EA = new ElegantApi({
        mock: MOCK,
        base: '/api/users',
        routes: {
          foo: {
            path: '/:uid'
          }
        }
      });
      EA.request('foo').catch(err => {
        err.message.should.match(/Route foo missing params parameter/);
        done();
      });
    });
  });

  context('http.query & http.data', () => {

    it('should support string and object config', done => {
      let EA1 = new ElegantApi({
        mock: MOCK,
        mocks: {foo(trans, cb) { cb(null, trans); }},
        routes: {
          foo: {
            query: 'q1=:id&q2=val&q3=&q4'
          }
        }
      });
      let EA2 = new ElegantApi({
        mock: MOCK,
        mocks: {foo(trans, cb) { cb(null, trans); }},
        routes: {
          foo: {
            method: 'post',
            data: {
              id: {
                alias: 'q1',
                required: true
              },
              q2: {
                value: 'val'
              },
              q3: {
                required: true
              },
              q4: {
                required: false
              }
            }
          }
        }
      });

      EA1.request('foo').catch(err => err.message.should.match(/Route foo missing query parameter: id/));
      EA2.request('foo').catch(err => err.message.should.match(/Route foo missing data parameter: id/));


      EA1.request('foo', {id: 1}).catch(err => err.message.should.match(/Route foo missing query parameter: q3/));
      EA2.request('foo', {id: 1}).catch(err => err.message.should.match(/Route foo missing data parameter: q3/));

      EA1.request('foo', {id: 1, q3: '3'}).then(trans => {
        trans.query.q1.should.eql('1');
        trans.query.q2.should.eql('val');
        trans.query.q3.should.eql('3');

        return EA2.request('foo', {id: 1, q3: '3'}).then(trans => {
          trans.data.q1.should.eql(1);
          trans.data.q2.should.eql('val');
          trans.data.q3.should.eql('3');
          done();
        });
      }).catch(done);
    });

    it('should support function and regexp validate in object config', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {query: {
            fn: {
              validate(val) {
                return /^\d+$/.test(val);
              }
            },
            reg: {
              validate: /^\d+$/
            }
          }}
        }
      });

      EA.request('foo', {fn: '1', reg: 'a'}).catch(e => {
        e.message.should.match(/Route foo query parameter 'reg' validate error/);

        return EA.request('foo', {fn: 'a', reg: '1'});
      }).catch(e => {
        e.message.should.match(/Route foo query parameter 'fn' validate error/);
        done();
      });
    });

    it('should support alias in build query or data', done => {
      EA = new ElegantApi({
        mock: MOCK,
        path: '/api',
        routes: {
          foo: { query: 'qid=:id', data: 'did=:tt', method: 'post' }
        },
        handle(target, cb) {
          target.http.url.should.startWith('/api?qid=33'); // not "/api?id=33"
          target.http.data.did.should.eql('xx');
          done();
        },
        mocks: { foo: true }
      });
      EA.request('foo', {id: 33, tt: 'xx'});
    });

    it('should support config in rootOptions', done => {
      EA = new ElegantApi({
        mock: MOCK,
        path: '/api',
        query: 'version=v1&type=',
        routes: {
          foo: {
            query: 'id='
          }
        },
        handle(target) {
          let query = target.http.query;
          query.version.should.eql('v1');
          query.type.should.eql('users');
          query.id.should.eql('3');
          done();
        },
        mocks:{foo: 'foo'}
      });

      EA.request('foo', {id: 3}).catch(e => {
        e.message.should.match(/Route foo missing query parameter: type/);
        EA.request('foo', {id: 3, type: 'users'});
      });
    });

    it('http.data should be empty when http.method is GET or HEAD', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          get: {method: 'GET'},
          head: {method: 'HEAD'}
        },
        mocks: {
          get: true,
          head: true
        },
        handle(target, cb) {
          Object.keys(target.http.data).should.have.a.length(0);
          Object.keys(target.http.body).should.have.a.length(0);
          cb();
        }
      });

      let data = {a: 'aa', b: 'bb'};
      EA.request('get', data)
        .then(() => EA.request('head', data))
        .then(() => done())
        .catch(done);
    });

    it('should support submit no Object data', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            method: 'POST'
          }
        },
        mocks: {
          foo(target, cb) {
            cb(null, target.data);
          }
        }
      });

      EA.request('foo', {data: 123})
        .then(data => assert.equal(data, 123))
        .then(_ => EA.request('foo', {data: false})).then(d => assert.equal(d, false))
        .then(_ => EA.request('foo', {data: 0})).then(d => assert.equal(d, 0))
        .then(_ => EA.request('foo', {data: null})).then(d => assert.equal(d, null))
        .then(_ => EA.request('foo', {data: []})).then(d => assert.deepEqual(d, []))
        .then(_ => EA.request('foo', {data: {a: 1}})).then(d => assert.deepEqual(d, {a: 1}))
        .then(_ => done())
        .catch(done);
    });
  });

  context('http others', () => {
    it('should extend from rootOptions', done => {
      EA = new ElegantApi({
        mock: MOCK,
        http: {
          custom: 'Something'
        },
        handle(target) {
          target.http.custom.should.eql('xxx');
          done();
        },
        routes: {
          foo: {
            custom: 'xxx'
          }
        },
        mocks: {foo: true}
      });

      EA.request('foo');
    });
  });

  context('mock.delay', () => {
    it('should support number config', done => {
      let delay = 10 + Math.round(Math.random() * 100);
      let prev = Date.now();

      EA = new ElegantApi({
        mock: {delay: delay, memory: true},
        routes: {foo: true},
        mocks: {foo: true}
      });

      EA.request('foo').then(() => {
        assert.ok(Date.now() - prev > delay - 10);
        done();
      }).catch(done);
    });
    it('should support object config with property of min and max', done => {
      let min = 10 + Math.round(Math.random() * 100);
      let max = 200;
      let prev = Date.now();

      EA = new ElegantApi({
        mock: {delay: {min, max}, memory: true},
        routes: {foo: true},
        mocks: {foo: true}
      });

      EA.request('foo').then(() => {
        assert.ok(Date.now() - prev > min - 10);
        done();
      }).catch(done);
    });
  });


  context('response types', () => {
    let mocks = {
      int: 3,
      null: null,
      bool: false,
      string: 'string',
      array: [1, 'a', true]
    };
    let EA = new ElegantApi({
      mock: MOCK,
      cache: false,
      mocks,
      routes: {int: true, null: true, bool: true, string: true, array: true}
    });

    it('should response int', done => {
      EA.request('int', (err, data) => {
        assert.deepEqual(data, mocks.int);
        done();
      });
    });

    it('should response null', done => {
      EA.request('null', (err, data) => {
        assert.deepEqual(data, mocks.null);
        done();
      });
    });

    it('should response bool', done => {
      EA.request('bool', (err, data) => {
        assert.deepEqual(data, mocks.bool);
        done();
      });
    });

    it('should response string', done => {
      EA.request('string', (err, data) => {
        assert.deepEqual(data, mocks.string);
        done();
      });
    });

    it('should response array', done => {
      EA.request('array', (err, data) => {
        assert.deepEqual(data, mocks.array);
        done();
      });
    });

    it('should response default value', done => {
      let count = 0;
      EA = new ElegantApi({
        mock: MOCK,
        cache: false,
        routes: {
          foo: true,
          bar: true
        },
        mocks: {
          $default(traget, cb) {
            cb(null, ++count);
          }
        }
      });

      EA.request('foo')
        .then(d => d.should.eql(1))
        .then(() => EA.request('bar'))
        .then(d => d.should.eql(2))
        .then(() => EA.request('foo'))
        .then(d => { d.should.eql(3); done(); })
        .catch(done);
    })
  });

});
