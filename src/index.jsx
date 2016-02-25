const util = require('./libs/util');
const ElegantApi = require('./ElegantApi');

module.exports = function (httpOptions, mockOptions) {
  const ea = new ElegantApi(httpOptions, mockOptions);
  let result = {};

  util.objectKeys(ea.routes).forEach(key => {
    result[key] = (params, callback) => ea.request(key, params, callback);
  });

  result.$ea = ea;
  result.$request = function () { ea.request.apply(ea, arguments); };

  return result;
};

module.exports.ElegantApi = ElegantApi;
