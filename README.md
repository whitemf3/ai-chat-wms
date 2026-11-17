# AI Chat Admin

AI Chat 平台的管理界面，负责用户、模型、额度、分享、智能路由和系统配置。业务数据与权限校验由 [Worker](../worker/README.md) 提供，Admin 不直接连接 D1、KV、R2 或模型服务。

## 技术栈与职责

当前 `package.json` 声明 **Nuxt 3、Vue 3、Pinia 2**，锁文件中的 Nuxt 为 **3.21.8**；样式来自 `assets/css/main.css` 和 Vue 组件，未配置 `@nuxt/ui`。因此本文不按 Nuxt 4 / Nuxt UI 4 的项目结构描述；框架版本请以实际依赖与锁文件为准。

| 页面 | 功能 |
| --- | --- |
| `/login` | 管理员登录，生产接入 Turnstile |
| `/` | 仪表盘统计和管理入口 |
| `/models` | 模型增删改、启停、能力标记、上下文窗口、输出上限、温度、价格和模型测试 |
| `/users` | 用户列表、状态及角色管理，操作范围受服务端权限限制 |
| `/quota` | 每日使用量、用户额度和历史记录 |
| `/shares` | 分享查询、过期、激活、延期与删除 |
| `/router` | 智能路由配置、模型目标、关键词、LLM 意图分类参数及测试 |
| `/settings` | 注册开关、站点配置、打字效果延迟及操作日志 |

当前是配置化智能路由，不是旧版 `/workflows` 多步骤工作流编辑器。`/router` 对应 `/api/admin/router-config`，旧工作流接口和模型选择规则表不应继续作为操作入口。

## 架构与权限边界

```text
Nuxt 页面 / 布局
  → useAdminAuth（Pinia、Token、本地登录状态、fetchAPI）
  → NUXT_PUBLIC_API_BASE + /api/admin/...
  → Worker JWT / 用户状态 / 管理员角色校验
      ├─ D1：用户、模型、路由、系统配置、分享、操作日志
      ├─ KV：用量、用户状态与配置缓存
      └─ Workers AI：模型和路由测试
```

- `plugins/admin-auth.client.ts` 初始化登录状态；`middleware/admin.ts` 承担客户端导航检查。
- Token 与管理员展示信息保存在浏览器 localStorage；退出登录是清理本地状态，不调用一个不存在的 `/api/admin/auth/logout`。
- 页面隐藏按钮或本地存在 Token 不是授权依据。Worker 读取 `users.role`，支持 `user`、`admin`、`super_admin`；敏感写操作及数据范围以服务端检查为准，不是任意可配置的细粒度权限系统。
- `fetchAPI` 遇到 401 清理登录状态；403 表示可能无操作权限，应核对角色与账户状态，不要尝试在浏览器篡改角色信息。
- 首次管理员账号须通过受控运维流程准备；不提供默认账号或固定密码。不要通过文档示例凭据进入生产系统。

### 与聊天行为的关系

模型的 `max_output_tokens` 是回答长度的重要配置，不是 HTTP 超时；达到上限时用户可以继续生成。`typing_delay` 仅控制前端显示节奏，不改变模型生成速度或输出预算。

当前聊天协议区分新建消息、回复版本和原回复续写；分支选择保存在 `messages.metadata.branch`，本次分支功能无需 schema 迁移。文本生成采用 90 秒上游空闲超时、15 秒 SSE 心跳，正常完成与长度上限、异常中断分别处理；前端网络空闲超时为 2 分钟。这些不是整次对话的总时长限制。详细语义见 [Worker README](../worker/README.md)。

## 目录

```text
admin/
├─ app.vue                       应用入口
├─ pages/                        仪表盘、登录、模型、用户、额度、分享、路由、设置
├─ layouts/                      页面布局与导航
├─ components/                   共用界面组件
├─ composables/useAdminAuth.ts    Pinia 认证与 API 请求封装
├─ middleware/admin.ts           客户端路由检查
├─ plugins/admin-auth.client.ts  登录状态初始化
├─ assets/css/main.css           全局样式
├─ nuxt.config.ts                API 地址、Nitro 部署 preset
├─ package.json                  开发与构建脚本
├─ package-lock.json             锁定依赖
└─ .output/public/               默认静态生成产物
```

`dist/` 是 Cloudflare Pages preset 对应的产物位置，不应与默认静态生成路径混用。目录中已有的构建产物不代表本次构建使用的 preset。

## 环境变量与安全

| 名称 | 安全示例 | 说明 |
| --- | --- | --- |
| `NUXT_PUBLIC_API_BASE` | `https://api.example.com` | Worker origin，不带 `/api` 和末尾斜杠；本地默认 `http://localhost:8790` |
| `NUXT_PLATFORM` | `edgeone` 或 `cloudflare` | 构建目标选择；不设置时使用 `static` preset |

- `NUXT_PUBLIC_API_BASE` 是公开配置，不是密钥。静态站点在构建时确定 API 地址，托管控制台改变量后需要重新构建。
- `NUXT_PLATFORM=cloudflare` 选择 `cloudflare-pages`；`edgeone` 保持静态 preset，并启用全路由预渲染规则。
- 不要在 Admin 环境中放入 `JWT_SECRET`、`TURNSTILE_SECRET`、Cloudflare API Token 等后端凭据。
- Turnstile 的公开 site key 位于 `pages/login.vue`，迁移域名时要核对允许域名。secret 仅在 Worker 的安全变量中配置；本地开发豁免不能作为生产绕过方式。

## 本地运行

建议 Node.js **22.23+ 或 24 LTS**，配套 npm。以下命令在 `admin/` 目录执行；环境变量赋值写法适用于 Git Bash / POSIX shell。

1. 按 Worker README 准备本地资源和可用于测试的管理员账号，并在另一终端启动 Worker（8790）。
2. 安装和启动 Admin：

```bash
npm ci
npm run dev
```

访问 <http://localhost:3001>。如需显式指定测试 API：

```bash
NUXT_PUBLIC_API_BASE=http://localhost:8790 npm run dev
```

Admin 直接访问配置的 Worker origin，不使用 Web 的 8090 `/api` 开发代理。Worker 应允许管理站点的跨域请求。

| 命令 | 用途 |
| --- | --- |
| `npm ci` | 按锁文件安装，自动执行 `nuxt prepare` |
| `npm run dev` | Nuxt 开发服务，端口 3001 |
| `npm run generate` | 静态生成，默认输出 `.output/public` |
| `npm run build` | 按当前 Nitro preset 构建 |
| `npm run preview` | 预览已构建产物，具体方式以该 preset 的构建提示为准 |

当前未提供专用 `test`、`lint` 或 `type` npm 脚本，且 Nuxt 配置关闭了构建时类型检查；构建成功不能代替类型检查和功能回归。

## 构建与部署

### 静态托管：EdgeOne Pages 或其他静态服务

默认静态构建：

```bash
NUXT_PUBLIC_API_BASE=https://api.example.com npm run generate
```

EdgeOne 明确目标的构建：

```bash
NUXT_PLATFORM=edgeone NUXT_PUBLIC_API_BASE=https://api.example.com npm run generate
```

发布目录是 **`.output/public`**。控制台安装命令可设 `npm ci`，构建命令设 `npm run generate`，同时注入上述变量。保留 Nuxt 生成的页面和静态资源，验证 `/login`、`/models`、`/router` 等深路径直接访问和刷新可用。当前 admin 仓库没有自己的 `edgeone.json`，不要直接复制 Web 的多入口 HTML 重写规则。

### Cloudflare Pages preset

需要 Nitro 的 Pages 目标时使用：

```bash
NUXT_PLATFORM=cloudflare NUXT_PUBLIC_API_BASE=https://api.example.com npm run build
```

当前 Nitro 的 `cloudflare-pages` preset 输出到 **`dist/`**，包含相应的 Pages Worker 产物。托管配置必须同时设置 `NUXT_PLATFORM=cloudflare`、`npm run build` 和正确输出目录，并以构建日志确认。Admin 的 Pages Worker 不替代独立的聊天 Worker API。

若在 Pages 上只托管静态文件，也可使用上一节 `generate` + `.output/public`；不要把两种模式的命令与输出目录交叉搭配。

### GitHub 推送触发部署

Admin 是独立 Git 仓库，没有自带 GitHub Actions 工作流。推送自动部署可以由 EdgeOne / Cloudflare Pages 控制台的 Git 集成提供；没有仓库工作流不意味着外部集成未设置，也不能保证克隆后会自动部署。

在托管控制台核对：仓库和生产分支、构建根目录（独立仓库为根目录，父目录组织则为 `admin`）、Node 版本、安装/构建命令、输出目录、环境变量和预览环境。成功推送后应查看对应提交的部署日志，而不是仅凭本地构建成功判断上线。

## API 概览

登录之外的业务接口需携带 `Authorization: Bearer <ADMIN_JWT>`，并通过 Worker 的管理员权限检查。下列为实际页面使用的主要接口，不包含旧 README 中的 `/auth/me`、`/auth/logout` 或 `/workflows`。

| 接口 | 用途 |
| --- | --- |
| `POST /api/admin/auth/login` | 管理员登录 |
| `GET /api/admin/dashboard/stats` | 仪表盘统计 |
| `GET /api/admin/users` | 用户列表 |
| `PUT /api/admin/users/:id/status`、`PUT /api/admin/users/:id/role` | 状态与角色管理 |
| `GET /api/admin/models`、`POST /api/admin/models` | 模型列表、新建 |
| `PUT /api/admin/models/:id`、`DELETE /api/admin/models/:id` | 更新、删除 |
| `PUT /api/admin/models/:id/toggle` | 启用 / 禁用 |
| `GET /api/admin/models/pricing-preset`、`POST /api/admin/models/test` | 价格参考、测试 |
| `GET /api/admin/usage/daily`、`GET /api/admin/usage/history` | 每日及历史用量 |
| `PUT /api/admin/usage/user/:userId` | 设置用户额度 |
| `GET /api/admin/shares`、`DELETE /api/admin/shares/:id` | 分享查询、删除 |
| `PUT /api/admin/shares/:id/expire`、`/activate`、`/extend` | 分享过期、激活、延期 |
| `GET /api/admin/router-config`、`PUT /api/admin/router-config` | 读取、保存路由配置 |
| `POST /api/admin/router-config/test` | 路由测试 |
| `GET /api/admin/config`、`PUT /api/admin/config` | 系统配置 |
| `PUT /api/admin/config/registration`、`GET /api/admin/logs` | 注册开关、操作日志 |

具体字段和超级管理员限制见 `pages/` 调用处以及 `../worker/src/routes/admin/`，不得根据页面按钮推断服务端权限。

## 常见故障

| 现象 | 检查方向 |
| --- | --- |
| API 仍指向旧环境 | 检查 `NUXT_PUBLIC_API_BASE`、构建环境和当前发布的产物；静态站点改变量需要重建 |
| 登录失败 / Turnstile 不通过 | 检查 API origin、后端 `ENVIRONMENT`、Turnstile 允许域名和 secret 是否匹配，不在生产使用开发豁免 |
| 401 / 403 | 重新登录验证 Token；检查账户状态、角色与服务端操作范围，不修改本地角色绕过限制 |
| 路由页或模型列表报缺表 / 缺列 | 查看 Worker 数据库版本，按已有库状态审查迁移；不要再次执行整个 schema |
| 生成后托管目录为空或部署失败 | 区分默认 `.output/public` 与 Cloudflare preset 的 `dist`，检查 Node 版本和 `NUXT_PLATFORM` |
| 页面能打开但刷新深路径 404 | 核对预渲染产物与托管平台路径处理；不要把 JS/CSS 请求重写成页面 |
| 模型测试成功，聊天仍用另一模型 | 检查智能路由的实际目标、关键词、意图分类与降级配置；单个模型测试不代表路由已指向它 |
| 长回答被截断 | 检查 `max_output_tokens` 与 finish reason；打字延迟不是输出上限，详见 Worker 的流式约定 |

## 验证方法

1. 按目标执行 `npm ci` 和静态生成 / Pages 构建，确认输出目录、API 地址、页面及静态资源。
2. 使用隔离测试账号验证登录、刷新后的会话恢复和退出；普通用户访问管理 API 应被拒绝。
3. 在测试环境核对仪表盘、用户列表、额度历史、模型列表和系统配置读取。
4. 对有权限的测试管理员验证模型启停、输出上限、路由测试及配置保存；确认权限不足时返回拒绝，而非只隐藏按钮。
5. 与 Web 联调普通回答、长度上限后的继续生成、重新生成分支和公开分享；这些行为不能只靠 Admin 页面测试确认。
6. 对分享过期/激活/延期、注册开关及日志进行受控验证；避免用生产用户、真实分享或实际权限变更做冒烟测试。
7. 发布验证时直接访问并刷新各深路径，检查控制台网络错误及对应提交的托管构建日志。

以上是验证方法，不表示已经执行生产操作或完成线上验证。

## 关联文档

- [Web](../web/README.md)：用户聊天界面、附件与公开分享。
- [Worker](../worker/README.md)：API、角色校验、模型路由、数据初始化及迁移注意事项。
- [父目录 README](../README.md)、[部署指南](../DEPLOYMENT.md)：历史平台说明；其中旧框架版本、接口和构建目录应以各子项目当前实现为准。
