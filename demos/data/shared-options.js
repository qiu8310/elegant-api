(function (global, factory) {

  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('./db'));
  } else {
    global.OPTIONS = factory(global.DB);
  }

}(this, function (DB) {

  var USERS = DB.users;

  function ok(data, cb) {
    cb(null, {status: 0, data: data, message: 'ok'});
  }
  function error(message, cb) {
    cb(null, {status: -1, data: null, message: message});
  }

  return {
    mock: 'server',
    base: '/api',
    handler: function (http, cb) {
      http.cache = false; // jQuery 默认也会 cache 相同的 get 请求

      console.log('jQuery ajax setting: %o', http);
      window.jQuery.ajax(http)
        .success(function (data) {
          cb(null, data);
        })
        .error(function(xhr) {
          cb(xhr);
        });
    },
    routes: {
      getUser: {
        path: '/users/:uid'
      },
      getAllUsers: {
        path: '/users'
      },
      deleteUser: {
        method: 'delete',
        path: '/users/:uid'
      },
      createUser: {
        method: 'post',
        path: '/users'
      },
      updateUser: {
        method: 'put',
        path: '/users/:uid'
      },

      foo: {
        path: 'foo',
        method: 'post'
      }
    },

    mocks: {
      getUser: function (http, cb) {
        var user = USERS[http.params.uid];
        if (!user) return error('Not found user', cb);
        ok(user, cb);
      },
      getAllUsers: function (http, cb) {
        ok(Object.keys(USERS).map(function (uid) { return USERS[uid]; }), cb);
      },
      deleteUser: function (http, cb) {
        var user = USERS[http.params.uid];
        if (!user) return error('Not found user', cb);

        delete USERS[http.params.uid];
        ok(user, cb);
      },
      createUser: function (http, cb) {
        var data = http.data;
        if (!data.username || !data.age || !data.gender) return error('Absence arguments', cb);

        var user = {username: data.username, age: data.age, gender: data.gender};
        var uid = 0;
        while (++uid) if (!USERS[uid]) break;
        user.uid = uid;
        USERS[uid.toString()] = user;

        ok(user, cb);
      },
      updateUser: function (http, cb) {
        var user = USERS[http.params.uid];
        if (!user) return error('Not found user', cb);

        for (var key in user)
          if (key !== 'uid' && key in http.data) user[key] = http.data[key];

        ok(user, cb);
      },
      foo: function (http, cb) {
        cb(null, http);
      }
    }
  };

}));
