(function (global, factory) {

  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('./db'));
  } else {
    global.MOCKS = factory(global.DB);
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
      if (!data.user_name || !data.user_age || !data.sex) return error('Absence arguments', cb);

      var user = {username: data.user_name, user_age: data.user_age, sex: data.sex};
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
    }
  };

}));
