

//============================================
//===== 基本配置
//============================================

/**
 * 路由的名称，用户自定义的值，在调用 ajax 可以通过此名称去调用，而不用关注 ajax 细节
 */
declare type EARouteName = string;

/**
 * 实体的名称，类似于数据库里的实体，通过配置 EAOptionResources，可以对数据源进行批量格式化
 */
declare type EAResourceName = string;

/**
 * 能用的一个回调函数
 */
interface EACallback {
  (err?: any, data?: any): void
}

/**
 * 通过 EAApi 可以调用 ajax 接口
 */
interface EAApi<T, R> {
  (data?: T, config?: {
    http?: EAOptionHttp;
    mock?: EAOptionMock;
    debug?: boolean;
    cache?: EAOptionCache;
  }): Promise<R>;
}


//============================================
//===== query/data option
//============================================

/**
 * elegant-api 会将 string 配置按一定规则解析成此 EAOptionQueryAndDataObject 对象，规则如下：
 *
 * - 'userid=:uid'  转化成  uid: { alias: 'userid', required: true }
 * - 'userid='      转化成  userid: { required: true }
 * - 'userid=3'     转化成  userid: { value: '3' }
 * - 'userid'       转化成  userid: { }
 *
 * 再用 query 的形式可以将不同的参数组合起来，如
 *
 * - 'userid=&version=1'  转化成 {userid: {required: true}, version: {value: '1'}}
 *
 */
declare type EAOptionQueryAndData = string | EAOptionQueryAndDataObject;
interface EAOptionQueryAndDataObject {
  [key: string]: {
    alias?: string; // 别名
    value?: any; // 默认值
    required?: boolean; // 是否是必须参数
  }
}

//============================================
//===== request/response option
//============================================

/**
 *
 * - 如果是 request，表示对 request 的 data 进行处理
 * - 如果是 response，表示对 response 的所有数据进行处理
 *
 * 注意到下面有 pathToKey, pathToOldKey, pathToNewKey，它们的写法是一样的
 * 是用来定位到你要处理的数据在原来 data 中的位置的
 *
 * 比如你有一个 data 为
 *
 * ```
 * data = {
 *   a: { a1: 1, a2: 2 },
 *   b: [
 *     {bb: 3},
 *     {bb: 4}
 *   ]
 * }
 * ```
 *
 * 如果 pathToKey 为 'a.a1'，就会定位 data.a.a1 中的值 1
 * 如果 pathToKey 为 'b.[].bb'，就会定位到 data.b 下的数组下的对象中的所有 bb
 *
 */
interface EAOptionRequestAndResponse {
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

  order?: Array<EAOptionRequestAndResponseOrder>;
}

/**
 * EAOptionRequestAndResponse 中的 order 中的值
 */
declare type EAOptionRequestAndResponseOrder = 'resource' | 'alias' | 'computed' | 'drop' | 'map' | 'naming';

//============================================
//===== cache option
//============================================

/**
 * 当为 EAOptionCacheSmart 时, 表示用 GET、HEAD 请求时就启用缓存， 其它则禁用
 */
declare type EAOptionCache = EAOptionCacheSmart | boolean;
declare type EAOptionCacheSmart = 'smart';


//============================================
//===== http option
//============================================

/**
 * 常规的 http 配置，可以参考 jQuery 的 ajax 配置
 */
interface EAOptionHttp {
  method?: string; // GET, HEAD, POST ... 不区分大小小
  crossOrigin?: boolean; // jQuery ajax 中的，表示是否跨域
  dataType?: string; // jQuery ajax 中的，表示返回的参数类型
  data?: any; // 请求的参数
  headers?: {
    [headerName: string]: any;
  };
  [httpName: string]: any; // 可以添加其它的任何 http 参数

  /**
   * 这个不需要配置，是根据你上面的配置生成的
   */
  url?: string;
}

//============================================
//===== handle option
//============================================
/**
 * 函数内应该先判断下 this.mock.memory，如果是 true 的话就不用调用 ajax
 */
interface EAOptionHandle {
  (target: EAOptionHandleTarget, cb: EACallback): void;
}


interface EAOptionHandleTarget {
  http: EAOptionHttp;
  data: any; // mock 或 server 返回的数据
  error: any; // mock 或 server 返回的失败原因
}


//============================================
//===== routes option
//============================================
interface EAOptionRoutes {
  [routeName: string]: EAOptionRoutesItem;
}

/**
 *  EAOptionRoutesItem 主要用覆盖 elegant-api 中的全局的配置的
 */
interface EAOptionRoutesItem {
  debug?: boolean;
  cache?: boolean;
  path?: string;
  method?: string;
  mock?: EAOptionMock,
  query?: EAOptionQueryAndData;
  data?: EAOptionQueryAndData;
  request?: EAOptionRequestAndResponse;
  response?: EAOptionRequestAndResponse;
  http?: EAOptionHttp;
  /**
   * 用于删除指定的 EARouteName 上的所有的缓存
   */
  removeCache?: EARouteName | Array<EARouteName>;
}

//============================================
//===== mock option
//============================================
interface EAOptionMock {
  disabled?: boolean; // 是否完全禁用所有的 mock 功能
  memory?: boolean; // 是否使用 memory，使用后不会向后端发送数据，但需要有 RouteMockOptins 配置
  delay?: number | { min?: number, max?: number };  // 延时接口返回（毫秒）

  // 下面是两个服务端的配置，如果你要自定义自己的 mock 服务器才需要配置
  // 另外可能你需要看下 plugins 目录下的源代码
  server?: string; // 指定 mock 服务器，所以请求会发送到此服务器上，可以配置成如：'127.0.0.1:9010'
  proxy?: string; // 和 server 配置一样，用来指定代理服务器，此服务器只会转发接收到的数据（作用不是很大，将来可能废弃）

  // 下面不用配置，它会自动添加上，在 EAMockHandle 中的 EAMockHandleTarget.mock 会出现
  name?: EARouteName;
}

//============================================
//===== mocks option
//============================================
interface EAOptionMocks extends EAMockHelper {
  // routeName 要和 routes 中的 routeName 对应
  [routeName: string]: EAOptionMocksItem;

  // 指定默认的 mock，如果没有配置对应的 routeName，都会调用此
  // 后端很多 POST 接口都只会返回是否提交成功，所以用此会省掉定义很多 routeName
  $default?: EAOptionMocksItem;
}

declare type EAOptionMocksItem = any | EAMockHandle;

interface EAMockHandle {
  (target: EAMockHandleTarget, cb: EACallback): void;
}

interface EAMockHandleTarget {
  mock: EAOptionMock;
  data: any;
  query: any;
  params: any;
  ea: any;
}

interface EAMockHelper {
  $objectify?: (target: EAMockHandleTarget, routeName: EARouteName) => Promise<any>;
  $objectifyAll?: (target: EAMockHandleTarget, rotueNames: Array<EARouteName>) => Promise<any>;
  $fetch?: (target: EAMockHandleTarget, routeName: EARouteName, config?: any) => Promise<any>;
  $fetchAll?: (target: EAMockHandleTarget, routeNameConfigObje: {[routeName: string]: any}) => Promise<any>;
}


//============================================
//===== resource option
//============================================
interface EAOptionResources {
  [resourceName: string]: EAOptionResourcesItem;
}

interface EAOptionResourcesItem {
  [resourceKey: string]: {
    type?: any;
    alias?: string;
    defaultValue?: any;
    read?: (any) => any;
    write?: (any) => void;
  } | string | any;
}


interface EAOptions {
  debug?: boolean; // 开启调试模式（现在还没有任何实现）
  base?: string; // 指定基准路径，这样在单独的 route 中只要指定不同的部分即可
  path?: string; // 指定默认的路径，RouteOptins 中如果也配置了会覆盖此值
  query?: EAOptionQueryAndData; // 指定默认的 query 参数，RouteOptins 中如果也配置了会覆盖同名的参数
  data?: EAOptionQueryAndData; // 指定默认的 data 参数，RouteOptins 中如果也配置了会覆盖同名的参数
  request?: EAOptionRequestAndResponse; // 指定默认的 request 参数，RouteOptins 中如果也配置了会覆盖同名的参数
  response?: EAOptionRequestAndResponse; // 指定默认的 response 参数，RouteOptins 中如果也配置了会覆盖同名的参数


  // 来自于 vue-resource
  emulateJSON?: boolean; // 添加 header: Content-Type=application/x-www-form-urlencoded，同时对参数 urlencode 处理
  emulateHTTP?: boolean; // PUT/PATCH/DELETE 请求替换成 POST，同时加上 header: X-HTTP-Method-Override=原来的 METHOD

  // 是否缓存 response， RouteOptins 可以覆盖此配置
  cache?: EAOptionCache;

  // 很多参数不一定要放在 HttpOptions 中，也可放在 EAOptions 或者 RouteOptins 的最外层
  // 它自动会添加进 http 内，比如参数 method, path, query, data, headers 等 HttpOptions 中存在的 keys
  // RouteOptins 中如果也配置了会 deepExtend 此值
  http?: EAOptionHttp;

  // 自定义的 ajax 请求在这里
  handle?: EAOptionHandle;

  // 配置具名路由，路由名称由你自己指定
  // 这样你想要请求某个接口时，只需要调用这个 routeName，而不用关心 ajax 的细节
  routes?: EAOptionRoutes,

  // mock 相关的基本配置
  mock?: EAOptionMock;

  // mocks 主要用在测试环境，正式环境不应该存在
  mocks?: EAOptionMocks,

  // resource 主要用来可以批量处理 发送的或者返回 的数据
  // 比如服务端可以会提供很多 user 相关的接口：userDetail, usersList
  // 如果我们要对每个接口的参数都去配置 RequestAndResponseOption 会显得非常麻烦
  // 如果我们只配置一个 user 的 resource，这样只要在 user 相关的接口指定哪个路径上是 user 就行了
  // elegant-api 会自动将这个路径上的 user 信息进行相应的转化
  resource?: EAOptionResources;
}

// interface EaElegantApiFunction {
//   (eaOptions: EaOptions, mocks?: EaMocksOptions): any;
// }



interface ElegantApiColluction {
  $request(reouteName: EARouteName, params?: any, reouteConfig?: any, callback?: EACallback): Promise<any>;
  $request(reouteNames: Array<EARouteName>, seriesConfig?: any, routeConfigObj?: any, callback?: EACallback): Promise<any>;
  $request(reouteNameObj: any, parallelConfig?: any, routeConfigObj?: any, callback?: EACallback): Promise<any>;

  $r(key: EAResourceName): any;
  $resource(key: EAResourceName): any;

  [routeName: string]: any;
}

interface ElegantApi {
  (options: EAOptions, mocks?: EAOptionMocks): ElegantApiColluction | any;
}

// declare module 'elegant-api' {}
