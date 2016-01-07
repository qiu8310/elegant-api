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
        user_name: 'Alex',
        user_age: 19,
        sex: 'M'
      },

      '2': {
        uid: 2,
        user_name: 'Liu Mei',
        user_age: 16,
        sex: 'F'
      }
    }
  };

}));
