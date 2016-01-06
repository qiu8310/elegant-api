// 不要用 ES6 的 export default， 这样在 ES5 里用的话会导致 require 多个 default 关键字在最外层
module.exports = {
  base: '/api/server/',

  cache: 'smart',

  mock: {server: 'http://127.0.0.1:9010'},

  _proxy: 'http://127.0.0.1:9011', // 给内部用的，和配置没关系

  mockDelay: 10,

  routes: {
    userA: {
      query: 'uid=',
      method: 'GET'
    },
    userB: {
      query: 'uid=',
      method: 'POST'
    },
    userC: {
      query: 'uid=',
      method: 'POST',
      cache: true
    },
    userE: {
      query: 'uid='
    },
    userS: {
      query: 'uid='
    }
  },

  mocks: {
    userA(http, cb) {
      cb(null, {category: 'A', uid: parseInt(http.query.uid), timestamp: Date.now()});
    },
    userB(http, cb) {
      cb(null, {category: 'B', uid: parseInt(http.query.uid), timestamp: Date.now()});
    },
    userC(http, cb) {
      cb(null, {category: 'C', uid: parseInt(http.query.uid), timestamp: Date.now()});
    },
    userE(http, cb) {
      cb(new Error(http.query.uid));
    },
    userS(http, cb) {
      cb(null, {status: -1});
    }
  }
};


