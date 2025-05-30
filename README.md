# NanoMQ Dashboard

一个功能完善、界面美观的 NanoMQ MQTT Broker 管理面板，基于 Next.js 14 和 Tailwind CSS v4 构建。

## 功能特性

### 🚀 核心功能
- **实时监控**: 实时显示 NanoMQ 的运行状态和性能指标
- **客户端管理**: 查看和管理所有连接的 MQTT 客户端
- **订阅管理**: 监控和管理所有活跃的主题订阅
- **统计分析**: 详细的性能统计和数据可视化
- **系统配置**: 完整的 NanoMQ 配置管理界面

### 🎨 界面特性
- **现代化设计**: 基于 Tailwind CSS v4 的现代化 UI 设计
- **响应式布局**: 完美适配桌面端和移动端
- **深色模式**: 支持明暗主题切换
- **直观导航**: 清晰的侧边栏导航和面包屑导航

### 📊 监控面板
- **连接状态**: 实时显示在线/离线客户端数量
- **消息统计**: 消息接收、发送、丢弃等统计信息
- **性能指标**: CPU、内存使用率和网络流量监控
- **系统信息**: 运行时间、版本信息等系统状态

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **样式框架**: Tailwind CSS v4
- **UI 组件**: 自定义组件库
- **图标库**: Lucide React
- **HTTP 客户端**: Axios
- **包管理器**: pnpm
- **开发语言**: TypeScript

## 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- pnpm 8.0 或更高版本

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本
```bash
pnpm build
```

### 启动生产服务器
```bash
pnpm start
```

## 配置说明

### NanoMQ API 配置
在使用前，请确保：
1. NanoMQ 服务正在运行
2. HTTP API 已启用
3. 在应用中配置正确的 NanoMQ API 地址

默认配置：
- API 地址: `http://localhost:8081`
- 端口: 8081

### 环境变量
创建 `.env.local` 文件来配置环境变量：
```env
NEXT_PUBLIC_NANOMQ_API_URL=http://localhost:8081
```

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── (admin)/           # 管理面板页面
│   │   ├── clients/       # 客户端管理
│   │   ├── subscriptions/ # 订阅管理
│   │   ├── statistics/    # 统计分析
│   │   └── configuration/ # 系统配置
│   └── layout.tsx         # 根布局
├── components/            # 可复用组件
├── context/              # React Context
│   └── NanoMQContext.tsx # NanoMQ 状态管理
├── lib/                  # 工具库
│   └── nanomq-api.ts     # NanoMQ API 客户端
└── layout/               # 布局组件
    ├── NanoMQSidebar.tsx # 侧边栏导航
    └── AppHeader.tsx     # 顶部导航
```

## API 集成

本项目集成了 NanoMQ 的 HTTP API，支持以下功能：

- **Broker 信息**: `/api/v4/brokers`
- **节点信息**: `/api/v4/nodes`
- **客户端列表**: `/api/v4/clients`
- **订阅列表**: `/api/v4/subscriptions`
- **统计指标**: `/api/v4/metrics`
- **系统控制**: `/api/v4/ctrl/*`

## 功能模块

### 1. 仪表板 (Dashboard)
- 系统概览和关键指标
- 连接状态实时监控
- 快速操作面板
- 最近活动日志

### 2. 客户端管理 (Clients)
- 客户端列表和详细信息
- 连接状态监控
- 协议类型统计
- 客户端搜索和过滤

### 3. 订阅管理 (Subscriptions)
- 活跃订阅列表
- QoS 级别统计
- 通配符订阅监控
- 主题分析

### 4. 统计分析 (Statistics)
- 消息吞吐量统计
- 网络流量分析
- 性能指标图表
- 历史数据趋势

### 5. 系统配置 (Configuration)
- Broker 基础配置
- 安全设置 (SSL/TLS)
- WebSocket 配置
- 日志设置
- 性能调优参数

## 开发指南

### 添加新页面
1. 在 `src/app/(admin)/` 下创建新目录
2. 添加 `page.tsx` 文件
3. 在 `NanoMQSidebar.tsx` 中添加导航项

### 自定义主题
修改 `tailwind.config.js` 来自定义主题颜色和样式。

### API 扩展
在 `src/lib/nanomq-api.ts` 中添加新的 API 方法。

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如果您在使用过程中遇到问题，请：
1. 查看 [Issues](../../issues) 页面
2. 创建新的 Issue 描述问题
3. 提供详细的错误信息和复现步骤

## 更新日志

### v1.0.0
- 初始版本发布
- 完整的 NanoMQ 管理功能
- 现代化的 UI 设计
- 响应式布局支持
