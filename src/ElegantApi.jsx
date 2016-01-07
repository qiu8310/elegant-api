import defaultHttpOptions from './defaultHttpOptions';
import transform from 'naming-transform';
import util from './util';
import mockResponse from '../plugins/mock';

let STORAGE = window.localStorage /* istanbul ignore next */ || {};

export default class ElegantApi {

  constructor(baseOptions, mockOptions) {
    baseOptions = util.extend(true, {}, defaultHttpOptions, baseOptions);

    this.baseOptions = baseOptions;
    this._normalizeRouteQueryAndData(baseOptions);

    this.global = baseOptions.global;
    this.prefix = this.global.eaQueryPrefix;

    this.routes = {};
    this.mocks = {};

    Object.keys(baseOptions.routes /* istanbul ignore next */ || {}).forEach(key => {
      this.api(key, baseOptions.routes[key]);
    });

    mockOptions = mockOptions || baseOptions.mocks /* istanbul ignore next */ || {};
    Object.keys(mockOptions).forEach(key => this.mock(key, mockOptions[key]));

    delete baseOptions.routes;
    delete baseOptions.global;
  }

  /**
   * 对 route 上的 http 进行统一
   */
  _normalizeRouteHTTP(route) {
    let http = route.http;

    for (let key in http) {
      if (route[key]) http[key] = route[key];
    }

    http.path = util.urlNormalize(route.base + route.path);
    http.method = http.method.toUpperCase();
  }


  /**
   * 对 httpOptions 的中的 route 中的 query 和 data 格式进行统一，并且保证它们一定存在，且为 Object 类型
   */
  _normalizeRouteQueryAndData(route) {
    ['query', 'data'].forEach(key => {
      let value = route[key];
      if (typeof value === 'string') {
        route[key] = value.split('&').reduce((result, qs) => {
          let kv = qs.split('=').map(decodeURIComponent);
          let key = kv[0], val = kv[1];
          let conf = {};

          if (val && val[0] === ':' && val[1]) conf.alias = val.slice(1);
          else if (val) conf.value = val;

          if (val === '' || conf.alias) conf.required = true;

          result[key] = conf;
          return result;
        }, {});
      } else if (!util.isObject(value)) {
        route[key] = {};
      }
    });
  }

  /**
   * 验证用户指定的参数
   */
  _checkUserParams(params, rules) {
    let paramKey, paramVal, conf;

    for (let key in rules) {
      conf = rules[key];
      paramKey = conf.alias || key;
      paramVal = params[paramKey];

      if (conf.required && !(paramKey in params)) throw new SyntaxError(`Missing parameter: ${paramKey}.`);
      if (conf.validate && (paramKey in params)) {
        if (
          typeof conf.validate === 'function' && !conf.validate(paramVal)
          || conf.validate instanceof RegExp && !conf.validate.test(paramVal)
        ) {
          throw new SyntaxError(`Parameter ${paramKey} validate error.`);
        }
      }

      if ('value' in conf && !(paramKey in params)) params[paramKey] = conf.value;
    }
  }

  /**
   * 通过用户指定的 userParams 和 route 中的要求，得到接口需要的 params/query/data
   *
   *  - 如果 userParams 中不存在 query、 data 和 params 字段，
   *    则自动从 params 中取出需要的 params 和 query，再把剩下的全交给 data
   *
   *  - 否则 userParams 中需要指定 query 和 data
   */
  _applyUserParams(userParams, route) {
    let query = userParams.query || {},
      data = userParams.data || {},
      paramsReg = /\/:([-\w]+)/g;

    let params = {};
    route.http.path.replace(paramsReg, (r, key) => {
      params[key] = true;
    });

    if (!userParams.query && !userParams.data && !userParams.params) {
      let queryKeys = Object.keys(route.query).map(key => route.query[key].alias || key);

      for (let key in userParams) {
        if (key in params) params[key] = userParams[key];
        else if (queryKeys.indexOf(key) >= 0) query[key] = userParams[key];
        else data[key] = userParams[key];
      }
    }

    let path = route.http.path.replace(paramsReg, (r, key) => {
      if (params[key] === true) throw new SyntaxError(`Missing path params ${key}.`);
      return '/' + params[key];
    });

    this._checkUserParams(query, route.query);
    this._checkUserParams(data, route.data);

    return {path, query, data, params};
  }

  /**
   * 遍历指定的规则，主要用在 _applyAlias 和 _applyComputed 中
   */
  _walkRules(rules, cb, prefix) {
    for (let key in rules) {
      let path = prefix ? prefix + '.' + key : key;
      if (util.isObject(rules[key])) {
        this._walkRules(rules[key], cb, path);
      } else {
        cb(path, rules[key]);
      }
    }
  }

  _resolveRefs(source, path) {
    let refs = [source];
    if (!path) return refs;

    path.split('.').forEach(key => {
      let tmp = [];
      refs.forEach(r => {
        /* istanbul ignore else */
        if (r) {
          if (key === '[]' && Array.isArray(r)) {
            tmp = tmp.concat(r);
          } else {
            tmp.push(r[key]);
          }
        }
      });
      refs = tmp;
    });

    return refs.filter(r => r);
  }

  _walk(source, rules, cb) {
    this._walkRules(rules, (path, ruleValue) => {
      let parts = path.split('.');
      let last = parts.pop();
      path = parts.join('.');

      this._resolveRefs(source, path).forEach(ref => cb(ref, path, last, ruleValue));
    });
  }

  _applyAlias(source, rules) {
    this._walk(source, rules, (ref, path, last, ruleValue) => {
      if (typeof ruleValue !== 'string')
        throw new SyntaxError('Expect string value for alias.');
      ref[ruleValue] = ref[last];
      delete ref[last];
    });
    return source;
  }

  _applyComputed(source, rules) {
    this._walk(source, rules, (ref, path, last, ruleValue) => {
      if (typeof ruleValue !== 'function')
        throw new SyntaxError('Expect function value for computed.');
      ref[last] = ruleValue.call(source, ref, source);
    });
    return source;
  }

  _applyMap(source, mapFn) {
    return typeof mapFn === 'function' ? mapFn(source) : source;
  }

  _applyNaming(source, naming) {
    return naming ? transform(source, {naming}) : source;
  }

  _map(source, target) {
    target.order.forEach(key => {
      let fnKey = '_apply' + key.charAt(0).toUpperCase() + key.slice(1);

      /* istanbul ignore else */
      if (fnKey in this) {
        source = this[fnKey](source, target[key]);
      }

    });
    return source;
  }

  _generateRequestTransformData(route, http) {
    let ea = STORAGE.__ea ? JSON.parse(STORAGE.__ea) : {};

    location.search.slice(1).split('&').reduce((ea, pair) => {
      let [key, value] = pair.split('=').map(decodeURIComponent);
      if (key !== this.prefix && key.indexOf(this.prefix) === 0) ea[key] = value;
      return ea;
    }, ea);

    STORAGE.__ea = JSON.stringify(ea);

    return {
      mock: route.mock,
      params: http.params,
      query: http.query,
      data: http.data,
      ea: ea
    };
  }

  _generateRequestHttpAndTransformData(key, userParams, route) {
    let {path, query, data, params} = this._applyUserParams(userParams, route);
    let http = util.extend(true, {}, route.http);

    if (['GET', 'HEAD', 'DELETE'].indexOf(http.method) >= 0) {
      data = {};
    } else {
      data = this._map(data, route.request);
    }

    http.params = params;
    http.query = query;
    http.data = data;

    let mock = route.mock;
    let transformData = this._generateRequestTransformData(route, http);

    /* istanbul ignore else */
    if (mock) {
      if (mock !== 'memory') {
        transformData = JSON.stringify(transformData);
        query.__ea = key;

        // cookie 不支持跨域，但在 karma 上只能测试到跨域
        /* istanbul ignore if */
        if (!mock.server && route.dataTransformMethod === 'cookie') {
          document.cookie = '__ea' + key + '='
            + encodeURIComponent(transformData)
            + '; expires=' + (new Date(Date.now() + 5000).toUTCString())
            + '; path=/';
        } else {
          query.__eaData = transformData;
        }
      }
    }

    let qs = util.buildQuery(query);
    http.url = path + (qs ? '?' + qs : '');

    if (mock && mock.server && !/^https?:\/\//.test(http.url)) {
      http.crossOrigin = true;
      http.url = util.urlNormalize(mock.server + http.url);
    }

    if (route.emulateHTTP && !http.crossOrigin && /^(PUT|PATCH|DELETE)$/.test(http.method)) {
      http.headers['X-HTTP-Method-Override'] = http.method;
      http.method = 'POST';
    }

    if (route.emulateJSON) {
      http.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      data = util.urlParams(data);
    }

    http.data = http.body = data;

    return {http, transformData};
  }

  _generateRequestCacheCallback(cacheKey, callback) {
    let {cacheMap, cacheStack, cacheSize} = this.global;

    return (err, data) => {
      if (!err) {
        cacheMap[cacheKey] = data;
        cacheStack.push(cacheKey);
        if (cacheSize > 0 && cacheStack.length > cacheSize) {
          delete cacheMap[cacheStack.shift()];
        }
      }
      callback(err, data);
    };
  }

  _delay(delay, callback) {
    if (util.isObject(delay)) {
      delay = util.extend({min: 200, max: 3000}, delay);
      delay = Math.floor(Math.random() * (delay.max - delay.min) + delay.min);
    }

    setTimeout(() => callback(), delay > 0 ? delay : 0);
  }

  // 这个 route 是所有请求都会共享的对象，所以不要随意修改上面已经存在的值
  _generateRequestFunction(key, route) {
    return (userParams, cb) => {
      let {http, transformData} = this._generateRequestHttpAndTransformData(key, userParams, route);
      let cacheKey, cacheMap;

      // 这时的 data 可能并不是一个对象，也有可能是个数组或其它
      let callback = (err, data) => {
        if (data) {
          data = util.deepClone(data); // 避免在 mock = memory 模式下，数据混乱
          data = this._map(data, route.response);
        }
        cb(err, data);
      };

      if (route.cache) {
        cacheKey = JSON.stringify([http.url, http.method, http.data]);
        cacheMap = this.global.cacheMap;
        if (cacheKey in cacheMap) return callback(null, cacheMap[cacheKey]);

        callback = this._generateRequestCacheCallback(cacheKey, callback);
      }

      if (route.mock === 'memory') {
        this._delay(route.mockDelay, () => mockResponse(this.mocks, key, transformData, (error, data) => {
          route.handler({error, data}, callback);
        }));
      } else {
        route.handler(http, callback);
      }
    };
  }

  _batchSeriesRequest(arr, conf, callback) {
    let index = 0;

    let lastError = null, lastData = null;
    let iterator = conf.iterator /* istanbul ignore next */|| util.emptyFunction;
    let iteratorResult;

    let next = () => {
      let key = arr[index++];
      if (key) {
        iteratorResult = iterator(key, index - 1, lastError, lastData);
        if (iteratorResult === false) return callback(lastError, lastData);

        this.request(key, iteratorResult, (err, data) => {
          lastError = err;
          lastData = data;
          next();
        });
      } else {
        callback(lastError, lastData);
      }
    };

    next();
  }

  _batchParallelRequest(obj, conf, callback) {
    let keys = Object.keys(obj), len = keys.length;

    let errMap = {}, dataMap = {}, hasError = false;
    let iterator = conf.iterator || util.emptyFunction;

    keys.forEach(key => {
      let params = obj[key];
      this.request(conf.alias && conf.alias[key] || key, params, (err, data) => {
        len--;

        iterator(params, key, err, data);

        if (err) {
          hasError = true;
          errMap[key] = err;
        } else {
          dataMap[key] = data;
        }

        if (!len) {
          callback(hasError ? errMap : null, dataMap);
        }
      });
    });
  }

  _singleRequest(key, params, callback) {
    return this.routes[key](params, callback);
  }

  api(key, option, mockOption) {
    option = util.isObject(option) ? option : {};

    // extend 之前要将 options 中的 query 和 data 转化成 Object
    this._normalizeRouteQueryAndData(option);

    let route = util.extend(true, {}, this.baseOptions, option);

    this._normalizeRouteHTTP(route);

    route.cache = route.cache === true || route.cache === 'smart' && route.http.method === 'GET';

    this.routes[key] = this._generateRequestFunction(key, route);

    if (mockOption) this.mock(key, mockOption);
  }

  mock(key, option) {
    this.mocks[key] = option;
  }

  request(source, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = {};
    }

    params = params || {};
    if (typeof callback !== 'function') callback = util.emptyFunction;

    if (typeof source === 'string') return this._singleRequest(source, params, callback);
    else if (Array.isArray(source)) return this._batchSeriesRequest(source, params, callback);
    else if (util.isObject(source)) return this._batchParallelRequest(source, params, callback);

    throw new SyntaxError('Illegal arguments.');
  }
}
