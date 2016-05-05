export const isServer = typeof window === 'undefined';

/**
 * 只是一个空函数，什么也不做
 */
export function emptyFunction() {}

/**
 * 获取对象中的 keys，兼容 IE 7/8
 *
 * @param  {Object} obj
 * @return {Array}
 */
export function objectKeys(obj) {
  return obj ? Object.keys(obj) : [];
}

/**
 * 调用 Object 原型链上的 toString 方法来获取任意变量的原生的 string 形式
 * @param  {*} o 任意变量
 * @return {String}
 */
export function toString(o) { return Object.prototype.toString.call(o); }

/**
 * 判断某一变量是否是一个 Object
 * @param  {*} o
 * @return {Boolean}
 */
export function isObject(o) { return toString(o) === '[object Object]'; }

/**
 * 判断某一变量是否是一个 Array
 * @param  {*} o
 * @return {Boolean}
 */
export function isArray(o) { return Array.isArray(o); }

/**
 * 确保变量是一个 Object，如果不是，则返回空 Object
 * @param  {*} o
 * @return {Boolean}
 */
export function objectify(o) { return isObject(o) ? o : {}; }

/**
 * 遍历对象或数组，如果是其它数据类型，直接忽略
 * @param  {Object|Array|*}   obj
 * @param  {Function} cb
 */
export function each(obj, cb) {
  if (isArray(obj)) {
    for (let i = 0; i < obj.length; i++) cb(obj[i], i, obj);
  } else if (isObject(obj)) {
    objectKeys(obj).forEach(key => cb(obj[key], key, obj));
  }
}

/**
 * 将一个对象转化成另一个对象，keys 不变
 * @param  {Object}   obj
 * @param  {Function} fn - 遍历函数，参数是 (item, key, obj)
 * @return {Object}
 */
export function mapObject(obj, fn) {
  return objectKeys(obj).reduce((result, key) => {
    result[key] = fn(obj[key], key, obj);
    return result;
  }, {});
}

/**
 * 深度克隆任意参数，主要针对于 Object|Array 和基本数据类型
 * @param  {Object|Array|Number|String|Boolean} obj
 * @return {Object|Array|Number|String|Boolean}
 */
export function deepClone(obj) {
  let result;
  if (isObject(obj)) {
    result = {};
  } else if (Array.isArray(obj)) {
    result = [];
  } else {
    return obj;
  }

  each(obj, (val, key) => result[key] = deepClone(val));
  return result;
}

/**
 * 从一个对象中忽略指定的 keys， 并将剩下的 keys 组成的一个新的 Object
 * @param  {Object} obj
 * @param  {Array|String} keys
 * @return {Object}
 */
export function omit(obj, keys) {
  keys = [].concat(keys);
  return Object.keys(obj).reduce((res, key) => {
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
export function extend() {
  let deep = false, args = [].slice.call(arguments);
  if (typeof args[0] === 'boolean') deep = args.shift();

  let src = args.shift() || {}, target;

  for (let i = 0; i < args.length; i++) {
    target = args[i];

    if (!isObject(target) && !isArray(target)) continue;

    if (toString(src) !== toString(target)) {
      src = deepClone(target);
    } else {
      /*eslint-disable */
      each(target, (val, key) => {
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
export function buildQuery(query) {
  let params = [];
  params.add = function (key, value) {
    if (value == null) value = '';
    this.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
  };
  _serialize(params, query);
  return params.join('&');
}

function _serialize(params, obj, scope) {
  let array = isArray(obj), plain = isObject(obj), hash;

  each(obj, (value, key) => {
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
export function urlNormalize(url) {
  return url.replace(/(?:[^:])\/\//g, '\/');
}

/**
 * 给 URL 添加 query 字符串
 * @param  {String} url
 * @param  {String} query
 * @return {String}
 */
export function appendQuery(url, query) {
  if (query === '') return url;
  let parts = url.split('#');
  return (parts[0] + '&' + query).replace(/[&?]{1,2}/, '?') + (parts.length === 2 ? ('#' + parts[1]) : '');
}



