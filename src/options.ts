// 常规的 http 配置，可以参考 jQuery 的 ajax 配置
export interface EaHttpOptions {
  method?: string; // GET, HEAD, POST ... 不区分大小小
  crossOrigin?: boolean; // jQuery ajax 中的，表示是否跨域
  dataType?: string; // jQuery ajax 中的，表示返回的参数类型
  data?: any; // 请求的参数
  headers?: {
    [headerName: string]: any;
  };
  [httpName: string]: any; // 可以添加其它的任何 http 参数
}

// EaRequestAndResponseOptions 中的 order 中的值
export type EaOrderKey = 'resource' | 'alias' | 'computed' | 'drop' | 'map' | 'naming';

/*
  - 如果是 request，表示对 request 的 data 进行处理
  - 如果是 response，表示对 response 的所有数据进行处理

  注意到下面有 pathToKey, pathToOldKey, pathToNewKey，它们的写法是一样的
  是用来定位到你要处理的数据在原来 data 中的位置的。

  比如你有一个 data 为

  ```
  data = {
    a: { a1: 1, a2: 2 },
    b: [
      {bb: 3},
      {bb: 4}
    ]
  }
  ```

  如果 pathToKey 为 'a.a1'，就会定位 data.a.a1 中的值 1
  如果 pathToKey 为 'b.[].bb'，就会定位到 data.b 下的数组下的对象中的所有 bb
*/
export interface EaRequestAndResponseOptions {
  resource?: {
    [pathToKey: string]: string; // value 是 resourceName
  };
  alias?: {
    [pathToOldKey: string]: string; // value 是要使用的新的键名
  };
  computed?: {
    [pathToNewKey: string]: (any) => any;
  };
  drop?: string | Array<string>; // 指定要删除的键
  map?: (any) => any;

  // 统一化数据中的键的命名风格，支持：camel/kebab/snake/cap
  naming?: string | { case: string, deep: number };

  order?: Array<EaOrderKey>;
}

/*
  elegant-api 也魂将此对象配置成字符串
  也就是说它会将字符串按一定规则解析成此对象

  比如：
  * 'userid=:uid'  转化成  uid: { alias: 'userid', required: true }
  * 'userid='      转化成  userid: { required: true }
  * 'userid=3'     转化成  userid: { value: '3' }
  * 'userid'       转化成  userid: { }

  再用 query 的形式可以将不同的参数组合起来，如
  * 'userid=&version=1'  转化成 {userid: {required: true}, version: {value: '1'}}
*/
export interface EaQueryAndDataOptions {
  [key: string]: {
    alias?: string; // 别名
    value?: any; // 默认值
    required?: boolean; // 是否是必须参数
  }
}

// @TODO 描述
export interface EaResourceOptions {
  [resourceKey: string]: {
    type?: any;
    alias?: string;
    defaultValue?: any;
    read?: (any) => any;
    write?: (any) => void;
  } | string | any;
}

// RouteOptins 主要用覆盖 elegant-api 中的全局的配置的
export interface EaRouteOptins {
  cache?: boolean;
  path?: string;
  method?: string;
  query?: string | EaQueryAndDataOptions;
  data?: string | EaQueryAndDataOptions;
  request?: EaRequestAndResponseOptions;
  response?: EaRequestAndResponseOptions;
  http?: EaHttpOptions;
  removeCache: string | string[]; // string 是 routeName，用于删除此 routeName 上的所有的缓存
}

export interface EaMockOptions {
  disabled?: boolean; // 是否完全禁用所有的 mock 功能
  memory?: boolean; // 是否使用 memory，使用后不会向后端发送数据，但需要有 RouteMockOptins 配置
  delay?: number | { min?: number, max?: number };  // 延时接口返回（毫秒）

  // 下面是两个服务端的配置，如果你要自定义自己的 mock 服务器才需要配置
  // 另外可能你需要看下 plugins 目录下的源代码
  server?: string; // 指定 mock 服务器，所以请求会发送到此服务器上，可以配置成如：'127.0.0.1:9010'
  proxy?: string; // 和 server 配置一样，用来指定代理服务器，此服务器只会转发接收到的数据（作用不是很大，将来可能废弃）

  // 下面不用配置，它会自动添加上，在 RouteMockFunction 中的 target.mock 会出现
  name?: string; // routeName;
}

export interface EaMocksOptionsFunction {
  (
    target: {
      mock: EaMockOptions;
      data: any;
      query: Object;
      params: Object;
      ea: Object;
    },

    // data 是返回的最终数据
    cb: (err?: any, data?: any) => void

  ): void;
}

export interface EaMocksOptions {
  // routeName 要和 routes 中的 routeName 对应
  [routeName: string]: any | EaMocksOptionsFunction;

  // 指定默认的 mock，如果没有配置对应的 routeName，都会调用此
  // 后端很多 POST 接口都只会返回是否提交成功，所以用此会省掉定义很多 routeName
  $default?: any | EaMocksOptionsFunction;
}

export interface EaOptions {
  debug?: boolean; // 开启调试模式（现在还没有任何实现）
  base?: string; // 指定基准路径，这样在单独的 route 中只要指定不同的部分即可
  path?: string; // 指定默认的路径，RouteOptins 中如果也配置了会覆盖此值
  query?: string | EaQueryAndDataOptions; // 指定默认的 query 参数，RouteOptins 中如果也配置了会覆盖同名的参数
  data?: string | EaQueryAndDataOptions; // 指定默认的 data 参数，RouteOptins 中如果也配置了会覆盖同名的参数
  request?: EaRequestAndResponseOptions; // 指定默认的 request 参数，RouteOptins 中如果也配置了会覆盖同名的参数
  response?: EaRequestAndResponseOptions; // 指定默认的 response 参数，RouteOptins 中如果也配置了会覆盖同名的参数


  // 来自于 vue-resource
  emulateJSON?: boolean; // 添加 header: Content-Type=application/x-www-form-urlencoded，同时对参数处理
  emulateHTTP?: boolean; // PUT/PATCH/DELETE 请求替换成 POST，同时加上 header: X-HTTP-Method-Override=原来的 METHOD

  // 是否缓存 response， RouteOptins 可以覆盖此配置
  cache?: string | boolean; // 当为 string 时，只能是 'smart', 表示用 GET、HEAD 请求时就启用缓存， 其它则禁用

  // 很多参数不一定要放在 HttpOptions 中，也可放在 EAOptions 或者 RouteOptins 的最外层
  // 它自动会添加进 http 内，比如参数 method, path, query, data, headers 等 HttpOptions 中存在的 keys
  // RouteOptins 中如果也配置了会 deepExtend 此值
  http?: EaHttpOptions;

  // 自定义的 ajax 请求在这里
  // 同时函数内应该先判断下 this.mock.memory，如果是 true 的话就不用调用 ajax
  handle: EaMocksOptionsFunction;

  // 配置具名路由，路由名称由你自己指定
  // 这样你想要请求某个接口时，只需要调用这个 routeName，而不用关心 ajax 的细节
  routes?: {
    [routeName: string]: EaRouteOptins
  },

  // mock 相关的基本配置
  mock: EaMockOptions;

  // mocks 主要用在测试环境，正式环境不应该存在
  mocks?: EaMocksOptions,

  // resource 主要用来可以批量处理 发送的或者返回 的数据
  // 比如服务端可以会提供很多 user 相关的接口：userDetail, usersList
  // 如果我们要对每个接口的参数都去配置 RequestAndResponseOption 会显得非常麻烦
  // 如果我们只配置一个 user 的 resource，这样只要在 user 相关的接口指定哪个路径上是 user 就行了
  // elegant-api 会自动将这个路径上的 user 信息进行相应的转化
  resource?: {
    [resourceName: string]: EaResourceOptions;
  };
}
