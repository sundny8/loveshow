# 环境变量配置指南

## 概述
本文档说明如何在 OVH 服务器上配置 LoveShow 项目的环境变量。

---

## 必需的环境变量

### 1. 应用配置

```env
# 应用 URL (必需)
NEXT_PUBLIC_APP_URL=https://loveshow.life

# 应用名称
NEXT_PUBLIC_APP_NAME=LoveShow
```

### 2. 数据库配置

#### 选项 A: SQLite (推荐用于小规模部署)
```env
DATABASE_URL=file:sqlite.db
```

#### 选项 B: PostgreSQL (推荐用于生产环境)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/loveshow
```

**PostgreSQL 安装 (如需要):**
```bash
apt install -y postgresql postgresql-contrib
sudo -u postgres createdb loveshow
sudo -u postgres createuser loveshow_user
sudo -u postgres psql -c "ALTER USER loveshow_user WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE loveshow TO loveshow_user;"
```

### 3. 认证配置 (Better Auth)

```env
# 生成安全的密钥 (至少 32 个字符)
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters

# 认证 URL
BETTER_AUTH_URL=https://loveshow.life
```

**生成安全密钥:**
```bash
openssl rand -base64 32
```

### 4. 邮件配置 (Resend)

```env
# Resend API 密钥 (从 https://resend.com 获取)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# 发件人邮箱
EMAIL_FROM=noreply@loveshow.life
```

### 5. Stripe 支付配置

```env
# Stripe 密钥 (从 https://dashboard.stripe.com 获取)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
```

### 6. AI 提供商配置

#### OpenAI (主要)
```env
# OpenAI API 密钥 (从 https://platform.openai.com 获取)
OPENAI_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx

# 图像生成模型
OPENAI_IMAGE_MODEL=gpt-image-1
```

#### Google Gemini (备用)
```env
# Gemini API 密钥 (从 https://makersuite.google.com 获取)
GEMINI_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# 图像生成模型
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
```

### 7. 文件存储配置

```env
# 照片存储目录
PHOTO_STORAGE_DIR=./public/uploads

# 并发处理数
PHOTO_BATCH_CONCURRENCY=3
```

### 8. OAuth 配置 (可选)

#### Google OAuth
```env
GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

#### GitHub OAuth
```env
GITHUB_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

---

## 完整的 .env.local 示例

```env
# ============================================
# 应用配置
# ============================================
NEXT_PUBLIC_APP_URL=https://loveshow.life
NEXT_PUBLIC_APP_NAME=LoveShow

# ============================================
# 数据库配置
# ============================================
DATABASE_URL=file:sqlite.db

# ============================================
# 认证配置
# ============================================
BETTER_AUTH_SECRET=your-generated-secret-key-here
BETTER_AUTH_URL=https://loveshow.life

# ============================================
# 邮件配置
# ============================================
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@loveshow.life

# ============================================
# 支付配置
# ============================================
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here

# ============================================
# AI 提供商配置
# ============================================
OPENAI_API_KEY=sk_your_key_here
OPENAI_IMAGE_MODEL=gpt-image-1

GEMINI_API_KEY=your_gemini_key_here
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image

# ============================================
# 文件存储配置
# ============================================
PHOTO_STORAGE_DIR=./public/uploads
PHOTO_BATCH_CONCURRENCY=3

# ============================================
# OAuth 配置 (可选)
# ============================================
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# GITHUB_CLIENT_ID=your_github_client_id
# GITHUB_CLIENT_SECRET=your_github_client_secret
```

---

## 获取 API 密钥指南

### 1. OpenAI API 密钥

1. 访问 https://platform.openai.com/account/api-keys
2. 登录或创建账户
3. 点击 "Create new secret key"
4. 复制密钥到 `OPENAI_API_KEY`

### 2. Google Gemini API 密钥

1. 访问 https://makersuite.google.com/app/apikey
2. 点击 "Create API Key"
3. 复制密钥到 `GEMINI_API_KEY`

### 3. Resend 邮件服务

1. 访问 https://resend.com
2. 注册账户
3. 在 Dashboard 中获取 API 密钥
4. 验证发件人邮箱

### 4. Stripe 支付

1. 访问 https://dashboard.stripe.com
2. 登录或创建账户
3. 在 "Developers" > "API keys" 中获取密钥
4. 配置 Webhook 端点: `https://loveshow.life/api/webhooks/stripe`

### 5. OAuth (可选)

#### Google OAuth
1. 访问 https://console.cloud.google.com
2. 创建新项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 凭证 (Web 应用)
5. 添加授权重定向 URI: `https://loveshow.life/api/auth/callback/google`

#### GitHub OAuth
1. 访问 https://github.com/settings/developers
2. 创建新 OAuth App
3. 设置 Authorization callback URL: `https://loveshow.life/api/auth/callback/github`

---

## 部署步骤

### 1. SSH 连接到服务器
```bash
ssh root@15.204.119.74
```

### 2. 创建 .env.local 文件
```bash
cd /var/www/loveshow
nano .env.local
```

### 3. 复制上面的完整示例并修改
- 替换所有 `your_xxx_here` 为实际的 API 密钥
- 确保 `NEXT_PUBLIC_APP_URL` 是 `https://loveshow.life`

### 4. 保存文件
- 按 `Ctrl+O` 保存
- 按 `Enter` 确认
- 按 `Ctrl+X` 退出

### 5. 重启应用
```bash
pm2 restart loveshow
```

### 6. 验证配置
```bash
pm2 logs loveshow
```

---

## 安全建议

1. **不要在代码中提交 .env.local**
   - 确保 `.env.local` 在 `.gitignore` 中

2. **定期轮换 API 密钥**
   - 每 3-6 个月更新一次密钥

3. **使用强密码**
   - `BETTER_AUTH_SECRET` 至少 32 个字符
   - 使用 `openssl rand -base64 32` 生成

4. **限制 API 密钥权限**
   - 在各服务中设置最小必要权限
   - 使用 IP 白名单 (如可用)

5. **监控 API 使用**
   - 定期检查 OpenAI、Gemini 等的使用情况
   - 设置成本告警

6. **备份敏感信息**
   - 将 API 密钥安全地备份到密码管理器
   - 不要在公共地方存储

---

## 故障排查

### 问题: 应用启动失败，提示缺少环境变量

**解决方案:**
```bash
# 检查 .env.local 是否存在
ls -la /var/www/loveshow/.env.local

# 查看应用日志
pm2 logs loveshow

# 确保所有必需变量都已设置
grep "NEXT_PUBLIC_APP_URL\|BETTER_AUTH_SECRET\|OPENAI_API_KEY" /var/www/loveshow/.env.local
```

### 问题: API 调用失败

**解决方案:**
```bash
# 验证 API 密钥是否正确
# 1. 检查 .env.local 中的密钥
# 2. 确保密钥未过期
# 3. 检查 API 配额是否已用尽
# 4. 查看应用日志获取详细错误信息

pm2 logs loveshow --err
```

### 问题: 邮件无法发送

**解决方案:**
```bash
# 检查 Resend 配置
grep "RESEND_API_KEY\|EMAIL_FROM" /var/www/loveshow/.env.local

# 确保发件人邮箱已在 Resend 中验证
# 访问 https://resend.com/emails
```

---

## 更新环境变量

当需要更新环境变量时:

```bash
# 1. 编辑 .env.local
nano /var/www/loveshow/.env.local

# 2. 保存文件

# 3. 重启应用
pm2 restart loveshow

# 4. 验证
pm2 logs loveshow
```

---

## 参考资源

- [Next.js 环境变量文档](https://nextjs.org/docs/basic-features/environment-variables)
- [Better Auth 文档](https://www.better-auth.com)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [Google Gemini API 文档](https://ai.google.dev)
- [Stripe 文档](https://stripe.com/docs)
- [Resend 文档](https://resend.com/docs)

