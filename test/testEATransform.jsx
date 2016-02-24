import assert from 'should';
import ElegantApi from '../src/ElegantApi';

let EA, MOCK = {memory: true, delay: 0};

describe('EA Transform', () => {

  context('resource', () => {
    beforeEach(() => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          getUser: {
            path: '/users/:uid',
            response: {
              resource: {
                user: 'data'
              }
            }
          },
          createUser: {
            method: 'post',
            path: '/users/',
            request: {
              resource: {
                user: ''
              }
            }
          },
          allUsers: {
            path: '/users/',
            response: {
              resource: {
                user: 'data.list.[]'
              }
            }
          }
        },
        mocks: {
          getUser: {
            status: 0,
            data: {uid: 1, 'user_name': 'u1', year: 1990, sex: null}
          },
          createUser(trans, cb) {
            cb(null, {
              status: 0,
              data: trans.data
            });
          },
          allUsers: {
            status: 0,
            data: {
              list: [
                {uid: 1, 'user_name': 'u1', year: 1990, sex: 'M'},
                {uid: 2, 'user_name': 'u2', year: 1986, sex: 'F'}
              ]
            }
          }
        },
        resources: {
          user: {
            uid: Number,
            username: 'user_name',
            age: {
              alias: 'year',
              read(val) {
                // val === this.year
                return new Date().getFullYear() - val;
              },
              write() {
                return new Date().getFullYear() - this.age;
              }
            },
            gender: {
              type: String,
              alias: 'sex',
              defaultValue: 'M'
            }
          }
        }
      });
    });
    it('should parse resource', done => {
      let r = EA.resources;
      Object.keys(r).should.have.a.length(1);
      assert.ok(r.user);
      done();
    });

    it('should get resource of user', done => {
      EA.request('getUser', {uid: 1}).then(data => {
        data.data.should.have.ownProperty('username', 'alias response `user_name` to `username`');
        data.data.gender.should.eql('M', 'alias response `sex` to `gender` with defaultValue');

        data.data.should.have.ownProperty('age', 'compute `age` from response `year`');
        data.data.age.should.eql(new Date().getFullYear() - 1990);

        done();
      }).catch(done);
    });

    it('should create resource of user', done => {
      EA.request('createUser', {username: 'xx', age: new Date().getFullYear() - 1990}).then(data => {
        let {uid, userName, year, sex} = data.data;
        uid.should.eql(0, 'request will add type\'s defaultValue (0 for Number)');
        userName.should.eql('xx');
        year.should.eql(1990, 'compute `year` value from request `age`');
        sex.should.eql('M', 'compute default `gender` value');
        done();
      })
    });

    it('should get all users', done => {
      EA.request('allUsers', (err, data) => {
        let list = data.data.list;
        list.should.have.length(2);
        list.forEach(function (user) {
          user.should.have.ownProperty('username');
          user.should.have.not.ownProperty('userName');

          user.should.have.ownProperty('age');
          user.should.have.not.ownProperty('year');

          user.should.have.ownProperty('gender');
          user.should.have.not.ownProperty('sex');
        });
        done();
      });
    });
  });

  context('alias', () => {
    it('should support string path', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              alias: {
                'a1': 'aa',
                'b1.d1': 'dd',
                'list.[].nn': 'n'
              }
            }
          }
        },
        mocks: {
          foo: {
            a1: {c1: true},
            b1: {d1: false},
            list: [
              {nn: 1},
              {nn: 2},
              {nn: 3}
            ]
          }
        }
      });

      EA.request('foo').then(data => {
        assert.deepEqual(data, {aa: {c1: true}, b1: {dd: false}, list: [{n: 1}, {n: 2}, {n: 3}]});
        done();
      }).catch(done);
    });

    it('should support object path', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              alias: {
                a1: 'aa',
                b1: {
                  d1: 'dd'
                },
                list: {
                  '[]': {
                    nn: 'n'
                  }
                }
              }
            }
          }
        },
        mocks: {
          foo: {
            a1: {c1: true},
            b1: {d1: false},
            list: [
              {nn: 1},
              {nn: 2},
              {nn: 3}
            ]
          }
        }
      });

      EA.request('foo').then(data => {
        assert.deepEqual(data, {aa: {c1: true}, b1: {dd: false}, list: [{n: 1}, {n: 2}, {n: 3}]});
        done();
      }).catch(done);
    });

    it('should throws when its value is not string', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              alias: {
                a1: true
              }
            }
          }
        },
        mocks: {
          foo: {
            a1: 'aaa'
          }
        }
      });

      EA.request('foo', e => {
        e.message.should.match(/Expect string value for alias/);
        done();
      });
    });

    it('should not throws when not found path', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {foo: {
          response: {
            alias: {
              aa: 'aaaa',
              'aa.aa': 'aaaaaaa'
            }
          }
        }},
        mocks: {
          foo: {a: 'aaa'}
        }
      });
      EA.request('foo').then(data => {
        assert.deepEqual(data, {a: 'aaa'});
        done();
      }).catch(done);
    });
  });

  context('computed', () => {
    it('should support string path', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              computed: {
                ['a.c']() {
                  return this.a1 + this.a2;
                }
              }
            }
          }
        },
        mocks: {
          foo: {a: {a1: '1', a2: '2'}, b: true}
        }
      });
      EA.request('foo').then(data => {
        data.a.c.should.eql('12');
        done();
      }).catch(done);
    });
    it('should support object path', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              computed: {
                a: {
                  c() {
                    return this.a1 + this.a2;
                  }
                }
              }
            }
          }
        },
        mocks: {
          foo: {a: {a1: '1', a2: '2'}, b: true}
        }
      });
      EA.request('foo').then(data => {
        data.a.c.should.eql('12');
        done();
      }).catch(done);
    });
    it('should support computed array\'s item key', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              computed: {
                ['[].nn']() {
                  return this.n * this.n;
                }
              }
            }
          }
        },
        mocks: {
          foo: [{n: 1}, {n: 2}]
        }
      });
      EA.request('foo').then(data => {
        assert.deepEqual(data, [{n: 1, nn: 1}, {n: 2, nn: 4}]);
        done();
      }).catch(done);
    });
    it('should throws when its value is not function', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              computed: {
                a2: true
              }
            }
          }
        },
        mocks: {
          foo: {
            a1: 'aaa'
          }
        }
      });

      EA.request('foo', e => {
        e.message.should.match(/Expect function value for computed/);
        done();
      });
    });
  });

  context('drop', () => {
    it('should drop string', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              drop: 'a.a1'
            }
          }
        },
        mocks: {
          foo: {a: {a1: 1, a2: 2}}
        }
      });
      EA.request('foo').then(data => {
        assert.deepEqual(data, {a: {a2: 2}});
        done();
      }).catch(done);
    });
    it('should drop array', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              drop: ['a.a1', 'a.a2']
            }
          }
        },
        mocks: {
          foo: {a: {a1: 1, a2: 2}}
        }
      });
      EA.request('foo').then(data => {
        assert.deepEqual(data, {a: {}});
        done();
      }).catch(done);
    });
    it('should drop object', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              drop: {
                a: {a1: true}
              }
            }
          }
        },
        mocks: {
          foo: {a: {a1: 1, a2: 2}}
        }
      });
      EA.request('foo').then(data => {
        assert.deepEqual(data, {a: {a2: 2}});
        done();
      }).catch(done);
    });
    it('should not drop others', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              drop: true
            }
          }
        },
        mocks: {
          foo: {a: {a1: 1, a2: 2}}
        }
      });
      EA.request('foo').then(data => {
        assert.deepEqual(data, {a: {a1: 1, a2: 2}});
        done();
      }).catch(done);
    });
  });

  context('map', () => {
    it('should be function', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              map(s) {
                return {b: 2};
              }
            }
          }
        },
        mocks: {
          foo: {a: 1}
        }
      });
      EA.request('foo').then(data => {
        assert.deepEqual(data, {b: 2});
        done();
      }).catch(done);
    });

    it('should ignore if it is not function', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              map: false
            }
          }
        },
        mocks: {
          foo: {a: 1}
        }
      });
      EA.request('foo').then(data => {
        assert.deepEqual(data, {a: 1});
        done();
      }).catch(done);
    });
  });

  context('naming', () => {
    it('should support string naming', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {response: {naming: 'cap'}}
        },
        mocks: {foo: {ab: '1', aaBb: '2'}}
      });
      EA.request('foo').then(data => {
        assert.deepEqual(data, {Ab: '1', AaBb: '2'});
        done();
      }).catch(done);
    });
    it('should support object naming', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              naming: {
                case: 'cap'
              }
            }
          }
        },
        mocks: {
          foo: {
            a: {a1: 1, a2: 2},
            b: {b1: 1, b2: 2}
          }
        }
      });

      EA.request('foo').then(data => {
        assert.deepEqual(data, {A: {A1: 1, A2: 2}, B: {B1: 1, B2: 2}});
        done();
      }).catch(done);
    });
    it('should support object naming and deep', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              naming: {
                case: 'cap',
                deep: 1
              }
            }
          }
        },
        mocks: {
          foo: {
            a: {a1: 1, a2: 2},
            b: {b1: 1, b2: 2}
          }
        }
      });

      EA.request('foo').then(data => {
        assert.deepEqual(data, {A: {a1: 1, a2: 2}, B: {b1: 1, b2: 2}});
        done();
      }).catch(done);
    });
  });

  context('transform order', () => {
    it('should processed according the order', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              order: ['naming', 'alias', 'computed'],
              naming: 'cap',
              alias: {
                AB: 'x'
              },
              computed: {
                y() {
                  return this.x;
                }
              }
            }
          }
        },
        mocks: {
          foo: {'a_b': 'x'}
        }
      });
      EA.request('foo').then(data => {
        assert.deepEqual(data, {x: 'x', y: 'x'});
        done();
      }).catch(done);
    });
  });

  context('transform filter', () => {
    it('should only run process in order', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            response: {
              order: ['foo', 'alias'],
              naming: 'cap',
              alias: {
                b: 'bbb'
              },
              computed: {
                a() {}
              }
            }
          }
        },
        mocks: {
          foo: {b: 'bbb'}
        }
      });
      EA.request('foo').then(data => {
        assert.deepEqual(data, {bbb: 'bbb'});
        done();
      }).catch(done);
    });
  });

  context('transform on request data', () => {
    it('should transform request data', done => {
      EA = new ElegantApi({
        mock: MOCK,
        routes: {
          foo: {
            method: 'post',
            request: {
              order: ['naming', 'alias', 'computed'],
              naming: 'cap',
              alias: {
                AB: 'x'
              },
              computed: {
                y() {
                  return this.x;
                }
              }
            }
          }
        },
        mocks: {
          foo(trans, cb) {
            console.log(trans);
            assert.deepEqual(trans.data, {x: 'x', y: 'x'});
            done();
          }
        }
      });
      EA.request('foo', {'a_b': 'x'}).catch(done);

    });
  });
});
