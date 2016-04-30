
export default {
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
      case: 'camel', // 命名风格，可以为 camel/kebab/snake/cap 或自己实现，即指定一个 function
      deep: 0 // deep 默认就是 0，忽略此参数时，可以直接写成 naming: 'camel'
    }
  },

  // 可能需要实现的一个方法，默认是调用 jquery 中的 ajax 方法的
  handle(target, callback) {
    if (this.mock.memory) return callback(target.error, target.data);

    let ajax = window.jQuery && window.jQuery.ajax;
    if (ajax) {
      return ajax(target.http)
        .success(data => callback(null, data))
        .error(xhr => callback(xhr));
    }

    throw new Error('Need implement handler function in options');
  },

  mocks: {
    /* 全局默认的 mock
    $default: {
      status: 0,
      data: null,
      message: ''
    }
    */
  },
  resources: {},
  routes: {}
};
