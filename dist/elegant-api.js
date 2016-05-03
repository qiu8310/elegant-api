(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["elegantApi"] = factory();
	else
		root["elegantApi"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var util = __webpack_require__(1);
	var ElegantApi = __webpack_require__(2);
	
	module.exports = function (httpOptions, mockOptions) {
	  var ea = new ElegantApi(httpOptions, mockOptions);
	  var result = {};
	
	  util.objectKeys(ea.routes).forEach(function (key) {
	    result[key] = function () {
	      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	        args[_key] = arguments[_key];
	      }
	
	      return ea.request.apply(ea, [key].concat(args));
	    };
	  });
	
	  result.$ea = ea;
	  result.$request = function () {
	    return ea.request.apply(ea, arguments);
	  };
	  result.$r = result.$resource = function (key) {
	    var res = ea.resources[key];
	    return res ? Object.keys(res).reduce(function (result, key) {
	      var val = res[key].defaultValue;
	      result[key] = val === undefined ? null : val;
	      return result;
	    }, {}) : {};
	  };
	
	  return result;
	};
	
	module.exports.ElegantApi = ElegantApi;

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	
	exports.__esModule = true;
	exports.emptyFunction = emptyFunction;
	exports.objectKeys = objectKeys;
	exports.toString = toString;
	exports.isObject = isObject;
	exports.isArray = isArray;
	exports.objectify = objectify;
	exports.each = each;
	exports.mapObject = mapObject;
	exports.deepClone = deepClone;
	exports.omit = omit;
	exports.extend = extend;
	exports.buildQuery = buildQuery;
	exports.urlNormalize = urlNormalize;
	exports.appendQuery = appendQuery;
	/**
	 * 只是一个空函数，什么也不做
	 */
	function emptyFunction() {}
	
	/**
	 * 获取对象中的 keys，兼容 IE 7/8
	 *
	 * @param  {Object} obj
	 * @return {Array}
	 */
	function objectKeys(obj) {
	  return obj ? Object.keys(obj) : [];
	}
	
	/**
	 * 调用 Object 原型链上的 toString 方法来获取任意变量的原生的 string 形式
	 * @param  {*} o 任意变量
	 * @return {String}
	 */
	function toString(o) {
	  return Object.prototype.toString.call(o);
	}
	
	/**
	 * 判断某一变量是否是一个 Object
	 * @param  {*} o
	 * @return {Boolean}
	 */
	function isObject(o) {
	  return toString(o) === '[object Object]';
	}
	
	/**
	 * 判断某一变量是否是一个 Array
	 * @param  {*} o
	 * @return {Boolean}
	 */
	function isArray(o) {
	  return Array.isArray(o);
	}
	
	/**
	 * 确保变量是一个 Object，如果不是，则返回空 Object
	 * @param  {*} o
	 * @return {Boolean}
	 */
	function objectify(o) {
	  return isObject(o) ? o : {};
	}
	
	/**
	 * 遍历对象或数组，如果是其它数据类型，直接忽略
	 * @param  {Object|Array|*}   obj
	 * @param  {Function} cb
	 */
	function each(obj, cb) {
	  if (isArray(obj)) {
	    for (var i = 0; i < obj.length; i++) {
	      cb(obj[i], i, obj);
	    }
	  } else if (isObject(obj)) {
	    objectKeys(obj).forEach(function (key) {
	      return cb(obj[key], key, obj);
	    });
	  }
	}
	
	/**
	 * 将一个对象转化成另一个对象，keys 不变
	 * @param  {Object}   obj
	 * @param  {Function} fn - 遍历函数，参数是 (item, key, obj)
	 * @return {Object}
	 */
	function mapObject(obj, fn) {
	  return objectKeys(obj).reduce(function (result, key) {
	    result[key] = fn(obj[key], key, obj);
	    return result;
	  }, {});
	}
	
	/**
	 * 深度克隆任意参数，主要针对于 Object|Array 和基本数据类型
	 * @param  {Object|Array|Number|String|Boolean} obj
	 * @return {Object|Array|Number|String|Boolean}
	 */
	function deepClone(obj) {
	  var result = undefined;
	  if (isObject(obj)) {
	    result = {};
	  } else if (Array.isArray(obj)) {
	    result = [];
	  } else {
	    return obj;
	  }
	
	  each(obj, function (val, key) {
	    return result[key] = deepClone(val);
	  });
	  return result;
	}
	
	/**
	 * 从一个对象中忽略指定的 keys， 并将剩下的 keys 组成的一个新的 Object
	 * @param  {Object} obj
	 * @param  {Array|String} keys
	 * @return {Object}
	 */
	function omit(obj, keys) {
	  keys = [].concat(keys);
	  return Object.keys(obj).reduce(function (res, key) {
	    if (keys.indexOf(key) < 0) res[key] = obj[key];
	    return res;
	  }, {});
	}
	
	/**
	 * 对象继承
	 * @param {Boolean} [deep] 是否深度继承
	 * @param {Object} src
	 * @param {Object} target...
	 * @return {Object}
	 */
	function extend() {
	  var deep = false,
	      args = [].slice.call(arguments);
	  if (typeof args[0] === 'boolean') deep = args.shift();
	
	  var src = args.shift() || {},
	      target = undefined;
	
	  for (var i = 0; i < args.length; i++) {
	    target = args[i];
	
	    if (!isObject(target) && !isArray(target)) continue;
	
	    if (toString(src) !== toString(target)) {
	      src = deepClone(target);
	    } else {
	      /*eslint-disable */
	      each(target, function (val, key) {
	        if (deep && (isObject(val) || isArray(val))) {
	          src[key] = extend(deep, src[key], val);
	        } else {
	          src[key] = val;
	        }
	      });
	      /*eslint-enable */
	    }
	  }
	
	  return src;
	}
	
	/**
	 * 将对象转化成 url 的 query string
	 * @param  {Object} query
	 * @return {String}
	 */
	function buildQuery(query) {
	  var params = [];
	  params.add = function (key, value) {
	    if (value == null) value = '';
	    this.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
	  };
	  _serialize(params, query);
	  return params.join('&');
	}
	
	function _serialize(params, obj, scope) {
	  var array = isArray(obj),
	      plain = isObject(obj),
	      hash = undefined;
	
	  each(obj, function (value, key) {
	    hash = isObject(value) || isArray(value);
	
	    if (scope) key = scope + '[' + (plain || hash ? key : '') + ']';
	
	    if (!scope && array) {
	      params.add(value.name, value.value);
	    } else if (hash) {
	      _serialize(params, value, key);
	    } else {
	      params.add(key, value);
	    }
	  });
	}
	
	/**
	 * 更正 url：主要就是去除多余的 /
	 * @param  {String} url
	 * @return {String}
	 */
	function urlNormalize(url) {
	  return url.replace(/(?:[^:])\/\//g, '\/');
	}
	
	/**
	 * 给 URL 添加 query 字符串
	 * @param  {String} url
	 * @param  {String} query
	 * @return {String}
	 */
	function appendQuery(url, query) {
	  if (query === '') return url;
	  var parts = url.split('#');
	  return (parts[0] + '&' + query).replace(/[&?]{1,2}/, '?') + (parts.length === 2 ? '#' + parts[1] : '');
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _namingTransform = __webpack_require__(3);
	
	var _namingTransform2 = _interopRequireDefault(_namingTransform);
	
	var _defaultOptions = __webpack_require__(4);
	
	var _defaultOptions2 = _interopRequireDefault(_defaultOptions);
	
	var _mockHelper = __webpack_require__(5);
	
	var _Formater = __webpack_require__(6);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var util = __webpack_require__(1);
	var mockResponse = __webpack_require__(7);
	
	var STORAGE = undefined;
	try {
	  // IE 8 下直接调用 window.localStorage 会报错
	  localStorage.setItem('_ea', '_ea');
	  localStorage.removeItem('_ea');
	  STORAGE = localStorage;
	} catch (e) {
	  STORAGE = {};
	}
	
	/**
	 * @class ElegantApi
	 */
	module.exports = (function () {
	  function ElegantApi(options, mockOptions) {
	    var _this = this;
	
	    _classCallCheck(this, ElegantApi);
	
	    var rootOptions = util.extend(true, {}, _defaultOptions2["default"], options);
	
	    var _rootOptions = rootOptions;
	    var globals = _rootOptions.globals;
	    var routes = _rootOptions.routes;
	    var resources = _rootOptions.resources;
	    var mocks = _rootOptions.mocks;
	
	    delete rootOptions.globals;
	    delete rootOptions.routes;
	    delete rootOptions.resources;
	    delete rootOptions.mocks;
	
	    rootOptions = (0, _Formater.formatRootOptions)(rootOptions);
	
	    this.globals = globals;
	    this.mocks = mockOptions || mocks;
	    // 支持用户只写 mocks 而不写 routes 的情况
	    util.each(this.mocks, function (mock, key) {
	      if (!(key in routes && key !== '$default')) routes[key] = {};
	    });
	    (0, _mockHelper.mixin)(this.mocks);
	
	    this.routes = util.mapObject(routes, function (route, key) {
	      return (0, _Formater.formatInitialRoute)(key, util.objectify(route), rootOptions);
	    });
	    this.resources = util.mapObject(resources, _Formater.formatResource);
	    this.responseResources = util.mapObject(this.resources, _Formater.reverseResource);
	
	    this.apis = {};
	
	    // removeCache 之后会将 routeName 写入此对象中，
	    // 这样下将再请求此 routeName 时，就会自动在 url 上加上个随机参数（可以避免 IE 6/7 的 GET 缓存）
	    this._needReloadRouteNameMap = {};
	
	    util.each(this.routes, function (route) {
	      return _this.apis[route.name] = _this._generateApi(route);
	    });
	
	    if (true) {
	      console.warn('You are using a debug version of elegant-api, ' + 'you can switch to production version by using elegant-api.min.js');
	    }
	  }
	
	  // 下面几个以 _apply 全是 _transform 相关的函数
	
	  ElegantApi.prototype._apply = function _apply(source, config, type) {
	    var _this2 = this;
	
	    var order = config.order || ['resource', 'alias', 'computed', 'drop', 'map', 'naming'];
	    order.forEach(function (key) {
	      var fnKey = '_apply' + key.charAt(0).toUpperCase() + key.slice(1);
	
	      if (fnKey in _this2) {
	        source = _this2[fnKey](source, config[key], type);
	      }
	    });
	    return source;
	  };
	
	  ElegantApi.prototype._applyResource = function _applyResource(source, config, type) {
	    var _this3 = this;
	
	    if (!config) return source;
	
	    var map = util.objectKeys(config).reduce(function (map, rKey) {
	      var resource = _this3.resources[rKey];
	      var paths = [].concat(config[rKey]);
	      if (!resource) throw new Error('Resource ' + rKey + ' not exists.');
	
	      paths.forEach(function (path) {
	        resolveRefs(source, path).forEach(function (ref) {
	          if (util.isObject(ref)) _this3['_' + type + 'Resource'](ref, resource, rKey);
	        });
	      });
	      return map;
	    }, {});
	    return source;
	  };
	
	  // 不需要返回，obj 是引用
	
	  ElegantApi.prototype._requestResource = function _requestResource(obj, resource) {
	    var removes = [];
	    util.each(resource, function (conf, key) {
	      var oldVal = obj[key];
	      var aliasKey = key;
	
	      if (conf.alias && conf.alias !== key) {
	        removes.push(key);
	        aliasKey = conf.alias;
	      }
	
	      if (oldVal === undefined) oldVal = conf.defaultValue;
	
	      obj[aliasKey] = conf.write ? conf.write.call(obj, oldVal) : oldVal;
	    });
	
	    util.each(removes, function (key) {
	      return delete obj[key];
	    });
	  };
	
	  ElegantApi.prototype._responseResource = function _responseResource(obj, resource, resourceKey) {
	    resource = this.responseResources[resourceKey];
	    this._requestResource(obj, resource);
	  };
	
	  ElegantApi.prototype._applyAlias = function _applyAlias(source, rules) {
	    walk(source, rules, function (ref, path, last, ruleValue) {
	      if (typeof ruleValue !== 'string') throw new SyntaxError('Expect string value for alias.');
	      if (last in ref) {
	        ref[ruleValue] = ref[last];
	        delete ref[last];
	      }
	    });
	    return source;
	  };
	
	  ElegantApi.prototype._applyComputed = function _applyComputed(source, rules) {
	    walk(source, rules, function (ref, path, last, ruleValue) {
	      if (typeof ruleValue !== 'function') throw new SyntaxError('Expect function value for computed.');
	      ref[last] = ruleValue.call(ref, ref, source);
	    });
	    return source;
	  };
	
	  ElegantApi.prototype._applyDrop = function _applyDrop(source, rules) {
	    var _rules;
	
	    if (typeof rules === 'string') rules = (_rules = {}, _rules[rules] = true, _rules);else if (util.isArray(rules)) rules = rules.reduce(function (r, k) {
	      r[k] = true;return r;
	    }, {});
	    // @TODO 可能是一个含有数组的对象
	    if (util.isObject(rules)) {
	      walk(source, rules, function (ref, path, last) {
	        /* istanbul ignore else */
	        if (last in ref) delete ref[last];
	      });
	    }
	    return source;
	  };
	
	  ElegantApi.prototype._applyMap = function _applyMap(source, mapFn) {
	    return typeof mapFn === 'function' ? mapFn(source) : source;
	  };
	
	  ElegantApi.prototype._applyNaming = function _applyNaming(source, config) {
	    if (typeof config === 'string') config = { 'case': config };
	    if (!util.isObject(config)) return source;
	    config.naming = config['case'];
	    return (0, _namingTransform2["default"])(source, config);
	  };
	
	  /**
	   * 中间件：判断是否需要使用缓存
	   * @param  {Object}   route
	   * @param  {Function} cb
	   * @return {Function}
	   * @private
	   */
	
	  ElegantApi.prototype._cache = function _cache(route, cb) {
	    var _this4 = this;
	
	    var cache = this._getCache(route);
	    if (cache.exists) {
	      cb(null, cache.value);
	      return false;
	    } else {
	      return function (err, data) {
	        if (!err) {
	          _this4._setCache(route, data);
	        }
	        cb(err, data);
	      };
	    }
	  };
	
	  /**
	   * 删除指定的 routeNames 上的缓存
	   * @param  {String|Array} routeNames
	   */
	
	  ElegantApi.prototype.removeCache = function removeCache(routeNames) {
	    var _this5 = this;
	
	    if (!routeNames) return false;
	
	    var _globals = this.globals;
	    var cacheMap = _globals.cacheMap;
	    var cacheStack = _globals.cacheStack;
	
	    var keys = [].concat(routeNames);
	
	    keys.forEach(function (k) {
	      _this5._needReloadRouteNameMap[k] = true;
	      delete cacheMap[k];
	    });
	    this.globals.cacheStack = cacheStack.filter(function (c) {
	      return keys.indexOf(c[0]) < 0;
	    });
	  };
	
	  ElegantApi.prototype._getCache = function _getCache(route) {
	    var cacheMap = this.globals.cacheMap;
	    var name = route.name;
	    var http = route.http;var key = undefined;
	
	    var exists = false,
	        value = null;
	
	    if (name in cacheMap) {
	      cacheMap = cacheMap[name];
	      key = JSON.stringify([http.params, http.query]);
	      exists = key in cacheMap;
	      value = cacheMap[key];
	    }
	
	    if ((true) && route.mock.debug) {
	      console.debug('EA:(cache) check %s %o, %sexists!', name, { key: key, keys: util.objectKeys(cacheMap) }, exists ? '' : 'not ');
	    }
	
	    return { exists: exists, value: value };
	  };
	
	  ElegantApi.prototype._setCache = function _setCache(route, data) {
	    var _globals2 = this.globals;
	    var cacheSize = _globals2.cacheSize;
	    var cacheMap = _globals2.cacheMap;
	    var cacheStack = _globals2.cacheStack;
	    var name = route.name;
	    var http = route.http;
	
	    var ref = cacheMap[name] || {},
	        key = JSON.stringify([http.params, util.omit(http.query, ['__ea', '__eaData'])]);
	
	    if ((true) && route.mock.debug) {
	      console.debug('EA:(cache) set %s %o', name, { key: key, cacheMap: cacheMap });
	    }
	
	    ref[key] = data;
	    cacheMap[name] = ref;
	    cacheStack.push([name, key]);
	
	    if (cacheSize > 0 && cacheStack.length > cacheSize) {
	      var _cacheStack$shift = cacheStack.shift();
	
	      var n = _cacheStack$shift[0];
	      var k = _cacheStack$shift[1];
	
	      cacheMap[n] && delete cacheMap[n][k];
	    }
	  };
	
	  /**
	   * 中间件：对 request 的 data 和 response 的 data 进行转化
	   * @param  {Object}   route
	   * @param  {Function} cb
	   * @return {Function}
	   * @private
	   */
	
	  ElegantApi.prototype._transform = function _transform(route, cb) {
	    var _this6 = this;
	
	    var http = route.http;
	    http.data = this._apply(http.data, route.request, 'request');
	
	    return function (err, data) {
	      if (err) return cb(err, data);
	      try {
	        // 要深拷贝，防止用户修改返回的数据
	        data = _this6._apply(util.deepClone(data), route.response, 'response');
	        _this6.removeCache(route.removeCache);
	        cb(err, data);
	      } catch (err) {
	        cb(err);
	      }
	    };
	  };
	
	  /**
	   * 对 http 对象进行处理
	   * @param  {Object} route
	   * @private
	   */
	
	  ElegantApi.prototype._emulate = function _emulate(route) {
	    var mock = route.mock;
	    var http = route.http;
	    var name = route.name;
	
	    var qs = util.buildQuery(http.query);
	    http.url = util.appendQuery(http.path, qs);
	
	    if (!route.cache || this._needReloadRouteNameMap[name]) {
	      http.url = util.appendQuery(http.url, this.globals.cacheQueryKey + '=' + new Date().getTime());
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
	  };
	
	  ElegantApi.prototype._generateApi = function _generateApi(initRoute) {
	    var _this7 = this;
	
	    return function (userArgs, userRoute, cb) {
	      var route = undefined;
	      // 返回的是一个全新的 route，其中 route.http.{path, params, query, data} 都是计算后的
	      try {
	        route = (0, _Formater.formatRealtimeRoute)(initRoute, userArgs, userRoute);
	      } catch (e) {
	        return cb(e);
	      }
	
	      var _route = route;
	      var mock = _route.mock;
	      var http = _route.http;
	
	      cb = _this7._transform(route, cb);
	
	      // cache
	      if (route.cache) {
	        cb = _this7._cache(route, cb);
	        if (cb === false) return false; // 说明直接使用了缓存的数据
	      }
	      // 下面的步骤不能对 query 和 params 处理，否则会影响 cache, (__ea 和 __eaData 参数除外)
	
	      http.body = http.data = (0, _Formater.decodeUserData)(http.data);
	      var transformData = _this7._generateApiTransformData(route);
	
	      if (!mock.disabled && !mock.memory) {
	        transformData = JSON.stringify(transformData);
	        http.query.__ea = route.name;
	
	        // cookie 不支持跨域，但在 karma 上只能测试到跨域
	        if (!mock.server && route.dataTransformMethod === 'cookie') {
	          document.cookie = '__ea' + route.name + '=' + encodeURIComponent(transformData) + '; expires=' + new Date(Date.now() + 5000).toUTCString() + '; path=/';
	        } else {
	          http.query.__eaData = transformData;
	        }
	      }
	
	      _this7._emulate(route);
	      _this7._response(route, transformData, cb);
	    };
	  };
	
	  ElegantApi.prototype._response = function _response(route, transformData, cb) {
	    var _this8 = this;
	
	    var mock = route.mock;
	    var http = route.http;
	
	    if ((true) && mock.debug) {
	      console.debug('EA:(response) route: %o, transformData %o', route, transformData);
	    }
	
	    var memoryHandle = function memoryHandle() {
	      mockResponse(_this8.mocks, route.name, transformData, function (error, data) {
	        route.handle({ http: http, error: error, data: data }, cb);
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
	      route.handle({ http: http }, cb);
	    }
	  };
	
	  ElegantApi.prototype._generateApiTransformData = function _generateApiTransformData(route) {
	    var ea = STORAGE.__ea ? JSON.parse(STORAGE.__ea) : {};
	
	    var prefix = this.globals.eaQueryPrefix;
	    var http = route.http;
	
	    var search = undefined;
	
	    /* istanbul ignore else */
	    if (false) {
	      search = route.__search || ''; // only for test
	    } else {
	        search = location.search.slice(1);
	      }
	
	    search.split('&').reduce(function (ea, pair) {
	      var _pair$split$map = pair.split('=').map(decodeURIComponent);
	
	      var key = _pair$split$map[0];
	      var value = _pair$split$map[1];
	
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
	  };
	
	  ElegantApi.prototype.request = function request(source, params, config, callback) {
	    var _this9 = this;
	
	    if (typeof params === 'function') callback = params;else if (typeof config === 'function') callback = config;
	
	    // 保证参数类型
	    params = util.objectify(params);
	    config = util.objectify(config);
	    if (typeof callback !== 'function') callback = util.emptyFunction;
	
	    var end = function end(callback) {
	      if (typeof source === 'string') return _this9._singleRequest(source, params, config, callback);else if (util.isArray(source)) return _this9._batchSeriesRequest(source, params, config, callback);else if (util.isObject(source)) return _this9._batchParallelRequest(source, params, config, callback);
	
	      callback(new SyntaxError('Illegal arguments.'));
	    };
	
	    if (window.Promise) {
	      return new Promise(function (resolve, reject) {
	        end(function (err, data) {
	          if (err) reject(err);else resolve(data);
	          callback(err, data);
	        });
	      });
	    } else {
	      end(callback);
	    }
	  };
	
	  ElegantApi.prototype._singleRequest = function _singleRequest(key, params, config, callback) {
	    if (this.apis[key]) return this.apis[key](params, config, callback);
	    callback(new Error('Request key \'' + key + '\' not exists.'));
	  };
	
	  ElegantApi.prototype._batchSeriesRequest = function _batchSeriesRequest(arr, conf, config, callback) {
	    var _this10 = this;
	
	    var index = 0;
	
	    var lastError = null,
	        lastData = null;
	    var iterator = conf.iterator /* istanbul ignore next */ || util.emptyFunction;
	    var iteratorResult = undefined;
	
	    var next = function next() {
	      var key = arr[index++];
	      if (key) {
	        iteratorResult = iterator(key, index - 1, lastError, lastData);
	        if (iteratorResult === false) return callback(lastError, lastData);
	
	        _this10.request(key, iteratorResult, config[key], function (err, data) {
	          lastError = err;
	          lastData = data;
	          next();
	        });
	      } else {
	        callback(lastError, lastData);
	      }
	    };
	
	    next();
	  };
	
	  ElegantApi.prototype._batchParallelRequest = function _batchParallelRequest(obj, conf, config, callback) {
	    var _this11 = this;
	
	    var keys = Object.keys(obj),
	        len = keys.length;
	
	    var errMap = new Error('MAP_ERROR'),
	        dataMap = {},
	        hasError = false;
	    var iterator = conf.iterator || util.emptyFunction;
	
	    keys.forEach(function (key) {
	      var params = obj[key];
	      var requestKey = conf.alias && conf.alias[key] || key;
	      _this11.request(requestKey, params, config[requestKey], function (err, data) {
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
	  };
	
	  return ElegantApi;
	})();
	
	/**
	 * 遍历指定的规则，主要用在 _applyAlias 和 _applyComputed 中
	 */
	function walkRules(rules, cb, prefix) {
	  for (var key in rules) {
	    var path = prefix ? prefix + '.' + key : key;
	    if (util.isObject(rules[key])) {
	      walkRules(rules[key], cb, path);
	    } else {
	      cb(path, rules[key]);
	    }
	  }
	}
	
	function resolveRefs(source, path) {
	  var refs = [source];
	  if (!path) return refs;
	
	  path.split('.').forEach(function (key) {
	    var tmp = [];
	    refs.forEach(function (r) {
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
	
	  return refs.filter(function (r) {
	    return r;
	  });
	}
	
	function walk(source, rules, cb) {
	  walkRules(util.objectify(rules), function (path, ruleValue) {
	    var parts = path.split('.');
	    var last = parts.pop();
	    path = parts.join('.');
	
	    resolveRefs(source, path).forEach(function (ref) {
	      return cb(ref, path, last, ruleValue);
	    });
	  });
	}

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	
	exports.__esModule = true;
	
	exports['default'] = function (source) {
	  var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	
	  var _ref$deep = _ref.deep;
	  var deep = _ref$deep === undefined ? 0 : _ref$deep;
	  var _ref$naming = _ref.naming;
	  var naming = _ref$naming === undefined ? 'camel' : _ref$naming;
	
	  if (typeof source === 'string') {
	    return transform(source, naming, deep, null);
	  }
	  return walk(source, deep, naming);
	};
	
	/** Used to match words to create compound words. */
	var reWords = function () {
	  var upper = '[A-Z\\xc0-\\xd6\\xd8-\\xde]',
	      lower = '[a-z\\xdf-\\xf6\\xf8-\\xff]+';
	
	  return RegExp(upper + '+(?=' + upper + lower + ')|' + upper + '?' + lower + '|' + upper + '+|[0-9]+', 'g');
	}();
	
	function wrap(str, fn) {
	  return str.match(reWords).reduce(fn, '');
	}
	
	var transformers = {
	  camel: function camel(str) {
	    return wrap(str, function (result, word, index) {
	      var fn = index ? 'toUpperCase' : 'toLowerCase';
	      return result + word.charAt(0)[fn]() + word.slice(1);
	    });
	  },
	  cap: function cap(str) {
	    return wrap(str, function (result, word, index) {
	      return result + word.charAt(0).toUpperCase() + word.slice(1);
	    });
	  },
	  kebab: function kebab(str) {
	    return wrap(str, function (result, word, index) {
	      return result + (index ? '-' : '') + word.toLowerCase();
	    });
	  },
	  snake: function snake(str) {
	    return wrap(str, function (result, word, index) {
	      return result + (index ? '_' : '') + word.toLowerCase();
	    });
	  }
	};
	
	var camel = transformers.camel;
	var cap = transformers.cap;
	var kebab = transformers.kebab;
	var snake = transformers.snake;
	exports.camel = camel;
	exports.cap = cap;
	exports.kebab = kebab;
	exports.snake = snake;
	
	/**
	 *
	 * 将 source 中的 Object 的 keys 的命名风格全部转换成指定的 naming 命名风格
	 *
	 * @param  {Object} source                      要处理的对象
	 * @param  {Number} [options.deep = 0]          处理的深度
	 *
	 * @param  {String|Function} [options.naming = 'camel']
	 *         命名风格，支持 camel, cap, kebab, snake，或自定义方法
	 *
	 *         如果指定了函数，函数得到的参数会是 (key, deep, currentObject)，函数需要返回 newKey
	 *         如果函数返回 false，则忽略更新此时的 key，
	 *
	 * @return {Object}  转化后的对象，原对象不会被破坏
	 */
	
	function walk(node, deep, naming) {
	  var result = node;
	
	  if (isObject(node)) {
	    result = {};
	    for (var key in node) {
	      if (node.hasOwnProperty(key)) {
	        result[transform(key, naming, deep, node)] = deep === 1 ? node[key] : walk(node[key], deep > 1 ? deep - 1 : deep, naming);
	      }
	    }
	  } else if (isArray(node)) {
	    result = [];
	    for (var i = 0; i < node.length; i++) {
	      result.push(walk(node[i], deep, naming));
	    }
	  }
	
	  return result;
	}
	
	function transform(key, naming, deep, currentObject) {
	  if (typeof naming === 'string' && naming in transformers) {
	    return transformers[naming](key);
	  } else if (typeof naming === 'function') {
	    var newKey = naming(key, deep, currentObject);
	    if (!newKey) return key;
	    if (typeof newKey === 'string') return newKey;
	    throw new Error('Transform naming function should return a valid string value!');
	  }
	  throw new Error('Not supported transform naming type, only support `string` and `function`');
	}
	
	function getType(target) {
	  return Object.prototype.toString.call(target).slice(8, -1).toLowerCase();
	}
	function isArray(target) {
	  return getType(target) === 'array';
	}
	function isObject(target) {
	  return getType(target) === 'object';
	}

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';
	
	exports.__esModule = true;
	exports["default"] = {
	  debug: false, // 开启调试模式
	  base: '', // 指定基准路径，这样在单独的 route 中只要指定不同的部分即可
	  path: '',
	  // query: 'a=:aa&b=',  // 需要参数 `aa` and `b`
	  // data: 'c&d=&e=eee', // 需要参数 `d`，参数 `c` 是可选的，参数 `e` 的默认值是 "eee"
	
	  // 来自于 vue-resource
	  emulateJSON: false,
	  emulateHTTP: false,
	
	  cache: 'smart', // 只有 GET 请求才会缓存，另外可以单独在 route 中指定 true 或者 false
	
	  mock: {
	    // disabled: false, // 是否禁用 mock
	    memory: true, // 是否使用缓存来 mock
	    server: null, // 指定独立的 mock 服务器（需要 memory 为 false)
	    proxy: null, // 指定代理的服务器（需要 memory 为 false)
	    delay: { min: 200, max: 1000 } // 或者指定为一个具体的数字
	  },
	  dataTransformMethod: 'query', // query/cookie  cookie 只能用在没有独立的 mock server 的情况下，因为 cookie 无法跨域
	
	  // 这里的设置不会被单独的 route 覆盖
	  globals: {
	    eaQueryPrefix: '__',
	    cacheQueryKey: '_t', // 如果声明了 cache 为 false，则会在 url 上带上此参数，其值是当前的时间的毫秒数
	    cacheSize: 100,
	    cacheMap: {},
	    cacheStack: []
	  },
	
	  http: {
	    method: 'GET',
	    crossOrigin: false,
	    dataType: 'json',
	    // url: null, // url 不用设置，会根据配置自动生成合适的值
	    // body: null, // fetch api 标准是用 body
	    data: null, // 而 jquery 用的是 data，这里兼容两者，设置的时候只需要设置 data 就行，系统会自动同步数据到 body
	    headers: {
	      // 'Content-Type': 'application/json;charset=utf-8',
	      // 'Content-Type': 'application/x-www-form-urlencoded',
	    }
	  },
	
	  request: {
	    naming: null
	    // 数组也会 extend，所以没有在这里定义，而是写在函数中
	    // order: ['resource', 'alias', 'computed', 'drop', 'map', 'naming']
	  },
	
	  response: {
	    naming: {
	      'case': 'camel', // 命名风格，可以为 camel/kebab/snake/cap 或自己实现，即指定一个 function
	      deep: 0 // deep 默认就是 0，忽略此参数时，可以直接写成 naming: 'camel'
	    }
	  },
	
	  // 可能需要实现的一个方法，默认是调用 jquery 中的 ajax 方法的
	  handle: function handle(target, callback) {
	    if (this.mock.memory) return callback(target.error, target.data);
	
	    var ajax = window.jQuery && window.jQuery.ajax;
	    if (ajax) {
	      return ajax(target.http).success(function (data) {
	        return callback(null, data);
	      }).error(function (xhr) {
	        return callback(xhr);
	      });
	    }
	
	    throw new Error('Need implement handler function in options');
	  },
	
	  mocks: {
	    /* 全局默认的 mock
	    $default: {
	      status: 0
	      data: null
	      message: ''
	    }
	    */
	  },
	  resources: {},
	  routes: {}
	};

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	exports.mixin = mixin;
	
	var _util = __webpack_require__(1);
	
	function mixin(context) {
	
	  context.$objectify = function (target, key) {
	    return promisify(context, key, target, true);
	  };
	
	  context.$objectifyAll = function (target, keys) {
	    return Promise.all([].concat(keys).map(function (key) {
	      return context.$objectify(target, key);
	    }));
	  };
	
	  context.$fetch = function (target, key, conf) {
	    if (conf && conf.body) {
	      conf.data = conf.body;
	      delete conf.body;
	    }
	    return promisify(context, key, (0, _util.extend)({}, target, conf));
	  };
	
	  context.$fetchAll = function (target, obj) {
	    var keys = (0, _util.objectKeys)(obj);
	
	    return Promise.all(keys.map(function (key) {
	      return context.$fetch(target, key, obj[key]);
	    })).then(function (list) {
	      return Promise.resolve(keys.reduce(function (all, key, index) {
	        all[key] = list[index];
	        return all;
	      }, {}));
	    });
	  };
	} // 依赖于 Promise
	
	function promisify(context, key, target, save) {
	  return new Promise(function (resolve, reject) {
	    if (typeof context[key] !== 'function') {
	      return resolve(context[key]);
	    }
	
	    context[key](target, function (err, data) {
	      if (err) {
	        reject(err);
	      } else {
	        if (save) context[key] = data;
	        resolve(data);
	      }
	    });
	  });
	}

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	exports.formatRootOptions = formatRootOptions;
	exports.formatInitialRoute = formatInitialRoute;
	exports.encodeUserData = encodeUserData;
	exports.decodeUserData = decodeUserData;
	exports.formatRealtimeRoute = formatRealtimeRoute;
	exports.formatResource = formatResource;
	exports.reverseResource = reverseResource;
	
	function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }
	
	var util = __webpack_require__(1);
	
	/**
	 * @typedef {Array} SUPPORT_RESOURCE_TYPES
	 *
	 * 可以设置在 resource.type 中的类型
	 */
	var SUPPORT_RESOURCE_TYPES = [Number, String, Boolean];
	
	/**
	 * @typedef {Array} SUPPORT_RESOURCE_TYPE_VALUES
	 *
	 * {@link SUPPORT_RESOURCE_TYPES} 对应的默认值
	 */
	var SUPPORT_RESOURCE_TYPE_VALUES = [0, '', false];
	
	/**
	 * @typedef {Array} SMART_CACHE_HTTP_METHODS
	 *
	 * 如果指定 cache 为 "smart" 时，当 http method 为此字段中之一时，
	 * 会自动将 cache 设置为 true，否则设置为 false
	 */
	var SMART_CACHE_HTTP_METHODS = ['GET', 'HEAD'];
	
	/**
	 * @typedef {Array} NO_DATA_HTTP_METHODS
	 *
	 * 当 http method 为下面字段之一时， http requres 的内容应该为空，即 `data = {}`
	 */
	var NO_BODY_CONTENT_HTTP_METHODS = ['GET', 'HEAD'];
	
	/**
	 * 当用 JSON 提交数据时，用户可以提交任何格式的数据，而不是 Object
	 * 但此框架设计时候只考虑了 Object，所以为了支持这种格式，需要将这些变化
	 * 的数据转化成 Object，所以需要一个 key 来识别
	 *
	 * @type {String}
	 */
	var USER_DATA_RAW_KEY = '__raw_data_v1';
	
	/**
	 * 解析像 url query 那样的字符串
	 * @param  {String} target
	 * @return {Object}
	 * @example
	 * "fo=:foo&bar=&version=1" =>
	 *
	 * {
	 *   fo: {
	 *     required: true,
	 *     alias: "foo"
	 *   },
	 *   bar: {
	 *     required: true
	 *   },
	 *   version: {
	 *     value: '1'
	 *   }
	 * }
	 *
	 * @private
	 */
	function formatQueryString(target) {
	  if (util.isObject(target)) return target;
	  if (typeof target !== 'string') return {};
	
	  return target.split('&').reduce(function (result, qs) {
	    var _qs$split$map = qs.split('=').map(decodeURIComponent);
	
	    var key = _qs$split$map[0];
	    var val = _qs$split$map[1];
	
	    var conf = {},
	        alias = undefined;
	
	    if (val && val[0] === ':' && val[1]) alias = val.slice(1);else if (val) conf.value = val;
	
	    if (val === '' || alias) conf.required = true;
	
	    if (alias) {
	      conf.alias = key;
	      key = alias;
	    }
	
	    result[key] = conf;
	    return result;
	  }, {});
	}
	
	/**
	 * 格式化配置中的 http 选项
	 * @private
	 */
	function formatRouteHttpOption(route) {
	  // 将 route 中的属性 copy 到 route.http 中（只 copy route.http 中支持的 keys）
	  var http = route.http;
	
	  for (var key in http) {
	    if (key in route) http[key] = route[key];
	  }
	
	  http.path = util.urlNormalize(route.base + route.path);
	  http.method = http.method.toUpperCase();
	
	  return route.http;
	}
	
	/**
	 * 格式化配置中的 mock 选项
	 * @private
	 */
	function formatRouteMockOption(route) {
	  var mock = route.mock;
	
	  if (!util.isObject(mock)) {
	    mock = route.mock = { disabled: !mock };
	  }
	
	  // debug
	  if (!('debug' in mock)) mock.debug = route.debug;
	
	  if (mock.disabled) {
	    delete mock.memory;
	  }
	  if (mock.disabled || mock.memory) {
	    delete mock.server;
	    delete mock.proxy;
	  }
	
	  return route.mock;
	}
	
	/**
	 * 格式化配置中的 cache 选项
	 * @private
	 */
	function formatRouteCacheOption(route) {
	  route.cache = route.cache === 'smart' && SMART_CACHE_HTTP_METHODS.indexOf(route.http.method) >= 0 || route.cache === true;
	
	  return route.cache;
	}
	
	/**
	 * 对用户提供的 rootOptions 格式化
	 * @param  {Object} rootOptions 用户配置（不应该包括 routes/resorces/mocks/globals
	 * @return {Object} 返回格式化之后的 rootOptions（这个 rootOptions 和原 rootOptions 是同一个）
	 */
	function formatRootOptions(rootOptions) {
	  rootOptions.query = formatQueryString(rootOptions.query);
	  rootOptions.data = formatQueryString(rootOptions.data);
	
	  return rootOptions;
	}
	
	/**
	 * 在用户还没有使用 request(routeKey, userArgs, callback) 之前，对 route 进行一些基本的格式化
	 * @param  {String} routeKey
	 * @param  {Object} route
	 * @param  {Object} formatedRootOptions
	 * @return {Object}  返回格式化之后的 route（这个 route 是原 route 的一个深拷贝）
	 */
	function formatInitialRoute(routeKey, route, formatedRootOptions) {
	  if (!route.name) route.name = routeKey;
	  route.query = formatQueryString(route.query);
	  route.data = formatQueryString(route.data);
	
	  // 创建一个全新的 route，不要污染原有的
	  route = util.extend(true, {}, formatedRootOptions, route);
	
	  formatRouteHttpOption(route);
	  formatRouteMockOption(route);
	  formatRouteCacheOption(route);
	
	  return route;
	}
	
	/**
	 * 获取 path 中的变量，如 /api/user/:uid，就会返回 ["uid"]
	 * @param  {String} path - url 的路径
	 * @return {Array}  此路径中的所有的变量
	 * @private
	 */
	function getParamKeysFromPath(path) {
	  var params = [];
	  path.replace(/\/:([-\w]+)/g, function (r, key) {
	    params.push(key);
	  });
	  return params;
	}
	
	/**
	 * 将 path 中的变量替换成真实用户提供的值
	 * @param  {String} path   带变量的 path
	 * @param  {Object} params
	 * @return {String}
	 * @private
	 */
	function getFullPathFromParams(path, params) {
	  return path.replace(/\/:([-\w]+)/g, function (r, key) {
	    return '/' + params[key];
	  });
	}
	
	/**
	 * 获取请求延迟的时间
	 * @param  {Object|Number} delay 用户配置的数据
	 * @return {Number}
	 */
	function getDelayTime(delay) {
	  if (util.isObject(delay)) {
	    delay = util.extend({ min: 200, max: 3000 }, delay);
	    delay = Math.floor(Math.random() * (delay.max - delay.min) + delay.min);
	  }
	  delay = parseInt(delay, 10);
	  return delay && delay > 0 ? delay : 0;
	}
	
	/**
	 * 根据现有的 route 信息，来将 userArgs 分成三类：params, query 和 data，三者都应该是 null 或 Object
	 *   - params 是 url.path 上的参数
	 *   - query 是 url.search 上的参数
	 *   - data 是 请求体的内容
	 *
	 * 用户提供 userArgs 可能是将这三者里的参数合并在一个对象中提供的，所以需要将这些参数拆开，
	 * 另外用户也有可能提供一些多余的参数，也需要把这些参数去掉
	 *
	 * @param  {Object|null} userArgs
	 * @param  {Object} route
	 * @return {{params: Object, query: Object, data: Object}}
	 * @private
	 */
	function parseUserArgs(userArgs, route) {
	  userArgs = util.extend(true, {}, userArgs);
	  var keys = util.objectKeys(userArgs);
	  var http = route.http;
	
	  var allows = ['params', 'query', 'data'];
	
	  var noBodyContent = NO_BODY_CONTENT_HTTP_METHODS.indexOf(http.method) >= 0;
	  if (keys.every(function (k) {
	    return allows.indexOf(k) >= 0;
	  })) {
	    if ('data' in userArgs) userArgs.data = encodeUserData(userArgs.data);
	    allows.forEach(function (k) {
	      return userArgs[k] = util.objectify(userArgs[k]);
	    });
	    if (noBodyContent) userArgs.data = {};
	    return validateParsedUserArgs(userArgs, route);
	  }
	
	  // query 和 data 可能有 alias 字段
	  var queryKeys = util.objectKeys(route.query);
	  var paramKeys = getParamKeysFromPath(http.path);
	  var params = {},
	      query = {},
	      data = {};
	
	  var rQuery = route.query,
	      rData = route.data;
	  keys.forEach(function (key) {
	    // 注意优先级不能换
	    if (paramKeys.indexOf(key) >= 0) params[key] = userArgs[key];else if (queryKeys.indexOf(key) >= 0) query[rQuery[key] && rQuery[key].alias || key] = userArgs[key];else if (!noBodyContent) data[rData[key] && rData[key].alias || key] = userArgs[key];
	  });
	  return validateParsedUserArgs({ params: params, query: query, data: data }, route);
	}
	
	/**
	 * 验证处理后的 userArgs
	 *
	 * 注意： validate 的时候，也有可能会将配置的默认值赋值到原参数上
	 *
	 * @param {{params: Object, query: Object, data: Object}} userArgs
	 * @param {Object} route
	 * @throws
	 * @private
	 */
	function validateParsedUserArgs(userArgs, route) {
	  var path = route.http.path;
	  var paramKeys = getParamKeysFromPath(path);
	  var label = route.name;
	
	  // 先验证 params
	  paramKeys.forEach(function (k) {
	    if (!(k in userArgs.params)) throw new SyntaxError('Route ' + label + ' missing params parameter: ' + k + '.');
	  });
	
	  // query 和 data 的验证方法是一样的
	  ['query', 'data'].forEach(function (key) {
	    var ref = userArgs[key];
	    var rules = route[key];
	    util.each(rules, function (rule, ruleKey) {
	      var argKey = rule.alias || ruleKey;
	      var argValue = ref[argKey];
	      var exists = argKey in ref;
	
	      if (rule.required && !exists) throw new SyntaxError('Route ' + label + ' missing ' + key + ' parameter: ' + ruleKey + '.');
	      if (rule.validate && exists) {
	        if (typeof rule.validate === 'function' && !rule.validate(argValue) || rule.validate instanceof RegExp && !rule.validate.test(argValue)) {
	          throw new SyntaxError('Route ' + label + ' ' + key + ' parameter \'' + argKey + '\' validate error.');
	        }
	      }
	
	      if ('value' in rule && !exists) ref[argKey] = rule.value;
	    });
	  });
	
	  return userArgs;
	}
	
	/**
	 * 对非 Object 的 data 做处理，转化成 Object
	 * @param  {*} data
	 * @return {Object}
	 */
	function encodeUserData(data) {
	  var _ref;
	
	  if (util.isObject(data)) return data;
	  return _ref = {}, _ref[USER_DATA_RAW_KEY] = data, _ref;
	}
	
	/**
	 * 恢复 data
	 * @param  {Object} data
	 * @return {*}
	 */
	function decodeUserData(data) {
	  return USER_DATA_RAW_KEY in data ? data[USER_DATA_RAW_KEY] : data;
	}
	
	/**
	 * 在用户调用 request(routeKey, userArgs, callback, userRoute) 时，合成一个全新的 route
	 * @param  {Object} route
	 * @param  {Object} userArgs
	 * @param  {Object} userRoute
	 *         - http （不支持在 route 外层设置 http 属性）
	 *         - mock
	 *         - debug
	 *         - cache
	 *
	 * @return {Object}
	 */
	function formatRealtimeRoute(route, userArgs, userRoute) {
	  route = util.extend(true, {}, route);
	  userRoute = util.extend(true, {}, userRoute);
	  var http = route.http,
	      userHttp = userRoute.http || {};
	
	  // path, method 需要特殊处理
	  if (userHttp.path) userHttp.path = util.urlNormalize(route.base + userHttp.path);
	  if (userHttp.method) userHttp.method = userHttp.method.toUpperCase();
	  util.extend(true, http, userHttp); // http 用继承
	
	  if ('mock' in userRoute) route.mock = formatRouteMockOption(userRoute); // mock 直接覆盖
	  if ('cache' in userRoute) route.cache = formatRouteCacheOption(userRoute); // cache 也直接覆盖
	  if ('debug' in userRoute) route.mock.debug = userRoute.debug;
	
	  var _parseUserArgs = parseUserArgs(userArgs, route);
	
	  var params = _parseUserArgs.params;
	  var query = _parseUserArgs.query;
	  var data = _parseUserArgs.data;
	
	  // 保证 query 是字符串
	
	  util.each(query, function (val, key, query) {
	    return query[key] = String(val);
	  });
	
	  http.path = getFullPathFromParams(http.path, params);
	  http.params = params;
	  http.query = query;
	  http.data = data;
	
	  // 每次都计算，主要是用户可能配置了一个时间范围
	  route.mock.delay = route.mock.memory ? getDelayTime(route.mock.delay) : 0;
	
	  return route;
	}
	
	/**
	 * 对用户配置的 resource 格式化
	 *
	 * @param  {Object} resource 用户对某个 resource 的实体的定义，里面是 key, value 对，其中 value 有以下几种情况
	 *                  - 当为 String 时，把它当作 alias
	 *                  - 当为 Function 时，判断是否在 {@link SUPPORT_RESOURCE_TYPES} 之中，
	 *                    是的话把它当作 type，否作抛出异常
	 *                  - 当为 Object 时，检查它内部的这些变量
	 *                    `type, alias, defaultValue, read, write`
	 * @param  {Strint} resourceKey
	 * @return {Object}
	 *
	 * @example
	 *
	 *  user: {
	 *    uid: Number,
	 *    username: 'user_name',
	 *    gender: { type: String, defaultValue: 'M', alias: 'sex' },
	 *    age: {
	 *      type: Number,
	 *      read() {
	 *        return new Date().getFullYear() - this.age;
	 *      },
	 *      write() {
	 *        this.year = new Date().getFullYear() - this.age;
	 *        delete this.age
	 *      }
	 *    }
	 *  }
	 */
	function formatResource(resource, resourceKey) {
	  return util.objectKeys(resource).reduce(function (result, key) {
	
	    var definition = resource[key],
	        definitionType = typeof definition === 'undefined' ? 'undefined' : _typeof(definition);
	
	    var type = undefined,
	        alias = undefined,
	        defaultValue = undefined,
	        read = undefined,
	        write = undefined;
	
	    if (definitionType === 'string') {
	      alias = definition;
	    } else if (definitionType === 'function') {
	      type = definition;
	    } else if (definition) {
	      type = definition.type;
	      alias = definition.alias;
	      defaultValue = definition.defaultValue;
	      read = definition.read;
	      write = definition.write;
	    }
	
	    var typeIndex = SUPPORT_RESOURCE_TYPES.indexOf(type);
	    if (typeIndex >= 0) {
	      if (typeof defaultValue === 'undefined') defaultValue = SUPPORT_RESOURCE_TYPE_VALUES[typeIndex];
	    } else if (type) {
	      throw new Error('Not supported resource type for ' + resourceKey + '.' + key);
	    } else {
	      type = null;
	    }
	
	    // TODO 验证 read/write 为 function， alias 为字符串 （当它们不为 null 时）
	
	    // read 表示从 response 中读取数据， write 当前写入到 request 中
	    result[key] = { type: type, alias: alias, defaultValue: defaultValue, read: read, write: write };
	    return result;
	  }, {});
	}
	
	/**
	 * 将 resource 反转
	 *
	 * 上面函数返回的值是给 resquest 时用的，此函数返回的是给 response 用的
	 */
	function reverseResource(resource, resourceKey) {
	  var result = {};
	
	  util.each(resource, function (config, key) {
	    var type = config.type;
	    var alias = config.alias;
	    var defaultValue = config.defaultValue;
	    var read = config.read;
	    var write = config.write;
	
	    if (alias) {
	      ;
	      var _ref2 = [alias, key];
	      key = _ref2[0];
	      alias = _ref2[1];
	    }var _ref3 = [write, read];
	    read = _ref3[0];
	    write = _ref3[1];
	
	    result[key] = { type: type, alias: alias, defaultValue: defaultValue, read: read, write: write };
	  });
	
	  return result;
	}

/***/ },
/* 7 */
/***/ function(module, exports) {

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


/***/ }
/******/ ])
});
;
//# sourceMappingURL=elegant-api.js.map