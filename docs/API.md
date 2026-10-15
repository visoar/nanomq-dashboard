# NanoMQ API contract / API 契约

Verified against [NanoMQ 0.25.6](https://github.com/nanomq/nanomq/releases/tag/0.25.6), commit `926179ec41adbb8dbc0a191746ea78d91d53c463`, on 2026-10-15. The [official v4 reference](https://nanomq.io/docs/en/latest/api/v4.html) is useful, but the release source and real requests resolve discrepancies.

于 2026-10-15 对照上述正式版本源码及真实 Broker 验证。文档与实现不一致时，采用实际可调用的接口。

| Feature / 功能 | Upstream / 上游接口 | Contract / 约定 |
| --- | --- | --- |
| Discovery / 端点列表 | `GET /api/v4` | `{ code, data: Endpoint[] }`; registry alone does not prove implementation / 列表不能证明路由实际可用 |
| Broker / 节点 | `GET /brokers`, `GET /nodes` | `data` arrays / 数组 |
| Clients / 客户端 | `GET /clients` | `client_id`, `conn_state`; `recv_msg` may be absent / 消息计数可能缺失 |
| Subscriptions / 订阅 | `GET /subscriptions` | `clientid`, `topic`, `qos`; filtering/pagination in the dashboard / 前端筛选分页 |
| Topic hierarchy / 主题层级 | `GET /topic-tree` | Array of breadth-first levels; no reliable parent IDs / 按层返回，未提供可靠父节点标识 |
| Process metrics / 进程指标 | `GET /metrics` | **Unwrapped** `{ metrics, cpuinfo, memory, connections }`; bridge metrics are not global message counters / 无 data 包装，桥接统计不能充当全局消息计数 |
| Global counters / 全局计数 | `GET /prometheus` | Plain text; named `nanomq_*` series / 文本格式 |
| Publish / 单条发布 | `POST /mqtt/publish` | Empty payload valid; `encoding: base64` encodes plaintext **on the broker** / 空负载有效，base64 由 Broker 执行编码 |
| Batch publish / 批量发布 | `POST /mqtt/publish_batch` | JSON array; each `data[]` entry has its own `code` / 数组请求，逐条核对结果码 |
| Hot configuration / 热更新 | `GET, POST /reload` | POST `{ data: ReloadConfig }`; packet sizes in KiB / 报文大小单位 KiB |
| Sections / 配置章节 | `GET, POST /configuration/:section` | POST `{ data: { [section]: … } }`; `auth` is an array / auth 为数组 |
| File / 配置文件 | `POST /config_update` | Upstream takes raw HOCON, **not** a JSON `{data}` wrapper; dashboard accepts JSON then forwards raw text / 上游直接接收 HOCON 文本 |
| Control / 控制 | `POST /ctrl/restart`, `POST /ctrl/stop` | Explicit confirmation; stopped broker must be started on its host / 停止后需在服务器启动 |
| Rules / 规则 | `GET, POST /rules`; `GET, PUT, DELETE /rules/rule:N` | ID path keeps literal `:`; one action per rule; optional modules required / 保留冒号，单条规则一个动作，依赖编译模块 |
| Bridges / 桥接 | `GET /bridges/:name`; `POST /bridges/switch/:name` | Inspect/switch existing nodes; edit via full HOCON file / 查看、启停，配置编辑通过完整 HOCON 文件 |
| Bridge subscriptions / 桥接订阅 | `POST /bridges/sub/:name`, `POST /bridges/unsub/:name` | `{ data: { subscription: [{remote_topic, local_topic, qos}] } }` / `{ data: { unsubscription: [{topic}] } }` |

All paths after the first row are relative to `/api/v4`. Every dashboard request goes through its authenticated, allowlisted Next.js proxy.  Upstream HTTP errors and nonzero application codes remain errors. No random or fallback metrics are generated.

上述后续路径均相对 `/api/v4`。所有请求经统一认证代理；HTTP 错误和非零业务码都视为失败，不生成随机数据或降级假数据。

## Release-specific boundaries / 当前版本边界

- **Client subscribe/unsubscribe writes** are commented out in `nanomq/rest_api.c` in 0.25.6, despite appearing in discovery and documentation. These nonfunctional controls are not shown. MQTT clients manage their own subscriptions; bridge subscriptions use their working dedicated endpoints.
- **Bridge creation and deletion** are not routed in this release. Configure new bridges in the broker's HOCON file. Existing bridges can be switched; create/edit/remove nodes through the complete HOCON file and restart workflow.
- **Readback is not a complete writable bridge definition.** Fields such as `no_local_v4`, TLS file paths and duration units are not round-tripped by GET. In addition, repeated `PUT /bridges/:name` reproduced a broker SIGTRAP on the native 0.25.6 build even with serialized requests. The dashboard does not expose that unsafe operation: bridge editing goes through the full HOCON file and restart workflow.
- `/reload` exposes `enable_mqtt_stream` and `bridge_mode`, but its setter does not update them. Only the seven implemented hot fields are editable.
- Process CPU/memory collection is Linux-specific upstream. Other platforms may return zero; the dashboard preserves the actual response. Missing or failed metrics display `—`, not zero.
- History is at most 120 in-memory samples from the current tab session. Message rates use actual sample timestamps; a counter reset leaves that interval undefined. This is not persistent monitoring storage.
- Rule actions `sqlite`, `mysql`, `postgresql` and `timescaledb` require matching upstream build options and database configuration. Their API parameter objects use `table`, `host`, `username`, `password`; database selection belongs to the broker configuration. GET does not expose action secrets, so action replacement requires explicit input.
- API acceptance confirms a broker request, not downstream delivery. Integration tests use actual MQTT subscribers to verify message delivery.

- **普通客户端订阅写接口**虽然仍列于文档和端点列表，但 0.25.6 的路由已被注释，因此不显示无效按钮；客户端自行管理订阅，桥接使用专用接口。
- **桥接创建、删除**在当前版本没有实际路由；新增请修改 Broker HOCON 配置，现有桥接可以启停，节点增改删通过完整 HOCON 文件写入及重启完成。
- **桥接读回值不是完整写入定义**。部分新字段、TLS 路径和时长单位无法往返还原，原生 0.25.6 连续调用 `PUT /bridges/:name` 还可复现 SIGTRAP，串行请求也会触发。面板不开放该危险操作，桥接编辑统一通过完整 HOCON 文件及重启完成。
- **热更新**仅开放上游 setter 实际处理的七个字段；`enable_mqtt_stream`、`bridge_mode` 虽可读取，但不能通过该接口更新。
- **进程资源指标**由上游在 Linux 采集，其他平台可能返回零；面板忠实显示响应，缺失或失败显示 `—`。
- **历史与速率**只覆盖当前页面会话最近 120 次采样，按实际时间间隔计算；计数器重置不产生负速率，不宣称持久化历史。
- **数据库规则动作**需要对应编译模块与数据库配置；动作参数不包含 `database`，数据库选择属于 Broker 配置。GET 不返回动作密码，修改动作需重新输入。
- **发布回执**表示 Broker 接受请求，集成测试另用真实 MQTT 订阅端核对投递。
