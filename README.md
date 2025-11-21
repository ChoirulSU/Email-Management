<div align="center">
  <img src="./public/logo.svg" alt="Email Management Logo" width="150" />

  # 邮箱管理系统 (Email Management)

  一个基于 **Cloudflare Workers Pages** 的现代化邮箱账号管理系统，支持批量导入、平台分类、API 调用等功能。

  > 本项目完全运行在 Cloudflare 边缘网络上，使用 D1 数据库存储数据，无需服务器，全球加速访问。
</div>

## 预览

### 登录页
![Login Page](https://img.zhengmi.org/file/1763727396269_image.png)

### 仪表板
![Dashboard](https://img.zhengmi.org/file/1763727212660_image.png)

### 邮箱管理
![Email Management](https://img.zhengmi.org/file/1763727219387_1763727209294.jpg)

## 功能特性

### 核心功能

- **管理员登录** - 通过环境变量密钥认证，安全可靠
- **平台管理** - 自定义添加/编辑/删除平台（如 Google、Facebook、Twitter 等）
- **邮箱批量导入** - 支持自定义分隔符，一次导入大量邮箱
- **邮箱批量操作** - 批量删除、批量设置平台、平台冲突检测
- **邮箱筛选** - 按使用状态、支持平台、关键词搜索
- **数据统计** - 总数、已用、未用统计，按平台分类统计
- **API 日志** - 完整的 API 调用记录和频率分析
- **外部 API** - 提供 RESTful API 供其他系统调用

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| UI 组件 | shadcn/ui + TailwindCSS |
| UI 主题 | [Matsu Theme](https://matsu-theme.vercel.app/) (Ghibli Studio 风格) |
| 图表 | Recharts |
| 后端框架 | Hono.js |
| 数据库 | Cloudflare D1 (SQLite) |
| 部署平台 | Cloudflare Pages |
| 构建工具 | Vite |

## 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 或 npm
- [Cloudflare 账号](https://dash.cloudflare.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### 1. 克隆项目

```bash
git clone https://github.com/your-username/mail-manager.git
cd mail-manager
```

### 2. 安装依赖

```bash
pnpm install
# 或
npm install
```

### 3. 登录 Cloudflare

```bash
npx wrangler login
```

这会打开浏览器让你授权 Wrangler CLI。

### 4. 创建 D1 数据库

```bash
npx wrangler d1 create mail-manager-db
```

命令执行后会输出类似以下内容：

```
✅ Successfully created DB 'mail-manager-db'

[[d1_databases]]
binding = "DB"
database_name = "mail-manager-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**复制 `database_id`**，后面需要用到。

### 5. 配置 wrangler.toml

编辑项目根目录的 `wrangler.toml` 文件，将 `database_id` 替换为你的实际值：

```toml
name = "mail-manager"
compatibility_date = "2024-01-01"
pages_build_output_dir = "./dist"

[[d1_databases]]
binding = "DB"
database_name = "mail-manager-db"
database_id = "你的数据库ID"  # 替换这里
```

### 6. 初始化数据库

执行数据库迁移脚本，创建所需的表结构：

```bash
npx wrangler d1 execute mail-manager-db --file=./migrations/0001_init.sql
```

成功后会显示：

```
🌀 Executing on mail-manager-db (xxxxxxxx):
🌀 To execute on your remote database, add a --remote flag.
```

**注意：** 如果要在生产环境执行，需要添加 `--remote` 参数：

```bash
npx wrangler d1 execute mail-manager-db --remote --file=./migrations/0001_init.sql
```

### 7. 设置环境变量（Secrets）

设置管理员登录密钥和 API 调用密钥：

```bash
# 设置管理员密钥（用于后台登录）
echo "你的管理员密码" | npx wrangler pages secret put ADMIN_SECRET_KEY --project-name=mail-manager

# 设置 API 密钥（用于外部 API 调用）
echo "你的API密钥" | npx wrangler pages secret put API_SECRET_KEY --project-name=mail-manager
```

**安全建议：** 请使用强密码，例如：
- 管理员密钥：`MyAdminP@ssw0rd!2024`
- API 密钥：`xxxxxxxxxxxxxxxxxxxxxxx`

### 8. 本地开发

启动本地开发服务器：

```bash
# 终端 1：启动前端开发服务器
pnpm dev

# 终端 2：启动 Cloudflare Pages 本地服务器（带 D1 绑定）
pnpm dev:worker
```

访问 http://localhost:5173 查看前端界面。

**本地开发环境变量配置：**

创建 `.dev.vars` 文件（已在 `.gitignore` 中忽略）：

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`：

```
ADMIN_SECRET_KEY=your-local-admin-key
API_SECRET_KEY=your-local-api-key
```

### 9. 构建与部署

```bash
# 构建项目
pnpm build

# 部署到 Cloudflare Pages
npx wrangler pages deploy ./dist --project-name=mail-manager
```

首次部署时，如果项目不存在会自动创建。

部署成功后会显示：

```
✨ Deployment complete! Take a peek over at https://xxxxxxxx.mail-manager.pages.dev
```

你的系统现在已经部署到 Cloudflare 全球边缘网络！

## 使用指南

### 管理员后台

#### 登录

1. 访问你的部署地址（如 `https://mail-manager.pages.dev`）
2. 输入你设置的 `ADMIN_SECRET_KEY` 密钥
3. 点击登录

#### 平台管理

1. 点击左侧菜单「平台管理」
2. 点击「添加平台」按钮
3. 输入平台 Key（如 `google`）和名称（如 `Google`）
4. 点击添加

**平台 Key 规则：**
- 使用小写字母、数字、下划线
- 不能重复
- 建议使用简短易记的名称

#### 邮箱导入

1. 点击左侧菜单「邮箱管理」
2. 点击「批量导入」按钮
3. 设置分隔符（默认 `|`，也支持 `---`、`:` 等）
4. 在文本框中输入邮箱数据，每行一条：

```
email1@example.com|password123
email2@example.com|password456|这是备注
email3@example.com|pass789|备注信息|额外数据
```

5. 选择支持的平台（不选则默认支持所有平台）
6. 选择已注册的平台（可选）
7. 点击「开始导入」

**导入格式说明：**
- 第一列：邮箱地址（必填）
- 第二列：密码（必填）
- 第三列及以后：全部作为备注存储

#### 批量操作

1. 点击「批量操作」按钮
2. 输入要操作的邮箱列表（每行一个）
3. 选择操作类型：
   - **设置平台**：添加支持平台、标记已使用平台
   - **删除邮箱**：永久删除这些邮箱

**平台冲突检测：**

当批量操作的邮箱存在不同数量的平台支持时，系统会提示冲突信息，帮助你了解数据差异。

#### 仪表板

仪表板提供以下数据：

- **统计卡片**：总邮箱数、已使用数、未使用数
- **平台统计**：每个平台的使用情况
- **API 调用频率**：最近 7 天的调用趋势图
- **API 调用日志**：最近的调用记录

### 外部 API

系统提供 3 个 RESTful API 接口，所有接口需要在请求头中携带 `X-API-Key` 进行鉴权。

#### API 鉴权

```bash
X-API-Key: 你设置的API_SECRET_KEY
```

#### 接口 1：获取邮箱

获取可用的邮箱账号。

**请求**

```http
POST /api/v1/emails/fetch
Content-Type: application/json
X-API-Key: your-api-key

{
  "platform": "google",    // 可选，指定平台
  "isUsed": false,         // 可选，是否包含已使用的，默认 false
  "count": 5               // 可选，获取数量，默认 1，最大 100
}
```

**响应成功**

```json
{
  "status": "success",
  "data": [
    {
      "email": "test@example.com",
      "password": "password123",
      "remark": "备注信息",
      "supportedPlatforms": ["google", "facebook"],
      "usedPlatforms": []
    }
  ]
}
```

**响应失败（无可用邮箱）**

```json
{
  "status": "error",
  "message": "没有可用的邮箱",
  "data": []
}
```

**使用示例**

```bash
# 获取 1 个 Google 平台的未使用邮箱
curl -X POST https://mail-manager.pages.dev/api/v1/emails/fetch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"platform": "google"}'

# 获取 5 个任意平台的邮箱
curl -X POST https://mail-manager.pages.dev/api/v1/emails/fetch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"count": 5}'
```

#### 接口 2：设置邮箱状态

更新邮箱的使用状态和已使用平台。

**请求**

```http
POST /api/v1/emails/status
Content-Type: application/json
X-API-Key: your-api-key

{
  "email": "test@example.com",     // 必填，邮箱地址
  "isUsed": true,                  // 可选，是否标记为已使用
  "usedPlatforms": ["google"]      // 可选，已使用的平台，可以是字符串或数组
}
```

**响应成功**

```json
{
  "status": "success",
  "message": "状态更新成功"
}
```

**响应失败**

```json
{
  "status": "error",
  "message": "邮箱不存在"
}
```

**使用示例**

```bash
# 标记邮箱在 Google 平台已使用
curl -X POST https://mail-manager.pages.dev/api/v1/emails/status \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "email": "test@example.com",
    "isUsed": true,
    "usedPlatforms": ["google"]
  }'

# 标记邮箱在多个平台已使用
curl -X POST https://mail-manager.pages.dev/api/v1/emails/status \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "email": "test@example.com",
    "usedPlatforms": ["google", "facebook", "twitter"]
  }'
```

#### 接口 3：删除邮箱

删除指定的邮箱账号。

**请求**

```http
POST /api/v1/emails/delete
Content-Type: application/json
X-API-Key: your-api-key

{
  "email": "test@example.com"    // 必填，要删除的邮箱
}
```

**响应成功**

```json
{
  "status": "success",
  "message": "删除成功"
}
```

**响应失败**

```json
{
  "status": "error",
  "message": "邮箱不存在"
}
```

**使用示例**

```bash
curl -X POST https://mail-manager.pages.dev/api/v1/emails/delete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"email": "test@example.com"}'
```

#### 错误响应

| HTTP 状态码 | 错误码 | 说明 |
|------------|--------|------|
| 401 | `UNAUTHORIZED` | 缺少或错误的 API Key |
| 400 | `MISSING_EMAIL` | 缺少邮箱参数 |
| 200 | `error` | 业务逻辑错误（如邮箱不存在） |

## 项目结构

```
mail-manager/
├── src/                          # 前端源码
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 基础组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── use-toast.ts
│   │   ├── Layout.tsx           # 页面布局组件
│   │   ├── ImportEmailDialog.tsx # 批量导入弹窗
│   │   └── BatchOperationDialog.tsx # 批量操作弹窗
│   │
│   ├── pages/                   # 页面组件
│   │   ├── Login.tsx            # 登录页
│   │   ├── Dashboard.tsx        # 仪表板
│   │   ├── Emails.tsx           # 邮箱管理
│   │   └── Platforms.tsx        # 平台管理
│   │
│   ├── lib/
│   │   └── utils.ts             # 工具函数
│   │
│   ├── App.tsx                  # 应用入口
│   ├── main.tsx                 # React 入口
│   └── index.css                # 全局样式
│
├── functions/                   # Cloudflare Pages Functions
│   └── api/
│       ├── [[path]].ts         # Hono 应用入口
│       └── routes/
│           ├── admin.ts        # 管理后台 API
│           └── external.ts     # 外部调用 API
│
├── migrations/                  # 数据库迁移文件
│   └── 0001_init.sql           # 初始化表结构
│
├── public/                      # 静态资源
├── dist/                        # 构建输出目录
│
├── wrangler.toml               # Cloudflare 配置
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
├── components.json             # shadcn/ui 配置
└── package.json                # 项目依赖
```

## 数据库结构

### platforms 表（平台）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| key | TEXT | 平台唯一标识，如 `google` |
| name | TEXT | 平台显示名称，如 `Google` |
| created_at | DATETIME | 创建时间 |

### emails 表（邮箱）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| email | TEXT | 邮箱地址，唯一 |
| password | TEXT | 密码 |
| remark | TEXT | 备注信息 |
| is_used | INTEGER | 是否已使用，0/1 |
| supported_platforms | TEXT | 支持的平台，JSON 数组，空数组表示支持所有 |
| used_platforms | TEXT | 已使用的平台，JSON 数组 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### api_logs 表（API 日志）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| endpoint | TEXT | API 端点路径 |
| method | TEXT | HTTP 方法 |
| params | TEXT | 请求参数，JSON |
| status_code | INTEGER | 响应状态码 |
| response | TEXT | 响应内容，JSON |
| ip | TEXT | 请求 IP |
| created_at | DATETIME | 创建时间 |

## 常见问题

### Q: 如何修改管理员密码？

重新设置 Secret 并重新部署：

```bash
echo "新密码" | npx wrangler pages secret put ADMIN_SECRET_KEY --project-name=mail-manager
npx wrangler pages deploy ./dist --project-name=mail-manager
```

### Q: 如何备份数据？

使用 Wrangler 导出数据库：

```bash
npx wrangler d1 export mail-manager-db --remote --output=backup.sql
```

### Q: 如何恢复数据？

```bash
npx wrangler d1 execute mail-manager-db --remote --file=backup.sql
```

### Q: 本地开发时 API 返回 401？

确保创建了 `.dev.vars` 文件并设置了正确的密钥：

```
ADMIN_SECRET_KEY=your-local-admin-key
API_SECRET_KEY=your-local-api-key
```

### Q: 部署后访问显示空白页？

1. 检查浏览器控制台是否有错误
2. 确认 D1 数据库绑定正确
3. 确认 Secrets 已设置

### Q: 如何绑定自定义域名？

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入你的 Pages 项目
3. 点击「Custom domains」
4. 添加你的域名并按提示配置 DNS

### Q: D1 数据库有什么限制？

Cloudflare D1 免费版限制：
- 存储空间：5GB
- 每日读取：500 万次
- 每日写入：10 万次

对于大多数使用场景完全够用。

### Q: 如何清理旧的 API 日志？

可以通过 Wrangler 执行 SQL：

```bash
# 删除 30 天前的日志
npx wrangler d1 execute mail-manager-db --remote --command="DELETE FROM api_logs WHERE created_at < datetime('now', '-30 days')"
```

## 开发指南

### 添加新的 UI 组件

本项目使用 shadcn/ui，添加新组件：

```bash
npx shadcn-ui@latest add [component-name]
```

### 添加新的 API 路由

编辑 `functions/api/routes/admin.ts` 或 `functions/api/routes/external.ts`：

```typescript
// 在 admin.ts 中添加新路由
adminRoutes.get('/new-route', async (c) => {
  // 你的逻辑
  return c.json({ data: 'hello' })
})
```

### 修改数据库结构

1. 创建新的迁移文件 `migrations/0002_xxx.sql`
2. 执行迁移：
```bash
npx wrangler d1 execute mail-manager-db --remote --file=./migrations/0002_xxx.sql
```

## 安全建议

1. **使用强密码** - 管理员密钥和 API 密钥应使用复杂的随机字符串
2. **定期更换密钥** - 建议每 3-6 个月更换一次
3. **不要提交密钥** - `.dev.vars` 已在 `.gitignore` 中，请勿手动提交
4. **限制 API 访问** - 如需要，可在 Cloudflare 设置访问规则
5. **监控异常调用** - 定期检查 API 日志，发现异常及时处理

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 更新日志

### v1.0.0 (2024-11)

- 初始版本发布
- 支持平台管理
- 支持邮箱批量导入
- 支持批量操作
- 提供外部 API
- 仪表板数据统计

## 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 致谢

- [Cloudflare Workers](https://workers.cloudflare.com/) - 边缘计算平台
- [Cloudflare D1](https://developers.cloudflare.com/d1/) - 边缘数据库
- [Hono](https://hono.dev/) - 轻量级 Web 框架
- [React](https://react.dev/) - 前端框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Matsu Theme](https://matsu-theme.vercel.app/) - 吉卜力工作室风格主题，由 [Matt Wierzbicki](https://github.com/mattwierzbicki) 制作
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Recharts](https://recharts.org/) - 图表库

---

如果这个项目对你有帮助，请给一个 Star 支持一下！
