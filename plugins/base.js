var mock = require('./mock');
var mockTargets;

function writeWarn() {
  process.stdout.write('\x1b[33m\x1b[93m'); // 防止有些系统不支持 93
  console.log.apply(console, arguments);
  process.stdout.write('\x1b[0m');
}

function writeError() {
  process.stderr.write('\x1b[31m\x1b[91m'); // 防止有些系统不支持 92
  console.error.apply(console, arguments);
  process.stderr.write('\x1b[0m');
}

function renderError(obj) {
  if (!obj) return obj;

  if (obj instanceof Error) {
    obj = {name: 'Server Error', message: obj.message};
  } else if (!obj.by) {
    obj.by = 'ElegantApi';
  }

  writeError(obj);
  return obj;
}

module.exports = {
  writeWarn: writeWarn,
  writeError: writeError,

  renderError: renderError,

  init: function (options) {
    options = options || {};

    // 为了兼容用户可能将 mocks 和 routes 设置在一起
    mockTargets = options.mocks || options;
  },

  parse: function (eaData) {
    if (!eaData) {
      throw renderError({
        name: 'Illegal Request Error',
        message: 'Not found eaData (It should exists in query.__eaData or in cookies)'
      });
    }

    try {
      eaData = JSON.parse(eaData);
    } catch (e) {
      throw renderError({
        name: 'Illegal eaData Error',
        message: 'eaData should be a stringified JSON object',
        data: eaData
      });
    }

    return eaData;
  },

  mock: function (key, http, callback) {
    if (!mockTargets) {
      callback(renderError({
        name: 'Syntax Error',
        message: 'You should execute base.init(options) first'
      }));
    } else {
      mock(mockTargets, key, http, function (err, data) {
        callback(renderError(err), data);
      });
    }
  }

};
