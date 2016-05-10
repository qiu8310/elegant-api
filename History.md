
0.0.6 / 2016-05-10
==================

  * fix: 清除过期了的缓存
  * chore: 调整 debug
  * fix: 服务端获取 EA 的 cookie 后马上就删除它
  * feat: 添加 cookie 的过期时间设置
  * chore: 更新 type.d.ts 文件
  * feat: 使 fetch 默认支持 cookie
  * feat: 添加 api. 方法来设置或获取当前缓存数据
  * feat: 支持将 mock.server 指定为 self 关键字
  * fix: 使用了document 等浏览器对象造成在服务端使用报错
  * chore: add build file to git source
  * feat: debug 添加 cache, EAAPI 添加参数，fix cache 失败问题
  * fix: 修复闭包内的变量被篡改了的问题
  * feat: 添加 debug 功能，及 delay 为 0 时，不做异步
  * refactor: http.query 中的 value 强制转化成字符串
  * feat: add typescript support
  * docs: update readme only

0.0.5 / 2016-04-28
==================

  * docs: 更新文档
  * feat: 支持提交非 Object 类型的 POST 数据
  * fix: lint errors
  * feat: 给 mock function 添加一些辅助函数
