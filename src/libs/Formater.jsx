const util = require('./util');

/**
 * @typedef {Array} SUPPORT_RESOURCE_TYPES
 *
 * 可以设置在 resource.type 中的类型
 */
const SUPPORT_RESOURCE_TYPES = [Number, String, Boolean];

/**
 * @typedef {Array} SUPPORT_RESOURCE_TYPE_VALUES
 *
 * {@link SUPPORT_RESOURCE_TYPES} 对应的默认值
 */
const SUPPORT_RESOURCE_TYPE_VALUES = [0, '', false];

/**
 * @typedef {Array} SMART_CACHE_HTTP_METHODS
 *
 * 如果指定 cache 为 "smart" 时，当 http method 为此字段中之一时，
 * 会自动将 cache 设置为 true，否则设置为 false
 */
const SMART_CACHE_HTTP_METHODS = ['GET', 'HEAD'];

/**
 * @typedef {Array} NO_DATA_HTTP_METHODS
 *
 * 当 http method 为下面字段之一时， http requres 的内容应该为空，即 `data = {}`
 */
const NO_BODY_CONTENT_HTTP_METHODS = ['GET', 'HEAD'];


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

  return target.split('&').reduce((result, qs) => {
    let [key, val] = qs.split('=').map(decodeURIComponent);

    let conf = {}, alias;

    if (val && val[0] === ':' && val[1]) alias = val.slice(1);
    else if (val) conf.value = val;

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
  let http = route.http;

  for (let key in http) {
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
  let mock = route.mock;

  if (!util.isObject(mock)) {
    mock = route.mock = {disabled: !mock};
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
  route.cache = route.cache === 'smart' && SMART_CACHE_HTTP_METHODS.indexOf(route.http.method) >= 0
    || route.cache === true;

  return route.cache;
}

/**
 * 对用户提供的 rootOptions 格式化
 * @param  {Object} rootOptions 用户配置（不应该包括 routes/resorces/mocks/globals
 * @return {Object} 返回格式化之后的 rootOptions（这个 rootOptions 和原 rootOptions 是同一个）
 */
export function formatRootOptions(rootOptions) {
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
export function formatInitialRoute(routeKey, route, formatedRootOptions) {
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
  let params = [];
  path.replace(/\/:([-\w]+)/g, (r, key) => {
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
  return path.replace(/\/:([-\w]+)/g, (r, key) => '/' + params[key]);
}

/**
 * 获取请求延迟的时间
 * @param  {Object|Number} delay 用户配置的数据
 * @return {Number}
 */
function getDelayTime(delay) {
  if (util.isObject(delay)) {
    delay = util.extend({min: 200, max: 3000}, delay);
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
  let keys = util.objectKeys(userArgs);
  let http = route.http;

  let allows = ['params', 'query', 'data'];

  let noBodyContent = NO_BODY_CONTENT_HTTP_METHODS.indexOf(http.method) >= 0;
  if (keys.every(k => allows.indexOf(k) >= 0)) {
    allows.forEach(k => userArgs[k] = util.objectify(userArgs[k]));
    if (noBodyContent) userArgs.data = {};
    return validateParsedUserArgs(userArgs, route);
  }

  // query 和 data 可能有 alias 字段
  let queryKeys = util.objectKeys(route.query);
  let paramKeys = getParamKeysFromPath(http.path);
  let params = {}, query = {}, data = {};

  let rQuery = route.query, rData = route.data;
  keys.forEach(key => {
    // 注意优先级不能换
    if (paramKeys.indexOf(key) >= 0) params[key] = userArgs[key];
    else if (queryKeys.indexOf(key) >= 0) query[rQuery[key] && rQuery[key].alias || key] = userArgs[key];
    else if (!noBodyContent) data[rData[key] && rData[key].alias || key] = userArgs[key];
  });
  return validateParsedUserArgs({params, query, data}, route);
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
  let path = route.http.path;
  let paramKeys = getParamKeysFromPath(path);
  let label = route.name;

  // 先验证 params
  paramKeys.forEach(k => {
    if (!(k in userArgs.params)) throw new SyntaxError(`Route ${label} missing params parameter: ${k}.`);
  });

  // query 和 data 的验证方法是一样的
  ['query', 'data'].forEach(key => {
    let ref = userArgs[key];
    let rules = route[key];
    util.each(rules, (rule, ruleKey) => {
      let argKey = rule.alias || ruleKey;
      let argValue = ref[argKey];
      let exists = argKey in ref;

      if (rule.required && !exists) throw new SyntaxError(`Route ${label} missing ${key} parameter: ${ruleKey}.`);
      if (rule.validate && exists) {
        if (
          typeof rule.validate === 'function' && !rule.validate(argValue)
          || rule.validate instanceof RegExp && !rule.validate.test(argValue)
        ) {
          throw new SyntaxError(`Route ${label} ${key} parameter '${argKey}' validate error.`);
        }
      }

      if ('value' in rule && !exists) ref[argKey] = rule.value;
    });
  });

  return userArgs;
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
export function formatRealtimeRoute(route, userArgs, userRoute) {
  route = util.extend(true, {}, route);
  userRoute = util.extend(true, {}, userRoute);
  let http = route.http, userHttp = userRoute.http || {};

  // path, method 需要特殊处理
  if (userHttp.path) userHttp.path = util.urlNormalize(route.base + userHttp.path);
  if (userHttp.method) userHttp.method = userHttp.method.toUpperCase();
  util.extend(true, http, userHttp); // http 用继承

  if ('mock' in userRoute) route.mock = formatRouteMockOption(userRoute); // mock 直接覆盖
  if ('cache' in userRoute) route.cache = formatRouteCacheOption(userRoute); // cache 也直接覆盖
  if ('debug' in userRoute) route.mock.debug = userRoute.debug;

  let {params, query, data} = parseUserArgs(userArgs, route);

  http.path = getFullPathFromParams(http.path, params);
  http.params = params;
  http.query = query;
  http.data = data;

  // 每次都计算，主要是用户可能配置了一个时间范围
  route.mock.delay = getDelayTime(route.mock.delay);

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
export function formatResource(resource, resourceKey) {
  return util.objectKeys(resource).reduce((result, key) => {

    let definition = resource[key],
      definitionType = typeof definition;

    let type, alias, defaultValue, read, write;

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

    let typeIndex = SUPPORT_RESOURCE_TYPES.indexOf(type);
    if (typeIndex >= 0) {
      if (typeof defaultValue === 'undefined') defaultValue = SUPPORT_RESOURCE_TYPE_VALUES[typeIndex];
    } else if (type) {
      throw new Error(`Not supported resource type for ${resourceKey}.${key}`);
    } else {
      type = null;
    }

    // TODO 验证 read/write 为 function， alias 为字符串 （当它们不为 null 时）

    // read 表示从 response 中读取数据， write 当前写入到 request 中
    result[key] = {type, alias, defaultValue, read, write};
    return result;
  }, {});
}


/**
 * 将 resource 反转
 *
 * 上面函数返回的值是给 resquest 时用的，此函数返回的是给 response 用的
 */
export function reverseResource(resource, resourceKey) {
  let result = {};

  util.each(resource, function (config, key) {
    let {type, alias, defaultValue, read, write} = config;
    if (alias) [key, alias] = [alias, key];
    [read, write] = [write, read];
    result[key] = {type, alias, defaultValue, read, write};
  });

  return result;
}
