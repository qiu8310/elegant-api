import transform from 'naming-transform';

const util = require('./libs/util');
import defaultOptions from './libs/defaultOptions';
import {
  formatRootOptions,
  formatInitialRoute,
  formatRealtimeRoute,
  formatResource,
  reverseResource
} from './libs/Formater';

import mockResponse from '../plugins/mock';

let STORAGE = window.localStorage /* istanbul ignore next */ || {};

/**
 * @class ElegantApi
 */
export default class ElegantApi {
  constructor(options, mockOptions) {
    let rootOptions = util.extend(true, {}, defaultOptions, options);

    let {globals, routes, resources, mocks} = rootOptions;
    delete rootOptions.globals;
    delete rootOptions.routes;
    delete rootOptions.resources;
    delete rootOptions.mocks;

    rootOptions = formatRootOptions(rootOptions);

    this.globals = globals;
    this.routes = util.mapObject(routes, (route, key) =>
      formatInitialRoute(key, util.objectify(route), rootOptions));
    this.resources = util.mapObject(resources, formatResource);
    this.responseResources = util.mapObject(this.resources, reverseResource);
    this.mocks = mockOptions || mocks;
    this.apis = {};
    util.each(this.routes, route => this.apis[route.name] = this._generateApi(route));
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

    let map = Object.keys(config).reduce((map, rKey) => {
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

      if (oldVal == null) oldVal = conf.defaultValue;

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
    let http = route.http;
    let cacheKey = JSON.stringify([route.name, http.params, http.query]);

    let {cacheSize, cacheMap, cacheStack} = this.globals;

    if (cacheKey in cacheMap) {
      cb(null, cacheMap[cacheKey]);
      return false;
    } else {
      return (err, data) => {
        if (!err) {
          cacheMap[cacheKey] = data;
          cacheStack.push(cacheKey);
          if (cacheSize > 0 && cacheStack.length > cacheSize) {
            delete cacheMap[cacheStack.shift()];
          }
        }
        cb(err, data);
      };
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
    let {mock, http} = route;

    let qs = util.buildQuery(http.query);
    http.url = http.path + (qs ? '?' + qs : '');

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

    http.body = http.data;
  }

  _generateApi(route) {
    return (userArgs, cb) => {
      // 返回的是一个全新的 route，其中 route.http.{path, params, query, data} 都是计算后的
      try {
        route = formatRealtimeRoute(route, userArgs);
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

      let transformData = this._generateApiTransformData(route);

      if (!mock.disabled && !mock.memory) {
        transformData = JSON.stringify(transformData);
        http.query.__ea = route.name;

        // cookie 不支持跨域，但在 karma 上只能测试到跨域
        if (!mock.server && route.dataTransformMethod === 'cookie') {
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
    if (mock.memory) {
      setTimeout(() => {
        mockResponse(this.mocks, route.name, transformData, (error, data) => {
          route.handle({http, error, data}, cb);
        });
      }, mock.delay);
    } else {
      route.handle({http}, cb);
    }
  }

  _generateApiTransformData(route) {
    let ea = STORAGE.__ea ? JSON.parse(STORAGE.__ea) : {};

    let prefix = this.globals.eaQueryPrefix;
    let http = route.http;

    let search;

    /* istanbul ignore else */
    if (process.env.NODE_ENV === 'test') {
      search = route.__search || ''; // only for test
    } else {
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

  request(source, params, callback) {
    if (typeof params === 'function') callback = params;

    // 保证参数类型
    params = util.objectify(params);
    if (typeof callback !== 'function') callback = util.emptyFunction;

    let end = callback => {
      if (typeof source === 'string') return this._singleRequest(source, params, callback);
      else if (util.isArray(source)) return this._batchSeriesRequest(source, params, callback);
      else if (util.isObject(source)) return this._batchParallelRequest(source, params, callback);

      callback(new SyntaxError('Illegal arguments.'));
    };

    if (window.Promise) {
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

  _singleRequest(key, params, callback) {
    if (this.apis[key]) return this.apis[key](params, callback);
    callback(new Error(`Request key '${key}' not exists.`));
  }

  _batchSeriesRequest() {}
  _batchParallelRequest() {}
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
