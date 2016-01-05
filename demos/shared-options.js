(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  global.OPTIONS = factory();
}(this, function () {

  return {
    mock: 'mock',
    base: '/api/users',
    http: {
      cache: false // jQuery 默认也会 cache 相同的 get 请求
    },
    handler: function (http, callback) {
      window.jQuery.ajax(http)
        .success(function (data) { callback(null, data); })
        .error(function(xhr) { callback(xhr); });
    },
    routes: {
      user: {
        path: 'get_user',
        query: 'uid='
      },

      foo: {
        path: 'foo',
        method: 'post'
      }
    },
    mocks: {
      user: function (http, callback) {
        if (!http.query.uid) return callback(new Error('no uid'));
        callback(null, {
          uid: http.query.uid,
          username: 'Alex',
          age: 19,
          random: Math.random()
        })
      },

      foo: function (http, callback) {
        callback(null, http);
      }
    }
  };

}));
