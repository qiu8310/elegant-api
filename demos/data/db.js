(function (global, factory) {

  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else {
    global.DB = factory();
  }

}(this, function () {

  return {
    users: {
      '1': {
        uid: 1,
        username: 'Alex',
        age: 19,
        gender: 'M'
      },

      '2': {
        uid: 2,
        username: 'Liu Mei',
        age: 16,
        gender: 'W'
      }
    }
  };

}));
