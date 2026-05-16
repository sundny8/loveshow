# LoveShow 部署检查清单

## 部署前准备

### 域名和 DNS
- [ ] 域名 `loveshow.life` 已注册
- [ ] DNS A 记录已配置指向 `15.204.119.74`
- [ ] DNS 记录已生效 (可用 `nslookup loveshow.life` 验证)
- [ ] www 子域名已配置 (可选)

### 服务器访问
- [ ] 获得 OVH 服务器 SSH 访问权限
- [ ] 服务器 IP: `15.204.119.74` 可访问
- [ ] 已获得 root 或 sudo 权限

### API 密钥准备
- [ ] OpenAI API 密钥已获取
- [ ] Google Gemini API 密钥已获取
- [ ] Resend 邮件服务密钥已获取
- [ ] Stripe 支付密钥已获取 (如需要)
- [ ] OAuth 密钥已获取 (如需要)

---

## 部署步骤检查

### 步骤 1: 服务器环境准备
```bash
ssh root@15.204.119.74
```

- [ ] 连接到服务器成功
- [ ] 执行: `apt update && apt upgrade -y`
- [ ] 执行: `apt install -y curl wget git build-essential`
- [ ] 验证 Node.js: `node --version` (应为 v18+)
- [ ] 验证 npm: `npm --version` (应为 v9+)
- [ ] 验证 PM2: `pm2 --version` (如未安装则执行 `npm install -g pm2`)

### 步骤 2: 克隆项目代码
```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/sundny8/loveshow.git loveshow
cd loveshow
```

- [ ] 项目已克隆到 `/var/www/loveshow`
- [ ] 检查分支: `git branch -a`
- [ ] 切换到 main: `git checkout main` (如需要)

### 步骤 3: 配置环境变量
```bash
cp .env.example .env.local
nano .env.local
```

- [ ] `.env.local` 文件已创建
- [ ] `NEXT_PUBLIC_APP_URL=https://loveshow.life` 已设置
- [ ] `BETTER_AUTH_SECRET` 已设置 (至少 32 字符)
- [ ] `OPENAI_API_KEY` 已设置
- [ ] `GEMINI_API_KEY` 已设置
- [ ] `RESEND_API_KEY` 已设置
- [ ] `EMAIL_FROM` 已设置
- [ ] `STRIPE_SECRET_KEY` 已设置 (如需要)
- [ ] `STRIPE_WEBHOOK_SECRET` 已设置 (如需要)
- [ ] 所有必需的 API 密钥都已填入

### 步骤 4: 安装依赖和构建
```bash
cd /var/www/loveshow
npm install
npm run build
```

- [ ] `npm install` 完成，无错误
- [ ] `npm run build` 完成，无错误
- [ ] `.next` 目录已创建: `ls -la .next`
- [ ] 构建大小合理 (通常 50-200MB)

### 步骤 5: 配置 PM2
```bash
mkdir -p /var/log/pm2
cat > /var/www/loveshow/ecosystem.config.js << 'EOF'
[复制 DEPLOYMENT_GUIDE.md 中的 ecosystem.config.js 内容]
EOF

pm2 start /var/www/loveshow/ecosystem.config.js
pm2 save
```

- [ ] `ecosystem.config.js` 已创建
- [ ] PM2 应用已启动: `pm2 status`
- [ ] 应用状态为 "online": `pm2 status | grep online`
- [ ] 日志无错误: `pm2 logs loveshow`
- [ ] PM2 开机自启已配置: `pm2 startup` 和 `pm2 save`

### 步骤 6: 配置 Nginx
```bash
cat > /etc/nginx/sites-available/loveshow << 'EOF'
[复制 DEPLOYMENT_GUIDE.md 中的 Nginx 配置]
EOF

ln -s /etc/nginx/sites-available/loveshow /etc/nginx/sites-enabled/loveshow
nginx -t
systemctl restart nginx
```

- [ ] Nginx 配置文件已创建
- [ ] 符号链接已创建
- [ ] Nginx 配置测试通过: `nginx -t`
- [ ] Nginx 已重启: `systemctl restart nginx`
- [ ] Nginx 状态正常: `systemctl status nginx`

### 步骤 7: 配置 SSL 证书
```bash
apt install -y certbot python3-certbot-nginx
certbot certonly --nginx -d loveshow.life -d www.loveshow.life
```

- [ ] Certbot 已安装
- [ ] SSL 证书已申请
- [ ] 证书文件存在: `ls -la /etc/letsencrypt/live/loveshow.life/`
- [ ] `fullchain.pem` 存在
- [ ] `privkey.pem` 存在
- [ ] Nginx 已重启以加载证书

### 步骤 8: 配置防火墙
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

- [ ] 防火墙规则已配置
- [ ] SSH (22) 已允许
- [ ] HTTP (80) 已允许
- [ ] HTTPS (443) 已允许

### 步骤 9: 配置 DNS
在域名注册商中配置:

- [ ] A 记录: `@` -> `15.204.119.74`
- [ ] A 记录: `www` -> `15.204.119.74` (可选)
- [ ] DNS 已生效 (等待 5-30 分钟)
- [ ] 验证 DNS: `nslookup loveshow.life`

---

## 部署后验证

### 应用状态检查
```bash
pm2 status
pm2 logs loveshow
```

- [ ] PM2 应用状态为 "online"
- [ ] 应用日志无错误
- [ ] 应用监听端口 3001: `netstat -tlnp | grep 3001`

### Nginx 状态检查
```bash
systemctl status nginx
tail -f /var/log/nginx/loveshow-error.log
```

- [ ] Nginx 状态为 "active (running)"
- [ ] Nginx 错误日志无错误
- [ ] Nginx 访问日志有请求记录

### 网络连接检查
```bash
curl -I http://loveshow.life
curl -I https://loveshow.life
```

- [ ] HTTP 请求返回 301 (重定向到 HTTPS)
- [ ] HTTPS 请求返回 200 (成功)
- [ ] SSL 证书有效

### 浏览器访问检查
在浏览器中访问: `https://loveshow.life`

- [ ] 页面加载成功
- [ ] 没有 SSL 证书警告
- [ ] 页面内容正确显示
- [ ] 国际化功能正常 (可切换语言)
- [ ] 静态资源加载正常 (CSS, JS, 图片)

### 功能测试
- [ ] 首页加载正常
- [ ] 登录页面可访问
- [ ] 注册功能可用
- [ ] 仪表板可访问 (登录后)
- [ ] 创意工作室功能可用
- [ ] 支付功能可用 (如配置)

---

## 常见问题排查

### 问题 1: 无法访问网站
```bash
# 检查 DNS
nslookup loveshow.life

# 检查应用
pm2 status
pm2 logs loveshow

# 检查 Nginx
systemctl status nginx
tail -f /var/log/nginx/loveshow-error.log

# 检查防火墙
ufw status
```

- [ ] DNS 解析正确
- [ ] 应用在线
- [ ] Nginx 运行中
- [ ] 防火墙允许 443 端口

### 问题 2: SSL 证书错误
```bash
# 检查证书
certbot certificates

# 续期证书
certbot renew --force-renewal

# 重启 Nginx
systemctl restart nginx
```

- [ ] 证书未过期
- [ ] 证书域名正确
- [ ] Nginx 已重启

### 问题 3: 应用崩溃
```bash
# 查看详细日志
pm2 logs loveshow --err

# 检查环境变量
cat /var/www/loveshow/.env.local

# 重启应用
pm2 restart loveshow
```

- [ ] 环境变量完整
- [ ] API 密钥有效
- [ ] 磁盘空间充足
- [ ] 内存充足

### 问题 4: 性能问题
```bash
# 监控应用
pm2 monit

# 检查系统资源
free -h
df -h

# 查看 Nginx 连接
netstat -an | grep ESTABLISHED | wc -l
```

- [ ] CPU 使用率正常
- [ ] 内存使用率正常
- [ ] 磁盘空间充足
- [ ] 连接数正常

---

## 部署后维护

### 日常检查
- [ ] 每天检查应用日志: `pm2 logs loveshow`
- [ ] 每周检查系统资源: `free -h`, `df -h`
- [ ] 每月检查 SSL 证书有效期: `certbot certificates`

### 定期更新
- [ ] 每月更新系统: `apt update && apt upgrade -y`
- [ ] 每月更新依赖: `npm update`
- [ ] 每季度更新 Node.js (如需要)

### 备份
- [ ] 每周备份数据库: `cp /var/www/loveshow/sqlite.db /backup/`
- [ ] 每月备份整个项目: `tar -czf /backup/loveshow-$(date +%Y%m%d).tar.gz /var/www/loveshow`
- [ ] 备份存储在安全位置

### 监控
- [ ] 配置应用监控 (如 PM2 Plus)
- [ ] 配置日志收集 (如 ELK Stack)
- [ ] 配置告警 (如 Sentry)

---

## 部署完成

当所有检查项都完成后，部署即完成！

**最终验证:**
- [ ] 网站可通过 `https://loveshow.life` 访问
- [ ] 所有功能正常工作
- [ ] 没有错误日志
- [ ] SSL 证书有效
- [ ] 性能满足要求

**下一步:**
1. 通知用户网站已上线
2. 配置监控和告警
3. 制定备份和维护计划
4. 收集用户反馈并持续改进

---

## 支持联系

如遇到问题，请:
1. 查看 `DEPLOYMENT_GUIDE.md` 中的故障排查部分
2. 检查应用日志: `pm2 logs loveshow`
3. 检查 Nginx 日志: `/var/log/nginx/loveshow-error.log`
4. 查看系统日志: `journalctl -xe`

