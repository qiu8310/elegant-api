const util = require('./libs/util');
const ElegantApi = require('./ElegantApi');

module.exports = function (httpOptions, mockOptions) {
  const ea = new ElegantApi(httpOptions, mockOptions);
  let result = {};

  util.objectKeys(ea.routes).forEach(key => {
    result[key] = (...args) => ea.request(key, ...args);
  });

  result.$ea = ea;
  result.$request = function () { return ea.request.apply(ea, arguments); };
  result.$r = result.$resource = function (key) {
    let res = ea.resources[key];
    return res ? Object.keys(res).reduce((result, key) => {
      let val = res[key].defaultValue;
      result[key] = val === undefined ? null : val;
      return result;
    }, {}) : {};
  };

  result.$cache = function (cache) {
    let ref = cache || ea.globals;
    let {cacheMap, cacheStack} = ref;

    if (!cache) {
      return {cacheMap, cacheStack};
    } else {
      if (cacheMap && cacheStack) {
        ea.globals.cacheMap = cacheMap;
        ea.globals.cacheStack = cacheStack;
      }
    }
  };

  return result;
};

module.exports.ElegantApi = ElegantApi;
