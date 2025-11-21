# API 测试脚本

本目录包含邮箱管理系统的 API 测试脚本，提供 3 种语言版本。

## 脚本列表

### 1. test-api.sh (Bash 版本)
适用于 Linux/macOS 系统

**使用方法：**
```bash
# 添加执行权限
chmod +x test-api.sh

# 编辑脚本，替换 API_KEY
nano test-api.sh  # 或使用其他编辑器

# 运行测试
./test-api.sh
```

### 2. test-api.js (Node.js 版本)
适用于安装了 Node.js 的系统

**使用方法：**
```bash
# 编辑脚本，替换 API_KEY
# 修改 API_KEY = 'your-api-key-here'

# 运行测试
node test-api.js
```

### 3. test-api.py (Python 版本)
适用于安装了 Python 3 的系统

**使用方法：**
```bash
# 安装依赖
pip install requests

# 编辑脚本，替换 API_KEY
# 修改 API_KEY = 'your-api-key-here'

# 运行测试
python test-api.py
```

## 配置

在运行测试前，需要修改脚本中的以下配置：

```javascript
// 或 Python/Bash 中的对应变量
const BASE_URL = 'https://mail-manager.pages.dev'  // 你的部署地址
const API_KEY = 'your-api-key-here'  // 替换为你的 API_SECRET_KEY
```

### 测试本地环境

如果要测试本地开发环境，修改 `BASE_URL` 为：
```javascript
const BASE_URL = 'http://localhost:8788'
```

## 测试覆盖

所有脚本都包含以下测试用例：

1. **测试 1: 获取 1 个邮箱**
   - 接口: `POST /api/v1/emails/fetch`
   - 参数: `{"count": 1}`

2. **测试 2: 获取指定平台的邮箱**
   - 接口: `POST /api/v1/emails/fetch`
   - 参数: `{"platform": "google", "count": 2}`

3. **测试 3: 设置邮箱状态**
   - 接口: `POST /api/v1/emails/status`
   - 参数: `{"email": "xxx", "isUsed": true, "usedPlatforms": ["google"]}`

4. **测试 4: 批量获取 5 个邮箱**
   - 接口: `POST /api/v1/emails/fetch`
   - 参数: `{"count": 5, "isUsed": false}`

5. **测试 5: 错误的 API Key**
   - 验证 401 认证错误

6. **测试 6: 缺少必填参数**
   - 验证参数校验

7. **测试 8: 获取包含已使用的邮箱**
   - 接口: `POST /api/v1/emails/fetch`
   - 参数: `{"count": 3, "isUsed": true}`

8. **测试 9: 获取不存在的平台**
   - 接口: `POST /api/v1/emails/fetch`
   - 参数: `{"platform": "nonexistent", "count": 1}`

## 输出示例

测试脚本使用彩色输出显示结果：

```
==================================
邮箱管理系统 API 测试脚本
==================================

测试 1: 获取 1 个邮箱
HTTP 状态码: 200
响应: {
  "status": "success",
  "data": [
    {
      "email": "test@example.com",
      "password": "password123",
      ...
    }
  ]
}
✓ 测试通过

测试 2: 获取 Google 平台的邮箱
...
```

## 注意事项

1. **API 密钥安全**
   - 不要将包含真实 API 密钥的测试脚本提交到版本控制
   - 测试脚本中的 API_KEY 仅为占位符

2. **删除操作**
   - 测试 7（删除邮箱）默认被注释，谨慎使用
   - 如需测试删除功能，取消注释相关代码

3. **数据准备**
   - 运行测试前确保数据库中有足够的测试数据
   - 建议先通过管理后台批量导入一些测试邮箱

4. **频率限制**
   - 如果有 API 调用频率限制，请适当调整测试间隔

## 故障排查

### 401 Unauthorized
- 检查 API_KEY 是否正确
- 确认 Cloudflare Pages Secrets 中已设置 `API_SECRET_KEY`

### 连接超时
- 检查 BASE_URL 是否正确
- 确认网络连接正常
- 本地测试时确保开发服务器已启动

### 没有可用邮箱
- 通过管理后台导入测试数据
- 检查筛选条件是否过于严格
