import defaultHttpOptions from './defaultHttpOptions';
import transform from 'naming-transform';
import util from './util';


export default class ElegantApi {

  constructor(baseOptions, mockOptions) {
    baseOptions = util.extend(true, {}, defaultHttpOptions, baseOptions);

    this.baseOptions = baseOptions;

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

    http.path = (route.base + route.path).replace(/(?:[^:])\/\//g, '\/');
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
   * 通过用户指定的 params 和 route 中的要求，得到接口需要的 params
   *
   *  - 如果 params 中不存在 query 和 data 字段，则自动从 params 中取出需要的 query，再把剩下的全交给 data
   *  - 否则 params 中需要指定 query 和 data
   */
  _applyUserParams(params, route) {
    let query = params.query || {}, data = params.data || {};

    if (!params.query && !params.data) {
      let queryKeys = Object.keys(route.query).map(key => route.query[key].alias || key);

      for (let key in params) {
        if (queryKeys.indexOf(key) >= 0) query[key] = params[key];
        else data[key] = params[key];
      }
    }
    this._checkUserParams(query, route.query);
    this._checkUserParams(data, route.data);

    return {query, data};
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


  _generateRequestHttp(key, params, route) {
    let {query, data} = this._applyUserParams(params, route);
    let http = util.extend(true, {}, route.http);

    /* istanbul ignore else */
    if (route.mock) query.__ea = key;

    let qs = util.buildQuery(query);
    http.url = http.path + (qs ? '?' + qs : '');

    data = this._map(data, route.request);

    if (route.emulateHTTP && !http.crossOrigin && /^(PUT|PATCH|DELETE)$/.test(http.method)) {
      http.headers['X-HTTP-Method-Override'] = http.method;
      http.method = 'POST';
    }

    if (route.emulateJSON && route.mock !== 'local') {
      http.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      data = util.urlParams(data);
    }

    http.data = http.body = data;
    http.query = query;

    return http;
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


  _generateRequestResponse(route, key, http, callback) {
    if (route.mock === 'local') {
      this._delay(route.mockDelay, () => this.responseMock(key, http, callback));
    } else {
      if (/^mock/.test(route.mock)) {
        document.cookie = '__ea=' + JSON.stringify(http) + '; path=/';
      }
      route.handler(http, callback);
    }
  }

  _generateRequestFunction(key, route) {
    return (params, cb) => {
      let http = this._generateRequestHttp(key, params, route);
      let cacheKey, cacheMap;

      let callback = (err, data) => {
        if (data) {
          data = util.extend(true, {}, data); // 避免在 mock = local 模式下，数据混乱
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

      this._generateRequestResponse(route, key, http, callback);
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
      this.request(key, params, (err, data) => {
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

  responseMock(key, http, callback) {
    let target = this.mocks[key];

    if (!(key in this.mocks)) callback(new Error(`Not found "${key}" in mocks options.`));
    else if (typeof target === 'function') target(http, callback);
    else callback(null, target);
  }

  api(key, option, mockOption) {
    let route = util.extend(true, {}, this.baseOptions, option);
    this._normalizeRouteHTTP(route);
    this._normalizeRouteQueryAndData(route);
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
