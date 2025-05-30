[Skip to content](https://nanomq.io/docs/zh/latest/api/v4.html#VPContent)

On this page

On this page

# HTTP API (V4) [​](https://nanomq.io/docs/zh/latest/api/v4.html\#http-api-v4)

NanoMQ 提供了 HTTP API 以实现与外部系统的集成，例如查询 broker 统计信息、客户端信息、发布消息，订阅主题信息和远程修改配置/重启等。

NanoMQ 的 HTTP API 服务默认监听 8081 端口。可通过 `etc/nanomq.conf` 配置文件修改监听端口，所有 API 调用均以 `api/v4` 开头。

> 访问旧版本 [HTTP API (V1)](https://nanomq.io/docs/zh/latest/api/v1.html)

## 接口安全 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E6%8E%A5%E5%8F%A3%E5%AE%89%E5%85%A8)

NanoMQ 的 HTTP API 使用 [Basic 认证](https://en.wikipedia.org/wiki/Basic_access_authentication) 或 [JWT 认证](https://nanomq.io/docs/zh/latest/access-control/jwt.html) 方式。 `username` 和 `password` 须分别填写。 默认的 `username` 和 `password` 是： `admin/public`。 可通过 `etc/nanomq.conf` 配置文件修改 `username` 和 `password` 。

## 响应码 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E5%93%8D%E5%BA%94%E7%A0%81)

### HTTP 状态码 (status codes) [​](https://nanomq.io/docs/zh/latest/api/v4.html\#http-%E7%8A%B6%E6%80%81%E7%A0%81-status-codes)

NanoMQ 接口在调用成功时总是返回 200 OK ，响应内容则以 JSON 格式返回。

可能的状态码如下：

| Status Code | Description                                              |
| ----------- | -------------------------------------------------------- |
| 200         | 成功，返回的 JSON 数据将提供更多信息                     |
| 400         | 客户端请求无效，例如请求体或参数错误                     |
| 401         | 客户端未通过服务端认证，使用无效的身份验证凭据可能会发生 |
| 404         | 找不到请求的路径或者请求的对象不存在                     |
| 500         | 服务端处理请求时发生内部错误                             |

### 返回码 (result codes) [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E8%BF%94%E5%9B%9E%E7%A0%81-result-codes)

NanoMQ 接口的响应消息体为 JSON 格式，其中总是包含返回码 `code`。

可能的返回码如下：

| Return Code | Description                   |
| ----------- | ----------------------------- |
| 0           | 成功                          |
| 101         | RPC 错误                      |
| 102         | 未知错误                      |
| 103         | 用户名或密码错误              |
| 104         | 空用户名或密码                |
| 105         | 用户不存在                    |
| 106         | 管理员账户不可删除            |
| 107         | 关键请求参数缺失              |
| 108         | 请求参数错误                  |
| 109         | 请求参数不是合法 JSON 格式    |
| 110         | 插件已开启                    |
| 111         | 插件已关闭                    |
| 112         | 客户端不在线                  |
| 113         | 用户已存在                    |
| 114         | 旧密码错误                    |
| 115         | 不合法的主题                  |
| 116         | Token 已过期                  |
| 117         | 请求参数不是合法的 HOCON 格式 |
| 118         | 配置文件写失败                |

## API Endpoints [​](https://nanomq.io/docs/zh/latest/api/v4.html\#api-endpoints)

### GET /api/v4 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4)

返回 NanoMQ 支持的所有 Endpoints 。

**Parameters:** 无

**Success Response Body (JSON):**

| Name                | Type    | Description    |
| ------------------- | ------- | -------------- |
| code                | Integer | 0              |
| data                | Array   | Endpoints 列表 |
| \- data\[0\].path   | String  | Endpoint       |
| \- data\[0\].name   | String  | Endpoint 名    |
| \- data\[0\].method | String  | HTTP Method    |
| \- data\[0\].descr  | String  | 描述           |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4"

{"code":0,"data":[{"path":"/brokers/","name":"list_brokers","method":"GET","descr":"A list of brokers in the cluster"},{"path":"/nodes/","name":"list_nodes","method":"GET","descr":"A list of nodes in the cluster"},{"path":"/clients/","name":"list_clients","method":"GET","descr":"A list of clients on current node"},{"path":"/clients/:clientid","name":"lookup_client","method":"GET","descr":"Lookup a client in the cluster"},{"path":"/clients/username/:username","name":"lookup_client_via_username","method":"GET","descr":"Lookup a client via username in the cluster"},{"path":"/subscriptions/","name":"list_subscriptions","method":"GET","descr":"A list of subscriptions in the cluster"},{"path":"/subscriptions/:clientid","name":"lookup_client_subscriptions","method":"GET","descr":"A list of subscriptions of a client"},{"path":"/topic-tree/","name":"list_topic-tree","method":"GET","descr":"A list of topic-tree in the cluster"},{"path":"/configuration/","name":"get_broker_configuration","method":"GET","descr":"show broker configuration"},{"path":"/configuration/","name":"set_broker_configuration","method":"POST","descr":"set broker configuration"},{"path":"/ctrl/:action","name":"ctrl_broker","method":"POST","descr":"Control broker stop or restart"}]}
```

## Broker 基本信息 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#broker-%E5%9F%BA%E6%9C%AC%E4%BF%A1%E6%81%AF)

### GET /api/v4/brokers [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-brokers)

返回 Broker 的基本信息。

**Success Response Body (JSON):**

| Name              | Type                    | Description                                                |
| ----------------- | ----------------------- | ---------------------------------------------------------- |
| code              | Integer                 | 0                                                          |
| data              | Object/Array of Objects | 返回所有节点的信息\*(只有一个节点， nanomq 暂不支持集群)\* |
| data.datetime     | String                  | 当前时间，格式为 "YYYY-MM-DD HH:mm:ss"                     |
| data.node\_status | String                  | 节点状态                                                   |
| data.sysdescr     | String                  | 软件描述                                                   |
| data.uptime       | String                  | NanoMQ 运行时间，格式为 "H hours, m minutes, s seconds"    |
| data.version      | String                  | NanoMQ 版本                                                |

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4/brokers"

{"code":0,"data":[{"datetime":"2022-06-07 10:02:24","node_status":"Running","sysdescr":"NanoMQ Broker","uptime":"15 Hours, 1 minutes, 38 seconds","version":"0.7.9-3"}]}
```

## 节点 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E8%8A%82%E7%82%B9)

### GET /api/v4/nodes [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-nodes)

返回节点的状态。

**Success Response Body (JSON):**

| Name              | Type                    | Description                                                             |
| ----------------- | ----------------------- | ----------------------------------------------------------------------- |
| code              | Integer                 | 0                                                                       |
| data              | Object/Array of Objects | 以 Array 形式返回所有节点的信息\*(只有一个节点， nanomq 暂不支持集群)\* |
| data.connections  | Integer                 | 当前接入此节点的客户端数量                                              |
| data.node\_status | String                  | 节点状态                                                                |
| data.uptime       | String                  | NanoMQ 运行时间                                                         |
| data.version      | String                  | NanoMQ 版本                                                             |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4/nodes"

{"code":0,"data":[{"connections":0,"node_status":"Running","uptime":"15 Hours, 22 minutes, 4 seconds","version":"0.8.1"}]}
```

## 统计信息 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E7%BB%9F%E8%AE%A1%E4%BF%A1%E6%81%AF)

### GET /api/v4/metrics [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-metrics)

返回 NanoMQ 的统计信息。

**Success Response Body (JSON):**

| Name    | Type                    | Description       |
| ------- | ----------------------- | ----------------- |
| metrics | Object/Array of Objects | 暂未支持，（空）  |
| cpuinfo | Integer Percent         | NanoMQ CPU 使用量 |
| memory  | Integer                 | NanoMQ 内存使用量 |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4/metrics"

{"metrics":[],"cpuinfo":"0.00%","memory":"20049920"}
```

### GET /api/v4/prometheus [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-prometheus)

返回 Prometheus 统计数据。

**Success Response Body (text/plain):**

| Name                       | Type    | Description      |
| -------------------------- | ------- | ---------------- |
| nanomq\_connections\_count | gauge   | 当前客户端连接数 |
| nanomq\_connections\_max   | gauge   | 客户端最大连接数 |
| nanomq\_sessions\_count    | gauge   | 当前会话数量     |
| nanomq\_sessions\_max      | gauge   | 最大会话数量     |
| nanomq\_topics\_count      | gauge   | 当前主题数量     |
| nanomq\_topics\_max        | gauge   | 最大主题数量     |
| nanomq\_subscribers\_count | gauge   | 当前订阅数量     |
| nanomq\_subscribers\_max   | gauge   | 最大订阅数量     |
| nanomq\_messages\_received | counter | 收到消息数量     |
| nanomq\_messages\_sent     | counter | 发送消息数量     |
| nanomq\_messages\_dropped  | counter | 丢弃消息数量     |
| nanomq\_memory\_usage      | gauge   | 当前 CPU 使量    |
| nanomq\_memory\_usage\_max | gauge   | 最大 CPU 使用量  |
| nanomq\_cpu\_usage         | gauge   | 当前内存使量     |
| nanomq\_cpu\_usage\_max    | gauge   | 最大内存使用量   |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4/prometheus"

# TYPE nanomq_connections_count gauge
# HELP nanomq_connections_count
nanomq_connections_count 0
# TYPE nanomq_connections_max gauge
# HELP nanomq_connections_max
nanomq_connections_max 0
# TYPE nanomq_sessions_count gauge
# HELP nanomq_sessions_count
nanomq_sessions_count 0
# TYPE nanomq_sessions_max gauge
# HELP nanomq_sessions_max
nanomq_sessions_max 0
# TYPE nanomq_topics_count gauge
# HELP nanomq_topics_count
nanomq_topics_count 0
# TYPE nanomq_topics_max gauge
# HELP nanomq_topics_max
nanomq_topics_max 0
# TYPE nanomq_subscribers_count gauge
# HELP nanomq_subscribers_count
nanomq_subscribers_count 0
# TYPE nanomq_subscribers_max gauge
# HELP nanomq_subscribers_max
nanomq_subscribers_max 0
# TYPE nanomq_messages_received counter
# HELP nanomq_messages_received
nanomq_messages_received 0
# TYPE nanomq_messages_sent counter
# HELP nanomq_messages_sent
nanomq_messages_sent 0
# TYPE nanomq_messages_dropped counter
# HELP nanomq_messages_dropped
nanomq_messages_dropped 0
# TYPE nanomq_memory_usage gauge
# HELP nanomq_memory_usage (b)
nanomq_memory_usage 19922944
# TYPE nanomq_memory_usage_max gauge
# HELP nanomq_memory_usage_max (b)
nanomq_memory_usage_max 19922944
# TYPE nanomq_cpu_usage gauge
# HELP nanomq_cpu_usage (%)
nanomq_cpu_usage 0.00
# TYPE nanomq_cpu_usage_max gauge
# HELP nanomq_cpu_usage_max (%)
nanomq_cpu_usage_max 0.00
```

## 客户端 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E5%AE%A2%E6%88%B7%E7%AB%AF)

### GET /api/v4/clients [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-clients)

支持多条件查询，其包含的查询参数有：

| Name         | Type    | Required | Description                                                 |
| ------------ | ------- | -------- | ----------------------------------------------------------- |
| clientid     | String  | False    | 客户端标识符                                                |
| username     | String  | False    | 客户端用户名                                                |
| conn\_state  | Enum    | False    | 客户端当前连接状态， 可取值有： connected,idle,disconnected |
| clean\_start | Bool    | False    | 客户端是否使用了全新的会话                                  |
| proto\_name  | Enum    | False    | 客户端协议名称， 可取值有： MQTT,CoAP,LwM2M,MQTT-SN         |
| proto\_ver   | Integer | False    | 客户端协议版本                                              |

**Success Response Body (JSON):**

| Name                   | Type             | Description                                |
| ---------------------- | ---------------- | ------------------------------------------ |
| code                   | Integer          | 0                                          |
| data                   | Array of Objects | 所有客户端的信息                           |
| data\[0\].clientid     | String           | 客户端标识符                               |
| data\[0\].username     | String           | 客户端连接时使用的用户名                   |
| data\[0\].proto\_name  | String           | 客户端协议名称 _(MQTT,CoAP,LwM2M,MQTT-SN)_ |
| data\[0\].proto\_ver   | Integer          | 客户端使用的协议版本                       |
| data\[0\].connected    | Boolean          | 客户端是否处于连接状态                     |
| data\[0\].keepalive    | Integer          | 保持连接时间，单位：秒                     |
| data\[0\].clean\_start | Boolean          | 指示客户端是否使用了全新的会话             |
| data\[0\].recv\_msg    | Integer          | 接收的 PUBLISH 报文数量                    |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4/clients"

{"code":0,"data":[{"client_id":"nanomq-f6d6fbfb","username":"alvin","keepalive":60,"conn_state":"connected","clean_start":true,"proto_name":"MQTT","proto_ver":5,"recv_msg":3},{"client_id":"nanomq-bdf61d9b","username":"nanomq","keepalive":60,"conn_state":"connected","clean_start":true,"proto_name":"MQTT","proto_ver":5,"recv_msg":0}]}
```

### GET /api/v4/clients/{clientid} [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-clients-clientid)

返回指定客户端的信息

**Path Parameters:**

| Name     | Type   | Required | Description |
| -------- | ------ | -------- | ----------- |
| clientid | String | True     | ClientID    |

**Success Response Body (JSON):**

| Name | Type             | Description                                                            |
| ---- | ---------------- | ---------------------------------------------------------------------- |
| code | Integer          | 0                                                                      |
| data | Array of Objects | 客户端的信息，详细请参见 \[GET /api/v4/clients\](#GET /api/v4/clients) |

**Examples:**

查询指定客户端

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4/clients/nanomq-29978ec1"

{"code":0,"data":[{"client_id":"nanomq-29978ec1","username":"","keepalive":60,"conn_state":"connected","clean_start":true,"proto_name":"MQTT","proto_ver":5}]}
```

### GET /api/v4/clients/username/{username} [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-clients-username-username)

通过 Username 查询客户端的信息。由于可能存在多个客户端使用相同的用户名的情况，所以可能同时返回多个客户端信息。

**Path Parameters:**

| Name     | Type   | Required | Description |
| -------- | ------ | -------- | ----------- |
| username | String | True     | Username    |

**Success Response Body (JSON):**

| Name | Type             | Description                                                            |
| ---- | ---------------- | ---------------------------------------------------------------------- |
| code | Integer          | 0                                                                      |
| data | Array of Objects | 客户端的信息，详细请参见 \[GET /api/v4/clients\](#GET /api/v4/clients) |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4/clients/username/user001"

{"code":0,"data":[{"client_id":"nanomq-56baa74d","username":"user001","keepalive":60,"conn_state":"connected","clean_start":true,"proto_name":"MQTT","proto_ver":5}]}
```

## 订阅信息 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E8%AE%A2%E9%98%85%E4%BF%A1%E6%81%AF)

### GET /api/v4/subscriptions [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-subscriptions)

支持多条件查询：

| Name     | Type   | Description              |
| -------- | ------ | ------------------------ |
| clientid | String | 客户端标识符             |
| topic    | String | 主题，全等查询           |
| qos      | Enum   | 可取值为： `0`, `1`, `2` |
| share    | String | 共享订阅的组名称         |

**Success Response Body (JSON):**

| Name               | Type             | Description  |
| ------------------ | ---------------- | ------------ |
| code               | Integer          | 0            |
| data               | Array of Objects | 所有订阅信息 |
| data\[0\].clientid | String           | 客户端标识符 |
| data\[0\].topic    | String           | 订阅主题     |
| data\[0\].qos      | Integer          | QoS 等级     |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4/subscriptions"

{"code":0,"data":[{"clientid":"nanomq-29978ec1","topic":"topic123","qos":2},{"clientid":"nanomq-3020ffac","topic":"topic123","qos":2}]}
```

### GET /api/v4/subscriptions/{clientid} [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-subscriptions-clientid)

返回指定客户端的订阅信息。

**Path Parameters:**

| Name     | Type   | Required | Description |
| -------- | ------ | -------- | ----------- |
| clientid | String | True     | ClientID    |

**Success Response Body (JSON):**

| Name          | Type    | Description  |
| ------------- | ------- | ------------ |
| code          | Integer | 0            |
| data          | Object  | 所有订阅信息 |
| data.clientid | String  | 客户端标识符 |
| data.topic    | String  | 订阅主题     |
| data.qos      | Integer | QoS 等级     |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4/subscriptions/123"

{"data":[{"topic":"a/b/c","qos":1,"clientid":"123"}],"code":0}
```

## 消息发布 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E6%B6%88%E6%81%AF%E5%8F%91%E5%B8%83)

### POST /api/v4/mqtt/publish [​](https://nanomq.io/docs/zh/latest/api/v4.html\#post-api-v4-mqtt-publish)

发布 MQTT 消息。

**Parameters (json):**

| Name       | Type    | Required | Default | Description                                                 |
| ---------- | ------- | -------- | ------- | ----------------------------------------------------------- |
| topic      | String  | Optional |         | 主题，与 `topics` 至少指定其中之一                          |
| topics     | String  | Optional |         | 以 `,` 分割的多个主题，使用此字段能够同时发布消息到多个主题 |
| clientid   | String  | Optional |         | 客户端标识符 (Default: NanoMQ-HTTP-Client)                  |
| payload    | String  | Required |         | 消息正文                                                    |
| encoding   | String  | Optional | plain   | 消息正文使用的编码方式，目前仅支持 `plain` 与 `base64` 两种 |
| qos        | Integer | Optional | 0       | QoS 等级                                                    |
| retain     | Boolean | Optional | false   | 是否为保留消息                                              |
| properties | Object  | Optional | {}      | PUBLISH 消息里的 Property 字段                              |

Properties 取值：

| Name                       | Type    | Description                                                                                                                                                                                                                               |
| -------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| payload\_format\_indicator | Integer | 载荷格式指示标识符， 0 说明载荷是未指定格式的字节，相当于没有发送载荷格式指示，说明载荷是 UTF-8 编码的字符数据。载荷中的 UTF-8 数据必须是按照 Unicode 的规范和 RFC 3629 的重申进行编码                                                    |
| message\_expiry\_interval  | integer | 消息过期间隔标识符，以秒为单位，如果已过期，服务端还没有开始向匹配的订阅者交付该消息时，则服务端必须删除该订阅者的消息副本，不设置，则消息不会过期。                                                                                      |
| response\_topic            | String  | 响应主题标识符， UTF-8 编码的字符串，用作响应消息的主题名，响应主题不能包含通配符，包含多个响应主题将造成协议错误(Protocol Error)。响应主题的存在将消息标识为请求报文。服务端在收到应用消息时必须将响应主题原封不动的发送给所有的订阅者。 |
| correlation\_data          | String  | 对比数据标识符，服务端在收到应用消息时必须原封不动的把对比数据发送给所有的订阅者。对比数据只对请求消息(Request Message)的发送端和响应消息(Response Message)的接收端有意义。                                                               |
| subscription\_identifier   | Integer | 订阅标识符标识符，订阅标识符取值范围从 1 到 268,435,455 。订阅标识符的值为 0 将造成协议错误。如果某条发布消息匹配了多个订阅，则将包含多个订阅标识符。这种情况下他们的顺序并不重要。                                                       |
| content\_type              | String  | 内容类型标识符，以 UTF-8 格式编码的字符串，用来描述应用消息的内容，服务端必须把收到的应用消息中的内容类型原封不动的发送给所有的订阅者                                                                                                     |
| user\_properties           | Object  | 用户属性(User Property)允许出现多次，以表示多个名字/值对，服务端在转发应用消息到客户端时必须原封不动的把所有的用户属性放在 PUBLISH 报文中                                                                                                 |

**Success Response Body (JSON):**

| Name | Type    | Description |
| ---- | ------- | ----------- |
| code | Integer | 0           |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X POST "http://localhost:8081/api/v4/mqtt/publish" -d \
'{"topic":"a/b/c", "payload":"Hello World", "qos":1, "retain":false, "clientid":"example", "properties": {"user_properties": { "id": 10010, "name": "name", "foo": "bar"}, "content_type": "text/plain"}}'

{"code":0}
```

## 主题订阅 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E4%B8%BB%E9%A2%98%E8%AE%A2%E9%98%85)

### POST /api/v4/mqtt/subscribe（暂不支持） [​](https://nanomq.io/docs/zh/latest/api/v4.html\#post-api-v4-mqtt-subscribe-%E6%9A%82%E4%B8%8D%E6%94%AF%E6%8C%81)

订阅 MQTT 主题。

**Parameters (json):**

| Name     | Type    | Required | Default | Description                                           |
| -------- | ------- | -------- | ------- | ----------------------------------------------------- |
| topic    | String  | Optional |         | 主题，与 `topics` 至少指定其中之一                    |
| topics   | String  | Optional |         | 以 `,` 分割的多个主题，使用此字段能够同时订阅多个主题 |
| clientid | String  | Required |         | 客户端标识符                                          |
| qos      | Integer | Optional | 0       | QoS 等级                                              |

**Success Response Body (JSON):**

| Name | Type    | Description |
| ---- | ------- | ----------- |
| code | Integer | 0           |

**Examples:**

同时订阅 `a`, `b`, `c` 三个主题

bash

```
$ curl -i --basic -u admin:public -X POST "http://localhost:8081/api/v4/mqtt/subscribe" -d '{"topics":"a,b,c","qos":1,"clientid":"example"}'

{"code":0}
```

### POST /api/v4/mqtt/unsubscribe（暂不支持） [​](https://nanomq.io/docs/zh/latest/api/v4.html\#post-api-v4-mqtt-unsubscribe-%E6%9A%82%E4%B8%8D%E6%94%AF%E6%8C%81)

取消订阅。

**Parameters (json):**

| Name     | Type   | Required | Default | Description  |
| -------- | ------ | -------- | ------- | ------------ |
| topic    | String | Required |         | 主题         |
| clientid | String | Required |         | 客户端标识符 |

**Success Response Body (JSON):**

| Name | Type    | Description |
| ---- | ------- | ----------- |
| code | Integer | 0           |

**Examples:**

取消订阅 `a` 主题

bash

```
$ curl -i --basic -u admin:public -X POST "http://localhost:8081/api/v4/mqtt/unsubscribe" -d '{"topic":"a","qos":1,"clientid":"example"}'

{"code":0}
```

## 消息批量发布 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E6%B6%88%E6%81%AF%E6%89%B9%E9%87%8F%E5%8F%91%E5%B8%83)

### POST /api/v4/mqtt/publish\_batch [​](https://nanomq.io/docs/zh/latest/api/v4.html\#post-api-v4-mqtt-publish-batch)

批量发布 MQTT 消息。

**Parameters (json):**

| Name             | Type    | Required | Default | Description                                                 |
| ---------------- | ------- | -------- | ------- | ----------------------------------------------------------- |
| \[0\].topic      | String  | Optional |         | 主题，与 `topics` 至少指定其中之一                          |
| \[0\].topics     | String  | Optional |         | 以 `,` 分割的多个主题，使用此字段能够同时发布消息到多个主题 |
| \[0\].clientid   | String  | Optional |         | 客户端标识符 (Default: NanoMQ-HTTP-Client)                  |
| \[0\].payload    | String  | Required |         | 消息正文                                                    |
| \[0\].encoding   | String  | Optional | plain   | 消息正文使用的编码方式，目前仅支持 `plain` 与 `base64` 两种 |
| \[0\].qos        | Integer | Optional | 0       | QoS 等级                                                    |
| \[0\].retain     | Boolean | Optional | false   | 是否为保留消息                                              |
| \[0\].properties | Object  | Optional | {}      | PUBLISH 消息里的 properties 字段                            |

**Success Response Body (JSON):**

| Name | Type    | Description |
| ---- | ------- | ----------- |
| code | Integer | 0           |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X POST "http://localhost:8081/api/v4/mqtt/publish_batch" -d '[{"topic":"a/b/c","payload":"Hello World","qos":1,"retain":false,"clientid":"example","properties": {"user_properties":{"id": 10010, "name": "nanomq", "foo": "bar"}}},{"topic":"a/b/c","payload":"Hello World Again","qos":0,"retain":false,"clientid":"example","properties":{"user_properties": { "id": 10010, "name": "nanomq", "foo": "bar"},"content_type": "text/plain"}}]'

{"data":[{"topic":"a/b/c","code":0},{"topic":"a/b/c","code":0}],"code":0}
```

## 主题批量订阅 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E4%B8%BB%E9%A2%98%E6%89%B9%E9%87%8F%E8%AE%A2%E9%98%85)

### POST /api/v4/mqtt/subscribe\_batch（暂不支持） [​](https://nanomq.io/docs/zh/latest/api/v4.html\#post-api-v4-mqtt-subscribe-batch-%E6%9A%82%E4%B8%8D%E6%94%AF%E6%8C%81)

批量订阅 MQTT 主题。

**Parameters (json):**

| Name           | Type    | Required | Default | Description                                           |
| -------------- | ------- | -------- | ------- | ----------------------------------------------------- |
| \[0\].topic    | String  | Optional |         | 主题，与 `topics` 至少指定其中之一                    |
| \[0\].topics   | String  | Optional |         | 以 `,` 分割的多个主题，使用此字段能够同时订阅多个主题 |
| \[0\].clientid | String  | Required |         | 客户端标识符                                          |
| \[0\].qos      | Integer | Optional | 0       | QoS 等级                                              |

**Success Response Body (JSON):**

| Name | Type    | Description |
| ---- | ------- | ----------- |
| code | Integer | 0           |

**Examples:**

一次性订阅 `a`, `b`, `c` 三个主题

bash

```
$ curl -i --basic -u admin:public -X POST "http://localhost:8081/api/v4/mqtt/subscribe_batch" -d '[{"topic":"a","qos":1,"clientid":"example"},{"topic":"b","qos":1,"clientid":"example"},{"topic":"c","qos":1,"clientid":"example"}]'

{"code":0}
```

### POST /api/v4/mqtt/unsubscribe\_batch（暂不支持） [​](https://nanomq.io/docs/zh/latest/api/v4.html\#post-api-v4-mqtt-unsubscribe-batch-%E6%9A%82%E4%B8%8D%E6%94%AF%E6%8C%81)

批量取消订阅。

**Parameters (json):**

| Name           | Type   | Required | Default | Description  |
| -------------- | ------ | -------- | ------- | ------------ |
| \[0\].topic    | String | Required |         | 主题         |
| \[0\].clientid | String | Required |         | 客户端标识符 |

**Success Response Body (JSON):**

| Name | Type    | Description |
| ---- | ------- | ----------- |
| code | Integer | 0           |

**Examples:**

一次性取消订阅 `a`, `b` 主题

bash

```
$ curl -i --basic -u admin:public -X POST "http://localhost:8081/api/v4/mqtt/unsubscribe_batch" -d '[{"topic":"a","qos":1,"clientid":"example"},{"topic":"b","qos":1,"clientid":"example"}]'

{"code":0}
```

## 主题树结构 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E4%B8%BB%E9%A2%98%E6%A0%91%E7%BB%93%E6%9E%84)

### GET /api/v4/topic-tree [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-topic-tree)

**Success Response Body (JSON):**

| Name               | Type             | Description      |
| ------------------ | ---------------- | ---------------- |
| code               | Integer          | 0                |
| data               | Array of Objects | 所有订阅信息     |
| data\[0\].clientid | Array of String  | 客户端标识符数组 |
| data\[0\].topic    | String           | 订阅主题         |
| data\[0\].cld\_cnt | Integer          | 子节点个数       |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4/topic-tree"

{"code":0,"data":[[{"topic":"","cld_cnt":1}],[{"topic":"topic123","cld_cnt":1,"clientid":["nanomq-3a4a0956"]}],[{"topic":"123","cld_cnt":1,"clientid":["nanomq-0cfd69bb"]}],[{"topic":"456","cld_cnt":0,"clientid":["nanomq-26971dc8"]}]]}
```

## 获取热更新配置 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E8%8E%B7%E5%8F%96%E7%83%AD%E6%9B%B4%E6%96%B0%E9%85%8D%E7%BD%AE)

### GET /api/v4/reload [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-reload)

返回当前所有支持热更新的配置参数。

**Success Response Body (JSON):**

| Name                           | Type    | Description                  |
| ------------------------------ | ------- | ---------------------------- |
| code                           | Integer | 0                            |
| data.property\_size            | Integer | 最大属性长度。               |
| data.msq\_len                  | Integer | 队列长度。                   |
| data.qos\_duration             | Integer | QOS 消息定时间隔时间。       |
| data.allow\_anonymous          | Boolean | 允许匿名登录。               |
| data.max\_packet\_size         | Kbytes  | NanoMQ 的最大包大小 (Kbytes) |
| data.client\_max\_packet\_size | Kbytes  | 每个 client 的 最大包大小    |
| data.keepalive\_backoff        | Integer | MQTT keepalive 的退避指数    |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X GET 'http://127.0.0.1:8081/api/v4/reload' -d \
'{
    "code": 0,
    "data": {
        "property_size": 64,
        "max_packet_size": 3,
        "client_max_packet_size": 5,
        "msq_len": 2048,
        "qos_duration": 10,
        "keepalive_backoff": 1250,
        "allow_anonymous": false
    }
}'
```

## 设置热更新配置 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E8%AE%BE%E7%BD%AE%E7%83%AD%E6%9B%B4%E6%96%B0%E9%85%8D%E7%BD%AE)

### POST /api/v4/reload [​](https://nanomq.io/docs/zh/latest/api/v4.html\#post-api-v4-reload)

设置热配置参数。

**Parameters (json):**

| Name | Type   | Required | Value | Description                                                                                                                                           |
| ---- | ------ | -------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| data | Object | Required |       | 同获取热更新配置一致 [获取热更新配置](https://nanomq.io/docs/zh/latest/api/v4.html#%E8%8E%B7%E5%8F%96%E7%83%AD%E6%9B%B4%E6%96%B0%E9%85%8D%E7%BD%AE)。 |

**Success Response Body (JSON):**

| Name | Type    | Description |
| ---- | ------- | ----------- |
| code | Integer | 0           |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X POST 'http://localhost:8081/api/v4/reload' -d \
'{
       "data": {
        "property_size": 64,
        "max_packet_size": 3,
        "client_max_packet_size": 5,
        "msq_len": 2048,
        "qos_duration": 10,
        "keepalive_backoff": 1250,
        "allow_anonymous": false
    }
}'

{"code":0}
```

## 配置文件更新 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E6%9B%B4%E6%96%B0)

### POST /api/v4/config\_update [​](https://nanomq.io/docs/zh/latest/api/v4.html\#post-api-v4-config-update)

配置文件更新。

**Parameters (json):**

| Name | Type   | Required | Value | Description                                                                                                              |
| ---- | ------ | -------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| data | Object | Required |       | 传输的数据内容是新的配置，配置内容可参考 [配置](https://nanomq.io/docs/zh/latest/config-description/introduction.html)。 |

**Success Response Body (JSON):**

| Name | Type    | Description |
| ---- | ------- | ----------- |
| code | Integer | 0           |

**Examples:**

bash

```
$ curl --basic -u admin:public -X POST "http://localhost:8081/api/v4/config_update" -d \
'
 # NanoMQ Configuration 0.18.0

 # #============================================================
 # # NanoMQ Broker
 # #============================================================

 mqtt {
     property_size = 32
     max_packet_size = 10KB
     max_mqueue_len = 2048
     retry_interval = 10s
     keepalive_multiplier = 1.25

     # Three of below, unsupported now
     max_inflight_window = 2048
     max_awaiting_rel = 10s
     await_rel_timeout = 10s
 }

 listeners.tcp {
     bind = "0.0.0.0:1883"
 }

 # listeners.ssl {
 # 	bind = "0.0.0.0:8883"
 # 	keyfile = "/etc/certs/key.pem"
 # 	certfile = "/etc/certs/cert.pem"
 # 	cacertfile = "/etc/certs/cacert.pem"
 # 	verify_peer = false
 # 	fail_if_no_peer_cert = false
 # }

 listeners.ws {
     bind = "0.0.0.0:8083/mqtt"
 }

 http_server {
     port = 8081
     limit_conn = 2
     username = admin
     password = public
     auth_type = basic
     jwt {
         public.keyfile = "/etc/certs/jwt/jwtRS256.key.pub"
     }
 }

 log {
     to = [file, console]
     level = info
     dir = "/tmp"
     file = "nanomq.log"
     rotation {
         size = 10MB
         count = 5
     }
 }

 auth {
     allow_anonymous = true
     no_match = allow
     deny_action = ignore

     cache = {
         max_size = 32
         ttl = 1m
     }

     # password = {include "/etc/nanomq_pwd.conf"}
     # acl = {include "/etc/nanomq_acl.conf"}
 }
'

{"code":0}
```

## 获取桥接配置 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E8%8E%B7%E5%8F%96%E6%A1%A5%E6%8E%A5%E9%85%8D%E7%BD%AE)

### GET /api/v4/bridges/ [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-bridges)

获取所有桥接节点配置

**Success Response Body (JSON):**

| Name                                                    | Type             | Description                                                                |
| ------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------- |
| code                                                    | Integer          | 0                                                                          |
| data                                                    | Array of Objects | 所有桥接客户端的配置信息                                                   |
| data.bridges.nodes\[0\].name                            | String           | 节点名字。                                                                 |
| data.bridges.nodes\[0\].enable                          | Boolean          | 启动桥接功能（ _默认 `false` 不启用_）。                                   |
| data.bridges.nodes\[0\].connector.server                | String           | 桥接目标 broker 地址 URL 。                                                |
| data.bridges.nodes\[0\].connector.proto\_ver            | Integer          | 桥接客户端 MQTT 版本（ 4 ｜ 5 ）。                                         |
| data.bridges.nodes\[0\].connector.clientid              | String           | 桥接客户端 ID （ _默认 NULL 为自动生成随机 ID_）。                         |
| data.bridges.nodes\[0\].connector.keepalive             | Duration         | 保活间隔时间。                                                             |
| data.bridges.nodes\[0\].connector.clean\_start          | Boolean          | 清除会话。                                                                 |
| data.bridges.nodes\[0\].connector.username              | String           | 登录用户名。                                                               |
| data.bridges.nodes\[0\].connector.password              | String           | 登录密码。                                                                 |
| data.bridges.nodes\[0\].connector.conn\_properties      | Object           | Connector 的 MQTT V5 属性                                                  |
| data.bridges.nodes\[0\].connector.will\_properties      | Object           | MQTT V5 遗嘱属性                                                           |
| data.bridges.nodes\[0\].connector.ssl.enable            | Boolean          | 启动 TLS 监听（ _默认 `false`_）。                                         |
| data.bridges.nodes\[0\].connector.ssl.key\_password     | String           | TLS 私钥密码。                                                             |
| data.bridges.nodes\[0\].connector.ssl.keyfile           | String           | TLS 私钥数据。                                                             |
| data.bridges.nodes\[0\].connector.ssl.certfile          | String           | TLS Cert 证书数据。                                                        |
| data.bridges.nodes\[0\].connector.ssl.cacertfile        | String           | TLS CA 证书数据。                                                          |
| data.bridges.nodes\[0\].hybrid\_bridging                | Boolean          | 混合桥接模式开关，( _默认 `false` 不启用_), 如果想最大利用 QUIC ，建议启用 |
| data.bridges.nodes\[0\].quic\_keepalive                 | Duration         | Quic 传输层保活时间, （ _默认 `120s`_ )                                    |
| data.bridges.nodes\[0\].quic\_idle\_timeout             | Duration         | Quic 连接最大过期时间 （ _默认 `120s`_ )                                   |
| data.bridges.nodes\[0\].quic\_discon\_timeout           | Duration         | Quic 等待连接 ACK 最大时间 （ _默认 `20s`_ )                               |
| data.bridges.nodes\[0\].quic\_handshake\_timeout        | Duration         | QUIC 握手最大超时时间（ _默认 `60s`_ )                                     |
| data.bridges.nodes\[0\].quic\_send\_idle\_timeout       | Duration         | QUIC 传输层重置拥塞控制算法的等待超时时间 ( _默认 `60 s`_)                 |
| data.bridges.nodes\[0\].quic\_initial\_rtt\_ms          | Duration         | 初始 RTT 估计时间 ( _默认 `800ms`_)                                        |
| data.bridges.nodes\[0\].quic\_max\_ack\_delay\_ms       | Duration         | 发送 ACK 之前接收数据后等待时长(默认 `100ms`)                              |
| data.bridges.nodes\[0\].quic\_qos\_priority             | Boolean          | 高优先级发送 QOS 1 或 2 的消息( _默认 `true`_)                             |
| data.bridges.nodes\[0\].quic\_0rtt                      | Boolean          | 0RTT 是 QUIC 协议的一个特性，用于快速重新建立连接 ( _默认 `true`_)         |
| data.bridges.nodes\[0\].quic\_multi\_stream             | Boolean          | Quic Multiple stream 开关（ _默认 `false` 不启用_）                        |
| data.bridges.nodes\[0\].parallel                        | Long             | 桥接客户端并发数。                                                         |
| data.bridges.nodes\[0\].forwards\[0\].remote\_topic     | String           | 第一个转发的remote\_topic                                                  |
| data.bridges.nodes\[0\].forwards\[0\].local\_topic      | String           | 第一个转发的local\_topic                                                   |
| data.bridges.nodes\[0\].subscription\[0\].remote\_topic | String           | 第 1 个订阅 `remote_topic`。                                               |
| data.bridges.nodes\[0\].subscription\[0\].local\_topic  | String           | 第 1 个订阅 `local_topic`。                                                |
| data.bridges.nodes\[0\].subscription\[0\].qos           | Integer          | 第 1 个订阅 `Qos`。                                                        |
| data.bridges.nodes\[0\].sub\_properties                 | Object           | Subscription 的 MQTT V5 属性                                               |
| data.bridges.nodes\[0\].max\_send\_queue\_len           | Integer          | 最大发送队列长度                                                           |
| data.bridges.nodes\[0\].max\_recv\_queue\_len           | Integer          | 最大接收队列长度                                                           |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4/bridges"

{
    "code": 0,
    "data": {
        "bridge": {
            "nodes": [\
                {\
                    "name": "emqx",\
                    "enable": true,\
                    "parallel": 2,\
                    "connector": {\
                        "server": "mqtt-tcp://broker.emqx.io:1883",\
                        "proto_ver": 5,\
                        "clientid": null,\
                        "clean_start": true,\
                        "username": "",\
                        "password": "",\
                        "keepalive": 60,\
                        "conn_properties": {\
                            "session_expiry_interval": 30,\
                            "receive_maximum": 65535,\
                            "maximum_packet_size": 0,\
                            "topic_alias_maximum": 0,\
                            "request_response_information": false,\
                            "request_problem_information": true\
                        },\
                        "will_properties": {\
                            "payload_format_indicator": 0,\
                            "message_expiry_interval": 360,\
                            "will_delay_interval": 20,\
                            "user_properties": [\
                                {\
                                    "key": "key1",\
                                    "value": "value1"\
                                },\
                                {\
                                    "key": "key2",\
                                    "value": "value2"\
                                }\
                            ]\
                        }\
                    },\
                    "forwards": [\
                        {\
                            "remote_topic": "fwd/topic1",\
                            "local_topic": "topic1",\
                        },\
                        {\
                            "remote_topic": "fwd/topic2",\
                            "local_topic": "topic2",\
                        }\
                    ],\
                    "subscription": [\
                        {\
                            "remote_topic": "cmd/topic1",\
                            "local_topic": "topic1",\
                            "qos": 1\
                        },\
                        {\
                            "remote_topic": "cmd/topic2",\
                            "local_topic": "topic2",\
                            "qos": 2\
                        }\
                    ],\
                    "sub_properties": {\
                        "identifier": 1,\
                        "user_properties": [\
                            {\
                                "key": "key1",\
                                "value": "value1"\
                            },\
                            {\
                                "key": "key2",\
                                "value": "value2"\
                            }\
                        ]\
                    },\
                    "tls": {\
                        "enable": false,\
                        "url": null,\
                        "key_password": null,\
                        "key": null,\
                        "cert": null,\
                        "cacert": null,\
                        "verify_peer": false,\
                        "fail_if_no_peer_cert": false\
                    }\
                }\
            ]
        }
    }
}
```

### GET /api/v4/bridges/{bridge\_name} [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-bridges-bridge-name)

通过桥接节点名称获取桥接配置

**Path Parameters:**

| Name         | Type   | Required | Description      |
| ------------ | ------ | -------- | ---------------- |
| bridge\_name | String | True     | bridge node name |

**Success Response Body (JSON):**

| Name | Type             | Description                                                             |
| ---- | ---------------- | ----------------------------------------------------------------------- |
| code | Integer          | 0                                                                       |
| data | Array of Objects | 桥接配置信息，详细请参见 \[GET /api/v4/bridges\](#GET /api/v4/bridges/) |

**Example:**

bash

```
$ curl -i --basic -u admin:public -X GET "http://localhost:8081/api/v4/bridges/emqx"

{
    "code": 0,
    "data": {
        "bridge": {
            "nodes": [\
                {\
                    "name": "emqx",\
                    "enable": true,\
                    "parallel": 2,\
                    "connector": {\
                        "server": "mqtt-tcp://broker.emqx.io:1883",\
                        "proto_ver": 5,\
                        "clientid": null,\
                        "clean_start": true,\
                        "username": "",\
                        "password": "",\
                        "keepalive": 60,\
                        "conn_properties": {\
                            "session_expiry_interval": 30,\
                            "receive_maximum": 65535,\
                            "maximum_packet_size": 0,\
                            "topic_alias_maximum": 0,\
                            "request_response_information": false,\
                            "request_problem_information": true\
                        },\
                        "will_properties": {\
                            "payload_format_indicator": 0,\
                            "message_expiry_interval": 360,\
                            "will_delay_interval": 20,\
                            "user_properties": [\
                                {\
                                    "key": "key1",\
                                    "value": "value1"\
                                },\
                                {\
                                    "key": "key2",\
                                    "value": "value2"\
                                }\
                            ]\
                        }\
                    },\
                    "forwards": [\
                        {\
                            "remote_topic": "fwd/topic1",\
                            "local_topic": "topic1",\
                            "qos": 1\
                        },\
                        {\
                            "remote_topic": "fwd/topic2",\
                            "local_topic": "topic2",\
                            "qos": 2\
                        }\
                    ],\
                    "subscription": [\
                        {\
                            "remote_topic": "cmd/topic1",\
                            "local_topic": "topic1",\
                            "qos": 1\
                        },\
                        {\
                            "remote_topic": "cmd/topic2",\
                            "local_topic": "topic2",\
                            "qos": 2\
                        }\
                    ],\
                    "sub_properties": {\
                        "identifier": 1,\
                        "user_properties": [\
                            {\
                                "key": "key1",\
                                "value": "value1"\
                            },\
                            {\
                                "key": "key2",\
                                "value": "value2"\
                            }\
                        ]\
                    },\
                    "tls": {\
                        "enable": false,\
                        "url": null,\
                        "key_password": null,\
                        "key": null,\
                        "cert": null,\
                        "cacert": null,\
                        "verify_peer": false,\
                        "fail_if_no_peer_cert": false\
                    }\
                }\
            ]
        }
    }
}
```

## 动态更新桥接配置 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E5%8A%A8%E6%80%81%E6%9B%B4%E6%96%B0%E6%A1%A5%E6%8E%A5%E9%85%8D%E7%BD%AE)

此类 API 允许用户动态更新桥接配置，而无需重启 NanoMQ，Reload API 会触发桥接重连，修改桥接订阅主题不会重连。

### PUT /api/v4/bridges/{bridge\_name} [​](https://nanomq.io/docs/zh/latest/api/v4.html\#put-api-v4-bridges-bridge-name)

更新桥接配置并触发桥接连接重连以立即生效。

**Path Parameters:**

| Name         | Type   | Required | Description  |
| ------------ | ------ | -------- | ------------ |
| bridge\_name | String | True     | 桥接节点名称 |

**Success Response Body (JSON):**

| Name                                         | Type     | Description                                        |
| -------------------------------------------- | -------- | -------------------------------------------------- |
| code                                         | Integer  | 0                                                  |
| bridge\_name                                 | Objects  | 桥接客户端节点名称                                 |
| bridge\_name.name                            | String   | 节点名字                                           |
| bridge\_name.enable                          | Boolean  | 启动桥接功能（ _默认 `false` 不启用_）。           |
| bridge\_name.server                          | String   | 桥接目标 broker 地址 URL 。                        |
| bridge\_name.proto\_ver                      | Integer  | 桥接客户端 MQTT 版本（ 4 ｜ 5 ）。                 |
| bridge\_name.clientid                        | String   | 桥接客户端 ID （ _默认 NULL 为自动生成随机 ID_）。 |
| bridge\_name.keepalive                       | Duration | 保活间隔时间。                                     |
| bridge\_name.clean\_start                    | Boolean  | 清除会话。                                         |
| bridge\_name.username                        | String   | 登录用户名。                                       |
| bridge\_name.password                        | String   | 登录密码。                                         |
| bridge\_name.conn\_properties                | Object   | Connector 的 MQTT V5 属性                          |
| bridge\_name.will\_properties                | Object   | MQTT V5 遗嘱属性                                   |
| bridge\_name.ssl.enable                      | Boolean  | 启动 TLS 监听（ _默认 `false`_）。                 |
| bridge\_name.ssl.key\_password               | String   | TLS 私钥密码。                                     |
| bridge\_name.ssl.keyfile                     | String   | TLS 私钥数据。                                     |
| bridge\_name.ssl.certfile                    | String   | TLS Cert 证书数据。                                |
| bridge\_name.ssl.cacertfile                  | String   | TLS CA 证书数据。                                  |
| bridge\_name.parallel                        | Long     | 桥接客户端并发数。                                 |
| bridge\_name.forwards.\[0\].remote\_topic    | String   | 转发到远端的remote\_topic。                        |
| bridge\_name.forwards.\[0\].local\_topic     | String   | 转发到远端的local\_topic。                         |
| bridge\_name.subscription\[0\].remote\_topic | String   | 第 1 个订阅 `remote_topic`。                       |
| bridge\_name.subscription\[0\].local\_topic  | String   | 第 1 个订阅 `local_topic`。                        |
| bridge\_name.subscription\[0\].qos           | Integer  | 第 1 个订阅 `Qos`。                                |
| bridge\_name.sub\_properties                 | Object   | Subscription 的 MQTT V5 属性                       |
| bridge\_name.max\_send\_queue\_len           | Integer  | 最大发送队列长度                                   |
| bridge\_name.max\_recv\_queue\_len           | Integer  | 最大接收队列长度                                   |

**Example**:

bash

```
$ curl -i --basic -u admin:public -X PUT 'http://localhost:8081/api/v4/bridges/emqx' -d '{
    "emqx": {
        "name": "emqx",
        "enable": true,
        "parallel": 8,
        "server": "mqtt-tcp://broker.emqx.io:1883",
        "proto_ver": 4,
        "clientid": "hello3",
        "clean_start": true,
        "username": "emqx",
        "password": "emqx123",
        "keepalive": 60,
        "forwards": [\
            {\
                "remote_topic": "fwd/topic1",\
                "local_topic": "local/topic1",\
                "qos": 1\
            },\
            {\
                "remote_topic": "fwd/topic3",\
                "local_topic": "local/topic3",\
                "qos": 2\
            }\
        ],
        "subscription": [\
            {\
                "remote_topic": "cmd/topic1",\
                "local_topic": "local/topic1",\
                "qos": 1\
            },\
            {\
                "remote_topic": "cmd/topic3",\
                "local_topic": "local/topic3",\
                "qos": 2\
            }\
        ]
    }
}'

{"code":0}
```

返回 108 可能是由于以下两种原因之一：

URL 后的 name 参数指定错误。 JSON 内的命名错误。例如，在上述示例中，JSON 中的 "emqx" 与 name 中的 "emqx" 名称不一致。 返回 109 是由于 JSON 数据不合法。

### PUT /api/v4/bridges/sub/{bridge\_name} [​](https://nanomq.io/docs/zh/latest/api/v4.html\#put-api-v4-bridges-sub-bridge-name)

动态新增桥接主题并立即生效。

**Path Parameters:**

| Name                                  | Type    | Required                     | Description |
| ------------------------------------- | ------- | ---------------------------- | ----------- |
| code                                  | Integer | 0                            |             |
| data                                  | Objects | 桥接节点配置信息             |             |
| data.subscription\[0\].remote\_topic  | String  | 第 1 个订阅 `remote_topic`。 |             |
| data.subscription\[0\].local\_topic   | String  | 第 1 个订阅 `local_topic`。  |             |
| data.subscription\[0\].qos            | Integer | 第 1 个订阅 `Qos`。          |             |
| data.sub\_properties                  | Object  | Subscription 的 MQTT V5 属性 |             |
| data.sub\_properties.identifier       | Integer | Subscription 的 ID           |             |
| data.sub\_properties.user\_properties | Object  | Subscription 的 用户属性     |             |

**Example**:

以桥接节点名字为 “EMQX” 为例

bash

```
$ curl --location 'http://127.0.0.1:8081/api/v4/bridges/sub/emqx' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46cHVibGlj' \
--data '{
    "data": {
        "subscription": [\
            {\
                "remote_topic": "cmd/topic4",\
                "local_topic": "topic4",\
                "qos": 1\
            },\
            {\
                "remote_topic": "cmd/topic5",\
                "local_topic": "topic5",\
                "qos": 2\
            }\
        ],
        "sub_properties": {
            "identifier": 1,
            "user_properties": [\
                {\
                    "key": "key1",\
                    "value": "value1"\
                },\
                {\
                    "key": "key2",\
                    "value": "value2"\
                }\
            ]
        }
    }
}'

{"code":0}
```

### PUT /api/v4/bridges/unsub/{bridge\_name} [​](https://nanomq.io/docs/zh/latest/api/v4.html\#put-api-v4-bridges-unsub-bridge-name)

动态删除桥接订阅主题并立即生效。

**Path Parameters:**

| Name         | Type   | Required | Description  |
| ------------ | ------ | -------- | ------------ |
| bridge\_name | String | True     | 桥接节点名称 |

**Success Response Body (JSON):**

| Name                                    | Type    | Description                  |
| --------------------------------------- | ------- | ---------------------------- |
| code                                    | Integer | 0                            |
| data                                    | Objects | 桥接节点配置信息             |
| data.unsubscription\[0\].topic          | String  | 第 1 个订阅 `Topic`。        |
| data.unsubscription\[0\].qos            | Integer | 第 1 个订阅 `Qos`。          |
| data.unsub\_properties                  | Object  | Subscription 的 MQTT V5 属性 |
| data.unsub\_properties.identifier       | Integer | Subscription 的 ID           |
| data.unsub\_properties.user\_properties | Object  | Subscription 的 用户属性     |

**Example**:

以桥接节点名字为 “EMQX” 为例

bash

```
$ curl --location 'http://127.0.0.1:8081/api/v4/bridges/unsub/emqx' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46cHVibGlj' \
--data '{
    "data": {
        "unsubscription": [\
            {\
                "topic": "cmd/topic1"\
            },\
            {\
                "topic": "cmd/topic2"\
            }\
        ],
        "unsub_properties": {
            "user_properties": [\
                {\
                    "key": "key1",\
                    "value": "value1"\
                },\
                {\
                    "key": "key2",\
                    "value": "value2"\
                }\
            ]
        }
    }
}'

{"code":0}
```

## Broker 控制 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#broker-%E6%8E%A7%E5%88%B6)

### POST /api/v4/ctrl/{action} [​](https://nanomq.io/docs/zh/latest/api/v4.html\#post-api-v4-ctrl-action)

控制 broker 停止或重启（通常应用在修改配置后）

**Path Parameters:**

| Name     | Type   | Required | Description           |
| -------- | ------ | -------- | --------------------- |
| clientid | String | True     | 可取值: stop, restart |

**Success Response Body (JSON):**

| Name | Type    | Description |
| ---- | ------- | ----------- |
| code | Integer | 0           |

**Examples:**

bash

```
$ curl -i --basic -u admin:public -X POST 'http://localhost:8081/api/v4/ctrl/restart'

{"code":0}
```

## 规则 [​](https://nanomq.io/docs/zh/latest/api/v4.html\#%E8%A7%84%E5%88%99)

查询规则引擎的动作

### GET /api/v4/rules/ [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-rules)

获取规则列表, 包括规则的 SQL, id 等。

**Success Response Body (JSON):**

| Name             | Type             | Description                      |
| ---------------- | ---------------- | -------------------------------- |
| code             | Integer          | 0                                |
| enabled          | Boolean          | 过滤条件：规则是否开启状态       |
| data             | Array of Objects | 规则详情                         |
| data\[0\].id     | String           | 规则 ID                          |
| data\[0\].rawsql | String           | SQL 语句，与请求中的 rawsql 一致 |

#### GET /api/v4/rules/{rule\_id} [​](https://nanomq.io/docs/zh/latest/api/v4.html\#get-api-v4-rules-rule-id)

获取某个规则的详情, 包括规则的 SQL, id 等。 **Path Parameters:**

| Name     | Type   | Required | Description                                                         |
| -------- | ------ | -------- | ------------------------------------------------------------------- |
| rule\_id | String | False    | 可选， Rule ID 。如不指定 rule\_id 则以数组形式返回所有已创建的规则 |

**Success Response Body (JSON):**

| Name           | Type             | Description                      |
| -------------- | ---------------- | -------------------------------- |
| code           | Integer          | 0                                |
| enabled        | Boolean          | 过滤条件：规则是否开启状态       |
| data           | Array of Objects | 规则详情                         |
| \- data.id     | String           | 规则 ID                          |
| \- data.rawsql | String           | SQL 语句，与请求中的 rawsql 一致 |

#### POST /api/v4/rules [​](https://nanomq.io/docs/zh/latest/api/v4.html\#post-api-v4-rules)

创建规则，返回规则 ID 。

**Parameters (json):**

| Name                   | Type   | Required | Description                                                   |
| ---------------------- | ------ | -------- | ------------------------------------------------------------- |
| rawsql                 | String | True     | 规则的 SQL 语句                                               |
| actions                | Array  | True     | 动作列表                                                      |
| \- actions\[0\].name   | String | True     | 动作名称 (include repub, mysql, sqlite)                       |
| \- actions\[0\].params | Object | True     | 动作参数。参数以 key-value 形式表示。详情可参看添加规则的示例 |
| description            | String | False    | 可选，规则描述                                                |

**Success Response Body (JSON):**

| Name           | Type             | Description                      |
| -------------- | ---------------- | -------------------------------- |
| code           | Integer          | 0                                |
| enabled        | Boolean          | 过滤条件：规则是否开启状态       |
| data           | Array of Objects | 规则详情                         |
| \- data.id     | String           | 规则 ID                          |
| \- data.rawsql | String           | SQL 语句，与请求中的 rawsql 一致 |

#### PUT /api/v4/rules/{rule\_id} [​](https://nanomq.io/docs/zh/latest/api/v4.html\#put-api-v4-rules-rule-id)

更新规则，返回规则 ID 。

**Parameters (json):**

| Name                   | Type   | Required | Description                                                         |
| ---------------------- | ------ | -------- | ------------------------------------------------------------------- |
| rawsql                 | String | True     | 可选，规则的 SQL 语句                                               |
| actions                | Array  | True     | 可选，动作列表                                                      |
| \- actions\[0\].name   | String | True     | 可选，动作名称                                                      |
| \- actions\[0\].params | Object | True     | 可选，动作参数。参数以 key-value 形式表示。详情可参看添加规则的示例 |
| description            | String | False    | 可选，规则描述                                                      |

**Success Response Body (JSON):**

| Name           | Type             | Description                      |
| -------------- | ---------------- | -------------------------------- |
| code           | Integer          | 0                                |
| enabled        | Boolean          | 过滤条件：规则是否开启状态       |
| data           | Array of Objects | 规则详情                         |
| \- data.id     | String           | 规则 ID                          |
| \- data.rawsql | String           | SQL 语句，与请求中的 rawsql 一致 |

#### DELETE /api/v4/rules/{rule\_id} [​](https://nanomq.io/docs/zh/latest/api/v4.html\#delete-api-v4-rules-rule-id)

删除规则。

**Parameters:** 无

**Success Response Body (JSON):**

| Name | Type    | Description |
| ---- | ------- | ----------- |
| code | Integer | 0           |

**Examples:**

添加一个规则，对于所有匹配到主题 "t/a" 的消息，打印其规则运行参数。

bash

```
$ curl -XPOST -d '{
  "rawsql": "select * from \"t/a\"",
  "actions": [{\
      "name": "repub",\
      "params": {\
          "topic": "repub1", "address":"mqtt-tcp://broker.emqx.io:1883", "clean_start": "true", "clientid": "id", "username": "admin", "password": "public", "proto_ver": 4, "keepalive": 60\
      }\
  }],
  "description": "repub-rule"

}' --basic -u admin:public 'http://localhost:8081/api/v4/rules'

{"data":{"rawsql":"select * from \"t/a\"","id":4,"enabled":true},"actions":[],"code":0}
```

使用规则 ID 获取刚才创建的规则详情:

bash

```
$ curl --basic -u admin:public 'http://localhost:8081/api/v4/rules/rule:4'

{"data":{"rawsql":"select * from \"t/a\"","id":1,"enabled":true},"actions":[],"code":0}
```

获取所有的规则，注意返回值里的 data 是个规则对象的数组:

bash

```
$ curl --basic -u admin:public 'http://localhost:8081/api/v4/rules'

{"data":[{"rawsql":"SELECT payload.x.y as y, payload.z as z FROM \"#\" WHERE y > 10 and z != 'str'","id":1,"enabled":true},{"rawsql":"SELECT * FROM \"abc\"","id":2,"enabled":true},{"rawsql":"SELECT payload, qos FROM \"#\" WHERE qos > 0","id":3,"enabled":true},{"rawsql":"select * from \"t/a\"","id":4,"enabled":true}],"code":0}
```

更新一下规则的 SQL 语句，改为 select \* from "t/b":

bash

```
$ curl -XPUT --basic -u admin:public 'http://localhost:8081/api/v4/rules/rule:4' -d '{"rawsql":"select * from \"t/b\""}'

{"data":{"rawsql":"select * from \"t/b\"","id":4,"enabled":true},"actions":[],"code":0}
```

停用规则 (disable):

bash

```
$ curl -XPUT --basic -u admin:public 'http://localhost:8081/api/v4/rules/rule:4' -d '{"enabled": false}'
{"data":{"rawsql":"select * from \"t/b\"","id":4,"enabled":false},"actions":[],"code":0}
```

删除规则:

bash

```
$ curl -XDELETE --basic -u admin:public 'http://localhost:8081/api/v4/rules/rule:4'

{"code":0}
```