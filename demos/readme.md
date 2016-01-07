
## 假设后端提供这么些接口

* `GET    /api/users/:uid` 获取指定用户信息

    {
      status: 0,
      message 'ok',
      data: UserResource
    }
    
* `POST   /api/users     ` 创建一个新用户  

    {
      status: 0,
      message 'ok',
      data: [
        UserResource,
        UserResource,
        ...
      ]
    }

* `PUT    /api/users/:uid` 修改指定的用户

    {
      status: 0,
      message: 'ok',
      data: UserResource
    }

* `DELETE /api/users/:uid` 删除指定的用户

    {
      status: 0,
      message: 'ok',
      data: DeletedUserResource
    }

## User Resource

```
{
  uid: 1,
  username: 'Alex',
  age: 19,
  gender: 'M'
}
```

