import transform from 'naming-transform';
import defaultOptions from './libs/defaultOptions';
import {mixin} from './libs/mockHelper';

const util = require('./libs/util');
const mockResponse = require('../plugins/mock');
const isServer = typeof window === 'undefined';

import {
  decodeUserData,
  formatRootOptions,
  formatInitialRoute,
  formatRealtimeRoute,
  formatResource,
  reverseResource
} from './libs/Formater';


let STORAGE;
try { // IE 8 下直接调用 window.localStorage 会报错
  localStorage.setItem('_ea', '_ea');
  localStorage.removeItem('_ea');
  STORAGE = localStorage;
} catch (e) { STORAGE = {}; }

/**
 * @class ElegantApi
 */
module.exports = class ElegantApi {
  constructor(options, mockOptions) {
    let rootOptions = util.extend(true, {}, defaultOptions, options);

    let {globals, routes, resources, mocks} = rootOptions;
    delete rootOptions.globals;
    delete rootOptions.routes;
    delete rootOptions.resources;
    delete rootOptions.mocks;

    rootOptions = formatRootOptions(rootOptions);

    this.globals = globals;
    this.mocks = mockOptions || mocks;
    // 支持用户只写 mocks 而不写 routes 的情况
    util.each(this.mocks, (mock, key) => { if (!(key in routes && key !== '$default')) routes[key] = {}; });
    mixin(this.mocks);

    this.routes = util.mapObject(routes, (route, key) =>
      formatInitialRoute(key, util.objectify(route), rootOptions));
    this.resources = util.mapObject(resources, formatResource);
    this.responseResources = util.mapObject(this.resources, reverseResource);

    this.apis = {};

    // removeCache 之后会将 routeName 写入此对象中，
    // 这样下将再请求此 routeName 时，就会自动在 url 上加上个随机参数（可以避免 IE 6/7 的 GET 缓存）
    this._needReloadRouteNameMap = {};

    util.each(this.routes, route => this.apis[route.name] = this._generateApi(route));

    /* istanbul ignore next */
    if (__DEBUG__) {
      console.warn('You are using a debug version of elegant-api, '
        + 'you can switch to production version by using elegant-api.min.js');
    }
  }

  // 下面几个以 _apply 全是 _transform 相关的函数
  _apply(source, config, type) {
    let order = config.order || ['resource', 'alias', 'computed', 'drop', 'map', 'naming'];
    order.forEach(key => {
      let fnKey = '_apply' + key.charAt(0).toUpperCase() + key.slice(1);

      if (fnKey in this) {
        source = this[fnKey](source, config[key], type);
      }
    });
    return source;
  }
  _applyResource(source, config, type) {
    if (!config) return source;

    let map = util.objectKeys(config).reduce((map, rKey) => {
      let resource = this.resources[rKey];
      let paths = [].concat(config[rKey]);
      if (!resource) throw new Error(`Resource ${rKey} not exists.`);

      paths.forEach(path => {
        resolveRefs(source, path).forEach(ref => {
          if (util.isObject(ref)) this[`_${type}Resource`](ref, resource, rKey);
        });
      });
      return map;
    }, {});
    return source;
  }

  // 不需要返回，obj 是引用
  _requestResource(obj, resource) {
    let removes = [];
    util.each(resource, (conf, key) => {
      let oldVal = obj[key];
      let aliasKey = key;

      if (conf.alias && conf.alias !== key) {
        removes.push(key);
        aliasKey = conf.alias;
      }

      if (oldVal === undefined) oldVal = conf.defaultValue;

      obj[aliasKey] = conf.write ? conf.write.call(obj, oldVal) : oldVal;
    });

    util.each(removes, (key) => delete obj[key]);
  }

  _responseResource(obj, resource, resourceKey) {
    resource = this.responseResources[resourceKey];
    this._requestResource(obj, resource);
  }

  _applyAlias(source, rules) {
    walk(source, rules, (ref, path, last, ruleValue) => {
      if (typeof ruleValue !== 'string')
        throw new SyntaxError('Expect string value for alias.');
      if (last in ref) {
        ref[ruleValue] = ref[last];
        delete ref[last];
      }
    });
    return source;
  }
  _applyComputed(source, rules) {
    walk(source, rules, (ref, path, last, ruleValue) => {
      if (typeof ruleValue !== 'function')
        throw new SyntaxError('Expect function value for computed.');
      ref[last] = ruleValue.call(ref, ref, source);
    });
    return source;
  }
  _applyDrop(source, rules) {
    if (typeof rules === 'string') rules = {[rules]: true};
    else if (util.isArray(rules)) rules = rules.reduce((r, k) => { r[k] = true; return r; }, {});
    // @TODO 可能是一个含有数组的对象
    if (util.isObject(rules)) {
      walk(source, rules, (ref, path, last) => {
        /* istanbul ignore else */
        if (last in ref) delete ref[last];
      });
    }
    return source;
  }
  _applyMap(source, mapFn) {
    return typeof mapFn === 'function' ? mapFn(source) : source;
  }
  _applyNaming(source, config) {
    if (typeof config === 'string') config = {case: config};
    if (!util.isObject(config)) return source;
    config.naming = config.case;
    return transform(source, config);
  }


  /**
   * 中间件：判断是否需要使用缓存
   * @param  {Object}   route
   * @param  {Function} cb
   * @return {Function}
   * @private
   */
  _cache(route, cb) {
    let cache = this._getCache(route);
    if (cache.exists) {
      cb(null, cache.value);
      return false;
    } else {
      return (err, data) => {
        if (!err) {
          this._setCache(route, data);
        }
        cb(err, data);
      };
    }
  }

  /**
   * 删除指定的 routeNames 上的缓存
   * @param  {String|Array} routeNames
   */
  removeCache(routeNames) {
    if (!routeNames) return false;

    let {cacheMap, cacheStack} = this.globals;
    let keys = [].concat(routeNames);

    keys.forEach(k => {
      this._needReloadRouteNameMap[k] = true;
      delete cacheMap[k];
    });
    this.globals.cacheStack = cacheStack.filter(c => keys.indexOf(c[0]) < 0);
  }


  _getCache(route) {
    let {cacheMap} = this.globals;
    let {name, http} = route, key;

    let exists = false, value = null;

    if (name in cacheMap) {
      cacheMap = cacheMap[name];
      key = JSON.stringify([http.params, http.query]);
      exists = key in cacheMap;
      value = cacheMap[key];
    }

    /* istanbul ignore next */
    if (__DEBUG__ && route.mock.debug) {
      console.debug('EA:(cache) check %s %o, %sexists!',
        name, {key, keys: util.objectKeys(cacheMap)}, exists ? '' : 'not ');
    }

    return {exists, value};
  }

  _setCache(route, data) {
    let {cacheSize, cacheMap, cacheStack} = this.globals;
    let {name, http} = route;

    let ref = cacheMap[name] || {},
      key = JSON.stringify([http.params, util.omit(http.query, ['__ea', '__eaData'])]);

    /* istanbul ignore next */
    if (__DEBUG__ && route.mock.debug) {
      console.debug('EA:(cache) set %s %o', name, {key, cacheMap});
    }

    ref[key] = data;
    cacheMap[name] = ref;
    cacheStack.push([name, key]);

    if (cacheSize > 0 && cacheStack.length > cacheSize) {
      let [n, k] = cacheStack.shift();
      cacheMap[n] && delete cacheMap[n][k];
    }
  }

  /**
   * 中间件：对 request 的 data 和 response 的 data 进行转化
   * @param  {Object}   route
   * @param  {Function} cb
   * @return {Function}
   * @private
   */
  _transform(route, cb) {
    let http = route.http;
    http.data = this._apply(http.data, route.request, 'request');

    return (err, data) => {
      if (err) return cb(err, data);
      try {
        // 要深拷贝，防止用户修改返回的数据
        data = this._apply(util.deepClone(data), route.response, 'response');
        this.removeCache(route.removeCache);
        cb(err, data);
      } catch (err) {
        cb(err);
      }
    }
  }

  /**
   * 对 http 对象进行处理
   * @param  {Object} route
   * @private
   */
  _emulate(route) {
    let {mock, http, name} = route;

    let qs = util.buildQuery(http.query);
    http.url = util.appendQuery(http.path, qs);

    if (!route.cache || this._needReloadRouteNameMap[name]) {
      http.url = util.appendQuery(http.url, this.globals.cacheQueryKey + '=' + (new Date().getTime()));
      delete this._needReloadRouteNameMap[name];
    }

    if (mock.server && !/^https?:\/\//.test(http.url)) {
      http.crossOrigin = true;
      http.url = util.urlNormalize(mock.server + http.url);
    }

    if (route.emulateHTTP && !http.crossOrigin && /^(PUT|PATCH|DELETE)$/.test(http.method)) {
      http.headers['X-HTTP-Method-Override'] = http.method;
      http.method = 'POST';
    }

    if (route.emulateJSON) {
      http.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      http.data = util.buildQuery(http.data);
    }
  }

  _generateApi(initRoute) {
    return (userArgs, userRoute, cb) => {
      let route;
      // 返回的是一个全新的 route，其中 route.http.{path, params, query, data} 都是计算后的
      try {
        route = formatRealtimeRoute(initRoute, userArgs, userRoute);
      } catch (e) {
        return cb(e);
      }


      let {mock, http} = route;
      cb = this._transform(route, cb);

      // cache
      if (route.cache) {
        cb = this._cache(route, cb);
        if (cb === false) return false; // 说明直接使用了缓存的数据
      }
      // 下面的步骤不能对 query 和 params 处理，否则会影响 cache, (__ea 和 __eaData 参数除外)

      http.body = http.data = decodeUserData(http.data);
      let transformData = this._generateApiTransformData(route);

      if (!mock.disabled && !mock.memory) {
        transformData = JSON.stringify(transformData);
        http.query.__ea = route.name;

        // cookie 不支持跨域，但在 karma 上只能测试到跨域
        if (!mock.server && route.dataTransformMethod === 'cookie' && !isServer) {
          document.cookie = '__ea' + route.name + '='
            + encodeURIComponent(transformData)
            + '; expires=' + (new Date(Date.now() + 5000).toUTCString())
            + '; path=/';
        } else {
          http.query.__eaData = transformData;
        }
      }

      this._emulate(route);
      this._response(route, transformData, cb);
    };
  }

  _response(route, transformData, cb) {
    let {mock, http} = route;

    /* istanbul ignore next */
    if (__DEBUG__ && mock.debug) {
      console.debug('EA:(response) route: %o, transformData %o', route, transformData);
    }

    let memoryHandle = () => {
      mockResponse(this.mocks, route.name, transformData, (error, data) => {
        route.handle({http, error, data}, cb);
      });
    };

    if (mock.memory) {
      // 如果是 0，说明用户不想要异步，这样可以快速得到数据
      if (mock.delay === 0) {
        memoryHandle();
      } else {
        setTimeout(memoryHandle, mock.delay);
      }
    } else {
      route.handle({http}, cb);
    }
  }

  _generateApiTransformData(route) {
    let ea = STORAGE.__ea ? JSON.parse(STORAGE.__ea) : {};

    let prefix = this.globals.eaQueryPrefix;
    let http = route.http;

    let search = '';

    /* istanbul ignore else */
    if (process.env.NODE_ENV === 'test') {
      search = route.__search || ''; // only for test
    } else if (!isServer) {
      search = location.search.slice(1);
    }

    search.split('&').reduce((ea, pair) => {
      let [key, value] = pair.split('=').map(decodeURIComponent);
      if (key !== prefix && key.indexOf(prefix) === 0) ea[key.substr(prefix.length)] = value;
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

  request(source, params, config, callback) {
    if (typeof params === 'function') callback = params;
    else if (typeof config === 'function') callback = config;

    // 保证参数类型
    params = util.objectify(params);
    config = util.objectify(config);
    if (typeof callback !== 'function') callback = util.emptyFunction;

    let end = callback => {
      if (typeof source === 'string') return this._singleRequest(source, params, config, callback);
      else if (util.isArray(source)) return this._batchSeriesRequest(source, params, config, callback);
      else if (util.isObject(source)) return this._batchParallelRequest(source, params, config, callback);

      callback(new SyntaxError('Illegal arguments.'));
    };

    if (typeof Promise !== 'undefined') {
      return new Promise((resolve, reject) => {
        end((err, data) => {
          if (err) reject(err);
          else resolve(data);
          callback(err, data);
        });
      });
    } else {
      end(callback);
    }
  }

  _singleRequest(key, params, config, callback) {
    if (this.apis[key]) return this.apis[key](params, config, callback);
    callback(new Error(`Request key '${key}' not exists.`));
  }

  _batchSeriesRequest(arr, conf, config, callback) {
    let index = 0;

    let lastError = null, lastData = null;
    let iterator = conf.iterator /* istanbul ignore next */|| util.emptyFunction;
    let iteratorResult;

    let next = () => {
      let key = arr[index++];
      if (key) {
        iteratorResult = iterator(key, index - 1, lastError, lastData);
        if (iteratorResult === false) return callback(lastError, lastData);

        this.request(key, iteratorResult, config[key], (err, data) => {
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

  _batchParallelRequest(obj, conf, config, callback) {
    let keys = Object.keys(obj), len = keys.length;

    let errMap = new Error('MAP_ERROR'), dataMap = {}, hasError = false;
    let iterator = conf.iterator || util.emptyFunction;

    keys.forEach(key => {
      let params = obj[key];
      let requestKey = conf.alias && conf.alias[key] || key;
      this.request(requestKey, params, config[requestKey], (err, data) => {
        len--;

        iterator(params, key, err, data);

        if (err) {
          hasError = true;
          errMap[key] = err;
          /* istanbul ignore next */
          if (err.message) errMap.message = err.message; // 和 single request 一致，方便统一处理错误
        } else {
          dataMap[key] = data;
        }

        if (!len) {
          callback(hasError ? errMap : null, dataMap);
        }
      });
    });
  }
}

/**
 * 遍历指定的规则，主要用在 _applyAlias 和 _applyComputed 中
 */
function walkRules(rules, cb, prefix) {
  for (let key in rules) {
    let path = prefix ? prefix + '.' + key : key;
    if (util.isObject(rules[key])) {
      walkRules(rules[key], cb, path);
    } else {
      cb(path, rules[key]);
    }
  }
}

function resolveRefs(source, path) {
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

function walk(source, rules, cb) {
  walkRules(util.objectify(rules), (path, ruleValue) => {
    let parts = path.split('.');
    let last = parts.pop();
    path = parts.join('.');

    resolveRefs(source, path).forEach(ref => cb(ref, path, last, ruleValue));
  });
}
