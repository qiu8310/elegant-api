module.exports = function (mocks, key, transformData, callback) {
  var mockTarget;
  if (key in mocks || '$default' in mocks) {
    mockTarget = key in mocks ? mocks[key] : mocks.$default;
    transformData.mock.name = key;
    if (typeof mockTarget === 'function') mockTarget.call(mocks, transformData, callback);
    else callback(null, mockTarget);
  } else {
    callback({
      message: 'Not found mock target for `' + key + '`.',
      name: 'ConfigError',
      by: 'ElegantApi'
    });
  }
};
