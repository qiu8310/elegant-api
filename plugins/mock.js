module.exports = function (mocks, key, http, callback) {
  var mockTarget;
  if (key in mocks) {
    mockTarget = mocks[key];
    if (typeof mockTarget === 'function') mockTarget(http, callback);
    else callback(null, mockTarget);
  } else {
    callback({
      message: 'Not found mock target for `' + key + '`.',
      name: 'ConfigError',
      by: 'ElegantApi'
    });
  }
};
