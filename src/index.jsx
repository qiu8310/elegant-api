import ElegantApi from './ElegantApi';

module.exports = function (httpOptions, mockOptions) {
  const ea = new ElegantApi(httpOptions, mockOptions);
  let result = {};

  Object.keys(ea.routes).forEach(key => {
    result[key] = (params, callback) => ea.request(key, params, callback);
  });

  result.$ea = ea;
  result.$request = function () { ea.request.apply(ea, arguments); };

  return result;
};

module.exports.ElegantApi = ElegantApi;
