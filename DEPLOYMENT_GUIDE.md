# LoveShow 项目部署指南

## 部署架构
- **服务器**: OVH (IP: 15.204.119.74)
- **域名**: loveshow.life
- **技术栈**: Next.js + Node.js + Nginx + PM2
- **端口**: 3001 (应用端口，3000已被占用)
- **反向代理**: Nginx

---

## 第一步：服务器环境准备

### 1.1 连接到服务器
```bash
ssh root@15.204.119.74
# 或使用用户名
ssh username@15.204.119.74
```

### 1.2 更新系统
```bash
apt update && apt upgrade -y
```

### 1.3 安装必要的工具
```bash
apt install -y curl wget git build-essential
```

### 1.4 检查 Node.js 和 npm 版本
```bash
node --version
npm --version
```

如果未安装或版本过低，安装最新 LTS 版本：
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
```

### 1.5 检查 PM2 是否已安装
```bash
pm2 --version
```

如果未安装，全局安装 PM2：
```bash
npm install -g pm2
# 设置 PM2 开机自启
pm2 startup
pm2 save
```

---

## 第二步：克隆项目代码

### 2.1 创建项目目录
```bash
mkdir -p /var/www
cd /var/www
```

### 2.2 克隆项目仓库
```bash
git clone https://github.com/sundny8/loveshow.git loveshow
cd loveshow
```

### 2.3 检查分支
```bash
git branch -a
git checkout main  # 如果需要切换到 main 分支
```

---

## 第三步：配置环境变量

### 3.1 创建 .env.local 文件
```bash
cp .env.example .env.local
```

### 3.2 编辑环境变量
```bash
nano .env.local
```

### 3.3 修改以下关键配置
```env
# App
NEXT_PUBLIC_APP_URL=https://loveshow.life
NEXT_PUBLIC_APP_NAME=LoveShow

# Database (使用 SQLite 或 PostgreSQL)
DATABASE_URL=file:sqlite.db
# 或者使用 PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost:5432/loveshow

# Authentication
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-change-this
BETTER_AUTH_URL=https://loveshow.life

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@loveshow.life

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# AI Providers
OPENAI_API_KEY=sk_xxxxx
OPENAI_IMAGE_MODEL=gpt-image-1

GEMINI_API_KEY=xxxxx
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image

# Photo storage
PHOTO_STORAGE_DIR=./public/uploads
PHOTO_BATCH_CONCURRENCY=3
```

**重要**: 保存文件 (Ctrl+O, Enter, Ctrl+X)

---

## 第四步：安装依赖和构建

### 4.1 安装项目依赖
```bash
cd /var/www/loveshow
npm install
```

### 4.2 构建项目
```bash
npm run build
```

**等待构建完成** (可能需要 5-10 分钟)

### 4.3 验证构建成功
```bash
ls -la .next
```

应该看到 `.next` 目录已创建

---

## 第五步：配置 PM2

### 5.1 创建 PM2 配置文件
```bash
cat > /var/www/loveshow/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'loveshow',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/loveshow',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/loveshow-error.log',
      out_file: '/var/log/pm2/loveshow-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      ignore_watch: ['node_modules', '.next', 'public/uploads']
    }
  ]
};
EOF
```

### 5.2 创建日志目录
```bash
mkdir -p /var/log/pm2
```

### 5.3 启动应用
```bash
cd /var/www/loveshow
pm2 start ecosystem.config.js
```

### 5.4 验证应用运行状态
```bash
pm2 status
pm2 logs loveshow
```

应该看到应用已启动，监听 3001 端口

### 5.5 设置 PM2 开机自启
```bash
pm2 startup
pm2 save
```

---

## 第六步：配置 Nginx 反向代理

### 6.1 创建 Nginx 配置文件
```bash
cat > /etc/nginx/sites-available/loveshow << 'EOF'
upstream loveshow_backend {
    server 127.0.0.1:3001;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name loveshow.life www.loveshow.life;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name loveshow.life www.loveshow.life;

    # SSL 证书配置 (使用 Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/loveshow.life/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/loveshow.life/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 日志
    access_log /var/log/nginx/loveshow-access.log;
    error_log /var/log/nginx/loveshow-error.log;

    # 客户端上传大小限制
    client_max_body_size 100M;

    # 根路径
    root /var/www/loveshow/public;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 代理到 Next.js 应用
    location / {
        proxy_pass http://loveshow_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }

    # 上传文件目录
    location /uploads/ {
        alias /var/www/loveshow/public/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
EOF
```

### 6.2 启用 Nginx 配置
```bash
ln -s /etc/nginx/sites-available/loveshow /etc/nginx/sites-enabled/loveshow
```

### 6.3 测试 Nginx 配置
```bash
nginx -t
```

应该看到 `successful` 提示

### 6.4 重启 Nginx
```bash
systemctl restart nginx
```

---

## 第七步：配置 SSL 证书 (Let's Encrypt)

### 7.1 安装 Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 7.2 申请 SSL 证书
```bash
certbot certonly --nginx -d loveshow.life -d www.loveshow.life
```

按照提示输入邮箱和同意条款

### 7.3 验证证书
```bash
ls -la /etc/letsencrypt/live/loveshow.life/
```

应该看到 `fullchain.pem` 和 `privkey.pem`

### 7.4 配置自动续期
```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## 第八步：配置域名 DNS

在你的域名注册商（如 Namecheap、GoDaddy 等）中配置 DNS 记录：

### 8.1 A 记录
```
主机名: @
类型: A
值: 15.204.119.74
TTL: 3600
```

### 8.2 www 子域名 (可选)
```
主机名: www
类型: A
值: 15.204.119.74
TTL: 3600
```

**等待 DNS 生效** (通常 5-30 分钟)

---

## 第九步：验证部署

### 9.1 检查应用状态
```bash
pm2 status
pm2 logs loveshow
```

### 9.2 检查 Nginx 状态
```bash
systemctl status nginx
```

### 9.3 测试 HTTP 连接
```bash
curl -I http://loveshow.life
```

### 9.4 测试 HTTPS 连接
```bash
curl -I https://loveshow.life
```

### 9.5 在浏览器中访问
打开浏览器访问: `https://loveshow.life`

---

## 第十步：常用维护命令

### 10.1 查看应用日志
```bash
pm2 logs loveshow
pm2 logs loveshow --lines 100  # 查看最后 100 行
```

### 10.2 重启应用
```bash
pm2 restart loveshow
```

### 10.3 停止应用
```bash
pm2 stop loveshow
```

### 10.4 启动应用
```bash
pm2 start loveshow
```

### 10.5 更新代码
```bash
cd /var/www/loveshow
git pull origin main
npm install
npm run build
pm2 restart loveshow
```

### 10.6 查看 Nginx 日志
```bash
tail -f /var/log/nginx/loveshow-access.log
tail -f /var/log/nginx/loveshow-error.log
```

### 10.7 检查端口占用
```bash
netstat -tlnp | grep 3001
```

---

## 故障排查

### 问题 1: 应用无法启动
```bash
# 查看详细错误日志
pm2 logs loveshow --err

# 检查环境变量
cat /var/www/loveshow/.env.local

# 检查依赖是否完整
cd /var/www/loveshow
npm install
```

### 问题 2: 无法访问网站
```bash
# 检查 DNS 解析
nslookup loveshow.life

# 检查 Nginx 配置
nginx -t

# 检查防火墙
ufw status
ufw allow 80/tcp
ufw allow 443/tcp
```

### 问题 3: SSL 证书错误
```bash
# 检查证书有效期
certbot certificates

# 手动续期
certbot renew --force-renewal
```

### 问题 4: 数据库连接错误
```bash
# 检查数据库文件权限
ls -la /var/www/loveshow/sqlite.db

# 检查数据库配置
cat /var/www/loveshow/.env.local | grep DATABASE_URL
```

---

## 性能优化建议

### 1. 启用 Gzip 压缩
在 Nginx 配置中添加：
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json application/javascript;
gzip_min_length 1000;
```

### 2. 增加 PM2 实例数
```bash
pm2 delete loveshow
pm2 start ecosystem.config.js -i 4  # 4 个实例
pm2 save
```

### 3. 配置 CDN (可选)
使用 Cloudflare 或其他 CDN 服务加速静态资源

### 4. 监控应用
```bash
pm2 monit
```

---

## 备份和恢复

### 备份数据库
```bash
cp /var/www/loveshow/sqlite.db /var/www/loveshow/sqlite.db.backup
```

### 备份整个项目
```bash
tar -czf /backup/loveshow-$(date +%Y%m%d).tar.gz /var/www/loveshow
```

---

## 完成检查清单

- [ ] 服务器环境已准备 (Node.js, npm, PM2)
- [ ] 项目代码已克隆
- [ ] 环境变量已配置 (.env.local)
- [ ] 依赖已安装 (npm install)
- [ ] 项目已构建 (npm run build)
- [ ] PM2 已启动应用
- [ ] Nginx 已配置反向代理
- [ ] SSL 证书已申请
- [ ] DNS 记录已配置
- [ ] 网站可通过 https://loveshow.life 访问
- [ ] 应用日志正常

---

## 支持和帮助

如遇到问题，请检查：
1. PM2 日志: `pm2 logs loveshow`
2. Nginx 日志: `/var/log/nginx/loveshow-error.log`
3. 系统日志: `journalctl -xe`

