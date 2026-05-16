# LoveShow 部署快速参考

## 服务器信息
- **IP**: 15.204.119.74
- **域名**: loveshow.life
- **应用端口**: 3001
- **项目路径**: /var/www/loveshow
- **仓库**: https://github.com/sundny8/loveshow.git

---

## 一键部署 (推荐)

```bash
# 1. SSH 连接到服务器
ssh root@15.204.119.74

# 2. 下载并执行部署脚本
cd /tmp
wget https://raw.githubusercontent.com/sundny8/loveshow/main/deploy.sh
bash deploy.sh

# 3. 按照提示配置环境变量
```

---

## 手动部署步骤

### 1. 环境准备
```bash
ssh root@15.204.119.74
apt update && apt upgrade -y
apt install -y curl wget git build-essential nodejs npm
npm install -g pm2
```

### 2. 克隆项目
```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/sundny8/loveshow.git loveshow
cd loveshow
```

### 3. 配置环境
```bash
cp .env.example .env.local
nano .env.local
# 编辑并保存环境变量
```

### 4. 构建项目
```bash
npm install
npm run build
```

### 5. 启动应用
```bash
mkdir -p /var/log/pm2
pm2 start ecosystem.config.js
pm2 save
```

### 6. 配置 Nginx
```bash
# 创建 Nginx 配置 (参考 DEPLOYMENT_GUIDE.md)
nano /etc/nginx/sites-available/loveshow
ln -s /etc/nginx/sites-available/loveshow /etc/nginx/sites-enabled/loveshow
nginx -t
systemctl restart nginx
```

### 7. 配置 SSL
```bash
apt install -y certbot python3-certbot-nginx
certbot certonly --nginx -d loveshow.life -d www.loveshow.life
```

### 8. 配置 DNS
在域名注册商中添加 A 记录:
```
主机: @
类型: A
值: 15.204.119.74
```

---

## 常用命令

### PM2 命令
```bash
# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs loveshow

# 查看实时监控
pm2 monit

# 重启应用
pm2 restart loveshow

# 停止应用
pm2 stop loveshow

# 启动应用
pm2 start loveshow

# 删除应用
pm2 delete loveshow
```

### Nginx 命令
```bash
# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx

# 查看状态
systemctl status nginx

# 查看错误日志
tail -f /var/log/nginx/loveshow-error.log

# 查看访问日志
tail -f /var/log/nginx/loveshow-access.log
```

### Git 命令
```bash
# 更新代码
cd /var/www/loveshow
git pull origin main

# 重新构建
npm install
npm run build

# 重启应用
pm2 restart loveshow
```

### 系统命令
```bash
# 检查磁盘空间
df -h

# 检查内存使用
free -h

# 检查进程
ps aux | grep node

# 检查端口占用
netstat -tlnp | grep 3001

# 查看系统日志
journalctl -xe
```

---

## 环境变量配置

### 必需变量
```env
NEXT_PUBLIC_APP_URL=https://loveshow.life
BETTER_AUTH_SECRET=your-32-char-secret-key
OPENAI_API_KEY=sk_xxxxx
GEMINI_API_KEY=xxxxx
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@loveshow.life
```

### 可选变量
```env
STRIPE_SECRET_KEY=sk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
GOOGLE_CLIENT_ID=xxxxx
GITHUB_CLIENT_ID=xxxxx
```

详见 `ENV_SETUP.md`

---

## 故障排查

### 应用无法启动
```bash
# 查看详细错误
pm2 logs loveshow --err

# 检查环境变量
cat /var/www/loveshow/.env.local

# 检查依赖
cd /var/www/loveshow
npm install
```

### 无法访问网站
```bash
# 检查 DNS
nslookup loveshow.life

# 检查应用
pm2 status

# 检查 Nginx
systemctl status nginx

# 检查防火墙
ufw status
```

### SSL 证书错误
```bash
# 查看证书
certbot certificates

# 续期证书
certbot renew --force-renewal

# 重启 Nginx
systemctl restart nginx
```

### 性能问题
```bash
# 监控资源
pm2 monit

# 查看系统资源
free -h
df -h

# 查看连接数
netstat -an | grep ESTABLISHED | wc -l
```

---

## 文件位置

| 文件/目录 | 位置 |
|---------|------|
| 项目代码 | `/var/www/loveshow` |
| 环境变量 | `/var/www/loveshow/.env.local` |
| PM2 配置 | `/var/www/loveshow/ecosystem.config.js` |
| Nginx 配置 | `/etc/nginx/sites-available/loveshow` |
| SSL 证书 | `/etc/letsencrypt/live/loveshow.life/` |
| PM2 日志 | `/var/log/pm2/` |
| Nginx 日志 | `/var/log/nginx/` |
| 数据库 | `/var/www/loveshow/sqlite.db` |
| 上传文件 | `/var/www/loveshow/public/uploads/` |

---

## 性能优化

### 增加 PM2 实例数
```bash
pm2 delete loveshow
pm2 start ecosystem.config.js -i 4
pm2 save
```

### 启用 Gzip 压缩
在 Nginx 配置中添加:
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;
```

### 增加缓存时间
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 备份和恢复

### 备份数据库
```bash
cp /var/www/loveshow/sqlite.db /backup/sqlite.db.backup
```

### 备份整个项目
```bash
tar -czf /backup/loveshow-$(date +%Y%m%d).tar.gz /var/www/loveshow
```

### 恢复项目
```bash
tar -xzf /backup/loveshow-20240101.tar.gz -C /var/www
pm2 restart loveshow
```

---

## 监控和告警

### 配置 PM2 Plus (可选)
```bash
pm2 plus
```

### 配置日志收集 (可选)
```bash
pm2 install pm2-logrotate
```

### 配置错误追踪 (可选)
在 `.env.local` 中添加:
```env
SENTRY_DSN=your_sentry_dsn
```

---

## 更新和维护

### 更新代码
```bash
cd /var/www/loveshow
git pull origin main
npm install
npm run build
pm2 restart loveshow
```

### 更新依赖
```bash
cd /var/www/loveshow
npm update
npm run build
pm2 restart loveshow
```

### 更新系统
```bash
apt update
apt upgrade -y
```

---

## 安全建议

1. **定期更新系统和依赖**
   ```bash
   apt update && apt upgrade -y
   ```

2. **配置防火墙**
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

3. **使用强密码**
   - 生成: `openssl rand -base64 32`

4. **定期备份**
   ```bash
   tar -czf /backup/loveshow-$(date +%Y%m%d).tar.gz /var/www/loveshow
   ```

5. **监控日志**
   ```bash
   pm2 logs loveshow
   tail -f /var/log/nginx/loveshow-error.log
   ```

---

## 联系和支持

- **项目仓库**: https://github.com/sundny8/loveshow
- **部署文档**: 查看 `DEPLOYMENT_GUIDE.md`
- **环境配置**: 查看 `ENV_SETUP.md`
- **检查清单**: 查看 `DEPLOYMENT_CHECKLIST.md`

---

## 部署完成后

✅ 网站已上线: https://loveshow.life
✅ 应用已启动: PM2 管理
✅ 反向代理已配置: Nginx
✅ SSL 证书已配置: Let's Encrypt
✅ 域名已绑定: loveshow.life

**下一步:**
1. 配置监控和告警
2. 制定备份计划
3. 收集用户反馈
4. 持续改进和优化

