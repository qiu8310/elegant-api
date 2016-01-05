export default {
  base: '/api/server/',

  cache: 'smart',

  mock: 'mock:http://127.0.0.1:9010',
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


