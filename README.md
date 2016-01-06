# elegant-api

优雅的定义 API 接口

## 使用

```es6
import elegantApi from 'elegant-api';

/****  定义接口 ****/

let options = {
  mock: 'local',
  mockDelay: {min: 300, max: 5000},
  base: '/api/v1/backend/',

  http: {
    // http 相关的信息
  },

  routes: {
    user: {
      query: 'uid=',
      method: 'get',
      cache: true,
      response: {
        alias: {
          'data.user_nick': 'nickname' // 将返回的字段中的 data.user_nick 转化成 data.nickname
        }
      }
    }
  }
};

let mocks = { // 发布上线后不需要要保留 mocks
  user: {
    status: 0,
    message: 'ok',
    data: {
      uid: 1,
      user_nick: 'Alex',
      username: 'Alex Zheng'
    }
  }
}; 

let api = elegantApi(options, mocks);


/**** 调用接口 *****/

api.user({uid: 3}, (err, data) => {
  // data 将会是 mocks 中指定的 user
});

// 或者使用

api.$request('user', {uid: 3}, (err, data) => {});

```

[更多配置请参考这里](./src/defaultHttpOptions.jsx)

## 特点

1. 六种开发模式
  * **MEMORY 模式：** 无后端，无服务器，后端数据通过前端直接 mock (`mock = 'memory'`)
  * **REMOTE 模式：** 在 local 服务器上嵌入 mock 服务器，数据从 mock 服务器生成 (`mock = {proxy: false}`)
  * **PROXY  模式：** 在 local 服务器上嵌入 proxy 服务器，后端数据通过代理服务器传给前端 (`mock = {proxy: 'http://backend.server.com'`)
  * **REMOTE STANDALONE 模式：** 使用一个独立的 mock 服务器 (`mock = {server: 'http://mock.server.com'`)
  * **PROXY  STANDALONE 模式：** 使用一个独立的 proxy 服务器 (`mock = {server: 'http://mock.server.com', proxy: 'http://backend.server.com'`)
  * **ONLINE 模式：** 线上模式，无任何 mock (`mock = false`)
2. **alias：** 可以对 request data 或 response data 中的字段取别名
3. **map：** 可以返回一个新的 request data 或 response data
4. **computed：** 可以在 request data 或 response data 生成新的字段
5. **naming：** 可以统一 request data 或 response data 中的 key 的命名风格，支持：`camel/kebab/snake/cap`
6. **模拟延迟：** `mockDelay=3000` 或者 `mockDelay={min: 100, max: 4000}`
7. **缓存 HTTP 请求：** 默认只有 GET 请求才会缓存，不过可以在任意一个 route 中配置 `cache` 变量，来标识是否使用缓存
8. **emulateJSON 和 emulateHTTP：** 来自于 [vue-resource](https://github.com/vuejs/vue-resource/tree/0.5.1#options)
9. **参数验证：** 支持对设置 request 中的 params, query 和 data 字段，并可以 validate 其中 query 和 data
10. **批量请求：** 
  ```es6
  // 并行
  api.$request({request1: params1, request2: params2}, (errorMap, dataMap) => {
    /* handle */
  });

  // 串行
  api.$request(
    ['request1', 'request2'], 
    {iterator: (key, i, lastError, lastData) => { 
      /* 
        此函数应该返回当前 request 需要的参数，
        如果它返回 false，则当前 request 就不会执行
      */ 
    }},

    (lastError, lastData) => {
      /* handle */
    }
  ) 
  ```

## mock 或 proxy 服务的使用


## 依赖

* JSON: < IE8
* es5-shim: < IE9


## TODO

* [x] path 中可能带参数(params)
* [x] 并行的批量请求不能出现相同的key，可以支持在批量请求的 conf 里定义一个 alias 字段
* [x] mock server 只需要 mock数据就行了，不需要 baseOptions
* [x] 支持通过 cookie 和 query 两种 模式 向 standalone server 发送数据
* [ ] 自动生成后端的 api 文档 https://sample-threes.readme.io/docs/orders
* [ ] 支持定义 resource 
* [ ] monk server 支持永久修改 db 数据



## 其它无关的东西

### TODO

* [ ] 看 angularjs.org 是怎么组织静态资源的


### IDEA

* 后端每次都应该将这些时间返回，方便前端统一上报性能数据

  ```
  request_arrive_time: 1343434343
  response_send_time: 1343436666
  ```
