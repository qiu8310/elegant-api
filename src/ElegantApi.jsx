import transform from 'naming-transform';

const util = require('./libs/util');
import defaultOptions from './libs/defaultOptions';
import {
  formatRootOptions,
  formatInitialRoute,
  formatRealtimeRoute,
  formatResource
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
    this.mocks = mockOptions || mocks;
    this.apis = {};
    util.each(this.routes, route => this.apis[route.name] = this._generateApi(route));
  }

  applyResource() {}
  applyAlias() {}
  applyComputed() {}
  applyDrop() {}
  applyMap() {}
  applyNaming() {}
  apply(data, config) { return data; }

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
      cb(null, util.deepClone(cacheMap[cacheKey])); // 要深拷贝，防止用户修改返回的数据
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
    http.data = this.apply(http.data, route.request);

    return (err, data) => {
      if (!err) data = this.apply(data, route.response);
      cb(err, data);
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
      route = formatRealtimeRoute(route, userArgs);

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
      if (window.Promise) {
        return new Promise((resolve, reject) => {
          this._response(route, transformData, this._promisify(cb, resolve, reject));
        });
      } else {
        this._response(route, transformData, cb);
      }

    };
  }

  // 同时执行 promise 和 callback，所以在使用的时候只要使用一种方法即可
  _promisify(cb, resolve, reject) {
    return (err, data) => {
      if (err) reject(err);
      else resolve(data);
      cb(err, data);
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


    if (typeof source === 'string') return this._singleRequest(source, params, callback);
    else if (util.isArray(source)) return this._batchSeriesRequest(source, params, callback);
    else if (util.isObject(source)) return this._batchParallelRequest(source, params, callback);

    throw new SyntaxError('Illegal arguments.');
  }

  _singleRequest(key, params, callback) {
    if (this.apis[key]) return this.apis[key](params, callback);
    throw new Error(`Request key '${key}' not exists.`);
  }

  _batchSeriesRequest() {}
  _batchParallelRequest() {}
}
