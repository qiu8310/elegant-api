var OPTIONS = {
  mock: {proxy: false, server: false},
  mockDelay: {min: 200, max: 1000}, // 只有 mock 为 memory 时才起作用
  base: '/api',

  handler: function (http, cb) {
    if (this.mock === 'memory') {
      if (http.error) return cb(http.error);
      return filter(http.data);
    }

    function filter (data) {
      console.debug('Response original data %o', data);
      if (data.status === 0) cb(null, data.data);
      else cb(data.message, data);
    }

    http.cache = false; // jQuery 默认也会 cache 相同的 get 请求
    console.debug('Request ajax setting: %o', http);
    window.jQuery.ajax(http)
      .success(filter)
      .error(function(xhr, status, text) {
        console.error(xhr, status, text);
        alert('There seems to be a problem for your network...');
      });
  },

  routes: {
    getUser: {
      path: '/users/:uid'
    },
    getAllUsers: {
      path: '/users',
      response: {
        alias: {
          '[].user_name': 'username',
          '[].user_age': 'age',
          '[].sex': 'gender'
        },
        computed: {
          '[].year': function (user) {
            return new Date().getFullYear() - user.age;
          }
        },
        map: function (users) {
          users.forEach(function (user) {
            user.m_a_p = true;
          });
          return users;
        }
      }
    },
    deleteUser: {
      method: 'delete',
      path: '/users/:uid'
    },
    createUser: {
      method: 'post',
      path: '/users',
      request: {
        alias: {
          username: 'user_name',
          gender: 'sex'
        },
        computed: {
          user_age: function (user) {
            return new Date().getFullYear() - user.year;
          }
        }
      }
    },
    updateUser: {
      method: 'put',
      path: '/users/:uid',
      request: {
        alias: {
          username: 'user_name',
          gender: 'sex'
        },
        computed: {
          user_age: function (user) {
            return new Date().getFullYear() - user.year;
          }
        }
      }
    }
  }
}
