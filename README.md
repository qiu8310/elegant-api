# elegant-api（开发中，文档尚不规范）
[![NPM version](https://badge.fury.io/js/elegant-api.svg)](https://npmjs.org/package/elegant-api)
[![Build Status](https://travis-ci.org/qiu8310/elegant-api.svg?branch=master)](https://travis-ci.org/qiu8310/elegant-api)
[![Coverage Status](https://coveralls.io/repos/qiu8310/elegant-api/badge.png)](https://coveralls.io/r/qiu8310/elegant-api)


优雅的定义 API 接口

像这篇文章【[Angular2 mock backend](http://www.sitepoint.com/angular-2-mockbackend/)】这样写 mock，太累了

## 开发

* Watch Mode

  - npm run test-fe-server
  - npm run test-rd-server
  - npm run test-watch

* Single Run Mode

  - npm run test

## 使用

[配置请参考这里](./src/libs/defaultOptions.jsx)

## 特点

1. 五种开发模式
  * **MEMORY 模式：** 无后端，无服务器，后端数据通过前端直接 mock (`mock = {memory: true}`)
  * **PROXY  模式：** 在 local 服务器上嵌入 proxy 服务器，后端数据通过代理服务器传给前端 (`mock = {proxy: 'http://backend.server.com'`)
  * **REMOTE STANDALONE 模式：** 使用一个独立的 mock 服务器 (`mock = {server: 'http://mock.server.com'`)
  * **PROXY  STANDALONE 模式：** 使用一个独立的 proxy 服务器 (`mock = {server: 'http://mock.server.com', proxy: 'http://backend.server.com'`)
  * **ONLINE 模式：** 线上模式，无任何 mock (`mock = {disabled: true}`)
2. **alias：** 可以对 request data 或 response data 中的字段取别名
3. **map：** 可以返回一个新的 request data 或 response data
4. **computed：** 可以在 request data 或 response data 生成新的字段
5. **naming：** 可以统一 request data 或 response data 中的 key 的命名风格，支持：`camel/kebab/snake/cap`
6. **模拟延迟：** `mock.delay = 400` 或者 `mock.delay={min: 100, max: 4000}`
7. **缓存 HTTP 请求：** 默认只有 GET 请求才会缓存，不过可以在任意一个 route 中配置 `cache` 变量，来标识是否使用缓存
8. **emulateJSON 和 emulateHTTP：** 来自于 [vue-resource](https://github.com/vuejs/vue-resource/tree/0.5.1#options)
9. **参数验证：** 支持对设置 request 中的 params, query 和 data 字段，并可以 validate 其中 query 和 data
10. **并行/串行 的批量请求：** 


## mock 或 proxy 服务的使用

* 参见 [demos](./demos/pages/)

## 依赖

* JSON: < IE8
* es5-shim: < IE9
* es-promise: 可选


## TODO

* [x] 一个请求中有三种类型的参数（params: location.pathname 上的, query: location.search 上, data: post body)
* [x] 并行的批量请求不能出现相同的key，可以支持在批量请求的 conf 里定义一个 alias 字段
* [x] mock server 只需要 mock数据就行了，不需要 baseOptions，也就不用新起一个 EelgantApi 对象
* [x] 支持通过 cookie 和 query 两种 模式 向 standalone server 发送数据
* [x] 支持定义 resource 
* [x] monk server 支持永久修改 db 数据
* [x] 加入 Promise 支持
* [ ] 自动生成后端的 api 文档 https://sample-threes.readme.io/docs/orders
* [ ] 参数支持数组或其它非 PlainObject 类型
* [x] 支持清除某个 router 的所有缓存 (添加了 api.removeCache(routeNames)，或者在 routes 中配置 removeCache 属性)
* [x] 支持默认的 mock，只需要在 mocks 中配置一个 `$default` 属性即可 （如果没有找到对应的 mock 就用默认的，因为有很多 POST 或 DELETE 请求只需要知道结果就行了）
* [x] 支持在调用时配置 http 请求(只能配置 http, mock, debug, cache 这四个属性)
* [x] path 支持动态变化 (http 中的 path 选项可以动态配置，所以此项也就完成了)
* [ ] 支持添加 request 和 response 的 interceptor
* [ ] request 中的 map 只能 map data，希望可以支持 mapPath, mapQuery
* [ ] resource 支持 get/set/post/put/delete 方法



## TEST CASES

* [ ] globals 属性只能在 commonOptions 中设置，子 route 中设置无效，可配置项是 
      globals: {eaQueryPrefix, cacheSize, cacheMap, cacheStack}
* [ ] routes/mocks/resources
* [ ] 所有可以在子 route 中覆盖 commonOptions 的属性有：
    - debug
    - base/path
    - emulateJSON/emulateHTTP
    - cache
    - mock: {memory: true, server: ..., proxy: ..., delay: {min: 100, max: 3000}}
    - dataTransformMethod: query/cookie

    - order
    - alias/computed/naming/map
    - namingDeep

    - handler
    - http：http 中所有属性可以直接在最外层的 commonOptions 中设置，系统会自动将支持的属性读取过来
* [ ] route 中特有的属性
    - request/response

```
resources: {
  user: { // 如果没有设置 type，则 default 值为 null
    uid: Number,
    username: {
      type: String,
      alias: 'user_name'
    },
    gender: {
      type: String,
      default: 'M',
      alias: 'sex'
    },
    age: {
      type: Number,
      read() {
        return new Date().getFullYear() - this.age;
      },
      write() {
        this.year = new Date().getFullYear() - this.age;
        delete this.age
      }
    }
  }
}
```

* [ ] debug：并且可以单独对某一个 route 开启或关闭，同时可以将 debug 同步到后端 server
  - [ ] 确定 debug 需要输出哪些字段
* [ ] 可以在共用 options 中设置 base 和 path，可以在 route 中覆盖它们，并且 http.url 是通过它们组装的，
      组装后要去掉 url 中的多余的反斜杠 "//"，但不要去掉 "http://" 里面的
* [ ] GET/HEAD 请求不用 body 字段





## 其它无关的东西

### TODO

* [ ] 看 angularjs.org 是怎么组织静态资源的


### IDEA

* 后端每次都应该将这些时间返回，方便前端统一上报性能数据

  ```
  request_arrive_time: 1343434343
  response_send_time: 1343436666
  ```
