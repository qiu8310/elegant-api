# elegant-api
[![NPM version](https://badge.fury.io/js/elegant-api.svg)](https://npmjs.org/package/elegant-api)
[![Build Status](https://travis-ci.org/qiu8310/elegant-api.svg?branch=master)](https://travis-ci.org/qiu8310/elegant-api)
[![Coverage Status](https://coveralls.io/repos/qiu8310/elegant-api/badge.png)](https://coveralls.io/r/qiu8310/elegant-api)

**优雅的定义 API 接口**

>
> 你是不是会遇到这样的场景：
>
> * ajax 接口分散在各个地方，难以维护;
> * 后端修改接口，可能需要前端大量修改;
> * 后端的命名风格和前端不一致，造成前端代码风格怪异;
> * 后端无法提前提供给接口给前端使用，造成前端无法开发一些依赖于后端的复杂的功能;
> * ...
>

elegant-api 可以帮你解决上面的所有问题，你可以将所有的 ajax 请求定义在一个单独的文件中，
通过给每个请求配置一些 ajax 需要的参数，同时指定一个你自定义的名称，
当要调用这个接口时，只需要调用你指定的名称即可，这样就解偶了对后端的依赖；
当然，在你配置 ajax 时，还可以配置对请求的参数进行验证，
同时还可以配置对返回的参数进行格式化（ elegant-api
提供了一整套格式化后端返回的数据的实用方法[见下文](#format)）。
要说明的是 elegant-api 并不提供 ajax 请求的方法，所以你需要引用第三方
ajax，比如 jquery 的 ajax，或者 html5 标准的 fetch（[为什么不提供 ajax](#qa-inline-ajax)）。


**用 elegant-api 甚至可以用在 Test 中 (@TODO: 写个 example)。**

BTW，像这篇文章【[Angular2 mock backend](http://www.sitepoint.com/angular-2-mockbackend/)】这样写 mock，太累了

## 使用

### 依赖

* [JSON](https://github.com/douglascrockford/JSON-js): < IE8
* [es5-shim](https://github.com/es-shims/es5-shim): < IE9
* [es6-promise](https://github.com/stefanpenner/es6-promise): 可选，强烈建议引用，这样你调用接口非常方便，否则需要用 callback 的形式接收返回的参数

### 安装

1. 用 npm 安装

  ```bash
  npm install elegant-api
  ```

2. 应用

  ```js
  // 如果是通过 script 脚本直接引用 elegant-api 脚本
  // 也会在全局写入 elegantApi 的函数
  // 这里演示的是用 commonjs 的使用方法
  var elegantApi = require('elegant-api');  
  var api = elegantApi({/* 这里是一大堆配置 */});

  // promise
  api.getUser({uid: 100})  // getUser 是配置中配置好的 route
    .then(user => {
      // ...
    });

  // no promise
  api.getUser({uid: 100}, function (err, user) {
    // ...
  });
  ```

### 在 typescript 中使用

```ts
/// <reference path="node_modules/elegant-api/src/type.d.ts" />

let elegantApi: ElegantApi = require('elegant-api');

interface API extends ElegantApiColluction {
  getUser: EAApi;
}

let api: API = elegantApi({
  handle(target: EAOptionHandleTarget, cb: EACallback) {
    cb(target.error, target.data);
  },
  routes: {
    getUser: {
      path: '/users',
      query: 'uid='
    }
  },
  mocks: {
    getUser(target: EAMockHandleTarget, cb: EACallback) {
      let user = {
        uid: target.query.uid,
        name: 'Mora'
      };
      cb(null, user);
    }
  }
});

api.getUser({uid: 123}).then(data => {
  console.log(data); // {uid: 123, name: 'Mora'}
});
```


### 配置

* [typescript 配置描述](./src/type.ts)
* [默认的配置](./src/libs/defaultOptions.jsx)


<a id="format"></a>
### 格式化数据 ([参考 data-transform](https://github.com/qiu8310/data-transform))

```js
  //...
  routes: {
    // 创建新用户接口
    createUser: {
      path: '/users',
      method: 'post'
      request: {
        naming: 'snake', // 将请求的数据全部转化成 snake(如：foo_bar) 格式
        drop: [
          'user.extra' // 删除提交的数据中的无用数据
        ]
      },
      response: {
        alias: {
          'user.id': 'uid' // 将返回的 user.id 重命名成 user.uid
        },
        computed: { // 计算出新的 key
          ['user.age']() {
            return new Date().getFullYear() - this.year;
          }
        },
        map(data) { // 处理后端返回的整个数据
          delete data.foo;
          return data;
        }
      }
    },

    // 获取用户信息
    getUser: {
      path: '/users',
      query: 'uid=',
      response: {
        resource: {
          '': 'user' // key 是空表示对当前对象处理
        }
      }
    }
  }
  //...
  resources: {
    user: { // 如果没有设置 type，则 defaultValue 值为 null
      uid: Number,
      username: {
        type: String,
        alias: 'user_name'
      },
      gender: {
        type: String,
        defaultValue: 'M',
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
  //...
```

- alias 生成别名
- computed 生成新的键
- drop 删除一些不用的键
- map 处理整个数据，需要返回一个新的数据
- naming 对键的命名风格进行统一化
- resource 对某一路径上的对象进行统一处理（需要先配置 resources）

注意：将来可能会引用 `data-transform`，因为现有的格式化代码的问题在于，它是一步步格式化的，
就是说执行了 alias 之后，数据就变了，它就会影响后面的数据，而 `data-transform` 是同时处理的，
它几乎没有顺序问题；所以现在的配置中有个 order 选项，可以用来配置处理顺序。

<a id="useMock"></a>
### mock 使用说明

```js
  //...
  mocks: {
    // 可以直接返回数据
    getUser: {
      status: 0,
      data: {
        id: 1,
        name: 'Alex',
        //...
      }
    },

    // 也可以提供一个函数，函数通过回调函数提供数据
    getAddress(target, callback) {
      // ...
      callback(null, {/* address data */});
    }
  }
  //...
```


<a id="mockHelper"></a>
### mock 实用方法（需要 Promise 支持）([源码](./src/libs/mockHelper.jsx))

当 mocks 中的配置是函数时，如上面的 `getAddress`，可以在函数的 this 作用域中找到下面四个函数

- `$objectify(target, mockName)` 

  将 mockName 转化成返回数据的形式，而不是一个函数（当然这个 mockName 应该不需要参数，需要参数需要使用 $fetch）

- `$objectifyAll(target, mockNames)`
- `$fetch(target, mockName, conf)` 

  提供 conf 参数，获取 mockName 中的数据

- `$fetchAll(target, mockNameConfObj)`


<a id="qa"></a>
## 常见问题

<a id="qa-inline-ajax"></a>
1. 为什么 elegant-api 不内嵌一个 ajax 方法？

  * 很多框架都有自带的 ajax 方法，所以没有必要增加一个，带来多余代码
  * elegant-api 支持在配置中指定 handle 函数，这样你可以方便的在 handle 中用任意的 ajax 库，也可以对请求参数或返回的参数进行处理
  


## 代码测试

* Watch 模式

  - `npm run test-fe-server`
  - `npm run test-rd-server`
  - `npm run test-watch`

* 单次运行模式

  - `npm run test`


<a id="todo"></a>
## 待办事项
* [x] 一个请求中有三种类型的参数（params: location.pathname 上的, query: location.search 上, data: post body)
* [x] 并行的批量请求不能出现相同的key，可以支持在批量请求的 conf 里定义一个 alias 字段
* [x] mock server 只需要 mock 数据就行了，不需要 baseOptions，也就不用新起一个 EelgantApi 对象
* [x] 支持通过 cookie 和 query 两种 模式 向 standalone server 发送数据
* [x] 支持定义 resource 
* [x] monk server 支持永久修改 db 数据 —— 通过在 url search 加上带 __ 开头的参数，这些参数会持久保存在 localStorage 中
* [x] 支持清除某个 router 的所有缓存 —— 添加了 api.removeCache(routeNames)，或者在 routes 中配置 removeCache 属性)
* [x] 支持默认的 mock，只需要在 mocks 中配置一个 `$default` 属性即可 （如果没有找到对应的 mock 就用默认的，因为有很多 POST 或 DELETE 请求只需要知道结果就行了）
* [x] 支持在调用时配置 http 请求(只能配置 http, mock, debug, cache 这四个属性)
* [x] path 支持动态变化 (http 中的 path 选项可以动态配置，所以此项也就完成了)
* [x] 加入 Promise 支持
* [x] 参数支持数组或其它非 PlainObject 类型 —— 提供参数时一定要加上 data 属性，如 `{data: anyTypeParams, query: ..., params: ...}`，注意：用了此类型就无法指定参数是否可选，或者验证参数的合法性
* [ ] 实现 debug 功能
  - [ ] 可以对单独的某一个接口进行 debug
  - [ ] debug 参数也需要传给 mock 服务端（如果有的话），也就是说 mock 服务端也需要支持 debug
* [ ] 自动生成后端的 api 文档 https://sample-threes.readme.io/docs/orders
* [ ] 支持添加 request 和 response 的 interceptor
* [ ] request 中的 map 只能 map data，希望可以支持 mapPath, mapQuery
* [ ] resource 支持 get/set/post/put/delete 方法


## Demos

* [demos（很久没更新了，应该会有问题）](./demos/)


--------------------------

## 其它无关的东西

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

    - handle
    - http：http 中所有属性可以直接在最外层的 commonOptions 中设置，系统会自动将支持的属性读取过来
* [ ] route 中特有的属性
    - request/response


* [ ] debug：并且可以单独对某一个 route 开启或关闭，同时可以将 debug 同步到后端 server
  - [ ] 确定 debug 需要输出哪些字段
* [ ] 可以在共用 options 中设置 base 和 path，可以在 route 中覆盖它们，并且 http.url 是通过它们组装的，
      组装后要去掉 url 中的多余的反斜杠 "//"，但不要去掉 "http://" 里面的
* [ ] GET/HEAD 请求不用 body 字段


### TODO

* [ ] 看 angularjs.org 是怎么组织静态资源的


### IDEA

* 后端每次都应该将这些时间返回，方便前端统一上报性能数据

  ```
  request_arrive_time: 1343434343
  response_send_time: 1343436666
  ```
