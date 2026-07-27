# AI Chat 后台管理系统

基于 Nuxt 3 + Vue 3 + Pinia 构建的 AI Chat 平台后台管理系统，部署在 Cloudflare Pages。

## 功能模块

### 1. 仪表盘 (`/`)
- 系统概览统计
- 今日对话数、用户数、消息数
- 快速入口导航

### 2. 模型管理 (`/models`)
- 查看、新增、编辑、删除模型配置
- 配置模型参数：Context Window、Max Output、Temperature
- 设置模型价格（Input/Output Neurons）
- 启用/禁用模型

### 3. 用户管理 (`/users`)
- 查看所有用户列表
- 查看用户详情和对话历史
- 设置用户状态（正常/禁用）
- 管理员权限管理

### 4. 额度管理 (`/quota`)
- 查看用户每日使用量
- 设置用户每日 Neurons 额度
- 查看历史使用记录
- 额度超限用户筛选

### 5. 分享管理 (`/shares`)
- 管理用户创建的分享链接
- 查看分享详情和访问统计
- 删除违规分享
- 分享状态管理

### 6. 工作流管理 (`/workflows`)
- 查看和管理工作流模板
- 编辑工作流步骤和配置
- 启用/禁用工作流

### 7. 系统设置 (`/settings`)
- 网站基本信息配置
- 默认模型设置
- 操作日志查看

## 技术栈

- **框架**: Nuxt 3
- **前端**: Vue 3 + Composition API
- **状态管理**: Pinia
- **样式**: 自定义 CSS（Apple 风格设计）
- **部署**: Cloudflare Pages

## 目录结构

```
admin/
├── assets/
│   └── css/
│       └── main.css          # 全局样式
├── components/
│   ├── TopAlert.vue          # 顶部通知组件
│   └── ...
├── composables/
│   ├── useAdminAuth.ts       # 管理员认证
│   └── useDialog.ts          # 对话框工具
├── layouts/
│   └── default.vue           # 默认布局
├── middleware/
│   └── admin.ts              # 管理员权限中间件
├── pages/
│   ├── index.vue             # 仪表盘
│   ├── login.vue             # 登录页
│   ├── models.vue            # 模型管理
│   ├── quota.vue             # 额度管理
│   ├── settings.vue          # 系统设置
│   ├── shares.vue            # 分享管理
│   ├── users.vue             # 用户管理
│   └── workflows.vue         # 工作流管理
├── plugins/
│   └── pinia.ts              # Pinia 插件
├── utils/
│   └── ...
├── app.vue                   # 根组件
├── nuxt.config.ts            # Nuxt 配置
└── package.json
```

## 开发指南

### 环境要求

- Node.js >= 18.x
- npm >= 9.x

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 http://localhost:3001

### 构建生产版本

```bash
npm run generate
```

生成的静态文件在 `dist/` 目录。

### 预览生产版本

```bash
npm run preview
```

## 环境配置

### 环境变量

创建 `.env` 文件：

```env
NUXT_PUBLIC_API_BASE=https://your-api.example.com
```

或直接修改 `nuxt.config.ts`：

```typescript
runtimeConfig: {
  public: {
    apiBase: 'https://your-api.example.com',
  },
},
```

## API 接口

后台管理系统调用 Worker API，所有接口需要管理员权限。

### 认证

- `POST /api/admin/auth/login` - 管理员登录
- `POST /api/admin/auth/logout` - 登出
- `GET /api/admin/auth/me` - 获取当前管理员信息

### 模型管理

- `GET /api/admin/models` - 获取模型列表
- `POST /api/admin/models` - 新增模型
- `PUT /api/admin/models/:id` - 更新模型
- `DELETE /api/admin/models/:id` - 删除模型

### 用户管理

- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/users/:id` - 获取用户详情
- `PUT /api/admin/users/:id` - 更新用户信息

### 额度管理

- `GET /api/admin/usage/daily` - 获取每日使用量
- `GET /api/admin/usage/history` - 获取历史记录
- `PUT /api/admin/usage/user/:id` - 设置用户额度

### 分享管理

- `GET /api/admin/shares` - 获取分享列表
- `DELETE /api/admin/shares/:id` - 删除分享

### 工作流管理

- `GET /api/admin/workflows` - 获取工作流列表
- `POST /api/admin/workflows` - 创建工作流
- `PUT /api/admin/workflows/:id` - 更新工作流
- `DELETE /api/admin/workflows/:id` - 删除工作流

## 部署

### Cloudflare Pages

1. 连接 GitHub 仓库到 Cloudflare Pages
2. 配置构建命令：
   - Build command: `npm run generate`
   - Build output directory: `dist`
3. 设置环境变量 `NUXT_PUBLIC_API_BASE`

### 手动部署

```bash
# 构建
npm run generate

# dist 目录内容可直接部署到任何静态托管服务
```

## 权限控制

- 所有页面通过 `middleware/admin.ts` 进行权限验证
- 未登录用户自动重定向到 `/login`
- 超级管理员拥有所有权限
- 普通管理员权限可自定义

## 设计风格

- Apple 风格设计语言
- 深色模式支持
- 响应式布局
- 流畅的过渡动画

## 注意事项

1. **API 地址**: 确保 `NUXT_PUBLIC_API_BASE` 配置正确
2. **跨域**: API 服务器需配置 CORS 允许后台域名
3. **认证**: 登录后 Token 存储在 localStorage，页面刷新后需重新验证
4. **缓存**: 如遇页面异常，可尝试清除 `.nuxt` 目录后重新构建

## 常见问题

### Q: 页面刷新后样式丢失？
A: 运行 `rm -rf .nuxt && npm run dev` 清除缓存。

### Q: API 请求 401 错误？
A: 检查管理员 Token 是否过期，重新登录。

### Q: 构建失败？
A: 确保依赖完整安装：`rm -rf node_modules && npm install`。

## 相关项目

- [worker](../worker/) - Cloudflare Workers API 后端
- [web](../web/) - AI Chat 前端用户界面

## License

MIT