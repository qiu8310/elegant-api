var OPTIONS = {
  mock: 'memory',
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
  }
}
