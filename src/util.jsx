
function toString(o) { return Object.prototype.toString.call(o); }
function isObject(o) { return o && toString(o) === '[object Object]'; }
function isArray(o) { return Array.isArray(o); }

function each(obj, cb) {
  if (isArray(obj)) {
    for (let i = 0; i < obj.length; i++) cb(obj[i], i, obj);
  } else if (isObject(obj)) {
    Object.keys(obj).forEach(key => cb(obj[key], key, obj));
  }
}

function emptyFunction() {}

function extend() {
  let deep = false, args = [].slice.call(arguments);
  if (typeof args[0] === 'boolean') deep = args.shift();

  let src = args.shift() || {}, target, key;

  for (let i = 0; i < args.length; i++) {
    target = args[i];
    if (!isObject(target)) continue;
    for (key in target) {
      if (!target.hasOwnProperty(key)) continue;
      if (deep && isObject(target[key])) {
        if (!isObject(src[key])) src[key] = {};
        extend(deep, src[key], target[key]);
      } else {
        src[key] = target[key];
      }
    }
  }

  return src;
}

function deepClone(obj) {
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

function buildQuery(query) {
  return Object.keys(query).reduce((result, key) => {
    result.push([key, query[key]].map(encodeURIComponent).join('='));
    return result;
  }, []).join('&');
}

function urlParams(obj) {
  let params = [];
  params.add = function (key, value) {
    if (value == null) value = '';
    this.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
  };
  _serialize(params, obj);
  return params.join('&');
}

function urlNormalize(url) {
  return url.replace(/(?:[^:])\/\//g, '\/');
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

export default {
  extend,
  deepClone,
  isObject,
  isArray,
  each,
  buildQuery,
  urlParams,
  urlNormalize,
  emptyFunction
};
