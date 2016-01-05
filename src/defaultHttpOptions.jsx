
export default {
  debug: true, // 开启调试模式
  base: '', // 指定基准路径，这样在单独的 route 中只要指定不同的部分即可
  path: '',

  // 来自于 vue-resource
  emulateJSON: false,
  emulateHTTP: false,

  cache: 'smart', // 只有 GET 请求才会缓存，另外可以单独在 route 中指定 true 或者 false

  mock: 'local', // false/local/[server_host:server_port]
  mockDelay: { min: 200, max: 3000 }, // 或者指定为一个具体的数字

  // 这里的设置不会被单独的 route 覆盖
  global: {
    eaQueryPrefix: '__',
    cacheSize: 100,
    cacheMap: {},
    cacheStack: []
  },

  http: {

    method: 'GET',
    crossOrigin: false,
    // url: null, // url 不用设置，会根据配置自动生成合适的值
    // body: null, // fetch api 标准是用 body
    data: null, // 而 jquery 用的是 data，这里兼容两者，设置的时候只需要设置 data 就行，系统会自动同步数据到 body
    headers: {
      // 'Content-Type': 'application/json;charset=utf-8',
      // 'Content-Type': 'application/x-www-form-urlencoded',
    }
  },

  request: {
    naming: null,
    order: ['alias', 'computed', 'map', 'naming']
  },

  response: {
    naming: 'camel', // 命名风格，可以为 camel/kebab/snake/cap 或自己实现，即指定一个 function
    order: ['alias', 'computed', 'map', 'naming']
  },

  // 必需实现的一个方法，默认是调用 jquery 中的 ajax 方法的
  // 如果 mock 值为 local 时，则不会调用此方法
  handler(http, callback) {
    let $ = window.jQuery && window.jQuery.ajax;
    if ($) {
      return $(http)
        .success(data => {
          if (data.status === 0) callback(null, data.data);
          else callback(data);
        })
        .error(xhr => callback(xhr));
    }

    throw new Error('Need implement handler function in options');
  },

  routes: {
    /*
    example: {
      // 所有 http 的属性都可以直接在这里写，会自动合并的 http 中
      method: 'POST',

      // key=固定的值   透传给后端
      // key           此 key 是一个可选的参数
      // key=          此 key 是一个必需要的参数
      // key=:alias    此 key 的值是通过 alias 来传递进来的
      query: 'action=GetUserInfo&ab&bar=&foo=:foos',

      // 另外 query 和 data 还支持下面这种设置方法
      data: {
        userAge: {
          required: true,
          validate: /^\d+$/, // 或者 function
          alias: 'age'
        },
        userName: { // 或者直接写 userName: 'Alex'
          value: 'Alex'
        }
      },

      cache: true,

      request: {
        // alias、computed 和 map 只针对 data，不针对 query，query 可以通过指定 path 实现
        alias: {},
        computed: {},
        map() {}
      },

      response: {
        // 先 alias => computed => map
        alias: {
          'data.total': 'userTotal', // 将 data 下的 key 为 total 的项转化成 userTotal
          'data.list.[].user_name': 'username',
          data: {
            size: 'length',  // 只有 data 下的 size 会被替换成 length
            list: {
              '[]': {
                user_sex: 'gender' // data.list 是个数组，数组中的每一项中的 key 为 user_sex 的项都会被替换成 gender
              }
            }
          }
        },

        computed: {
          // 在 data 中定义一个 length 属性，有下面两种不同的实现方法：
          'data.length': function (currentObj, rootObj) {
            return currentObj.size;
          },
          data: {
            length() {
              return 5;
            }
          }
        },

        map(rootObj) {
          return rootObj;
        }
      }
    }
    */
  }
};
