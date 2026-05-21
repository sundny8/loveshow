# 部署更新说明

## 最新更新内容

### 2026-05-21 更新

#### 1. 添加网站图标 (Favicon)
- ✅ 创建了爱心主题的 SVG 图标 (`/public/icon.svg`)
- ✅ 添加了动态生成的 favicon (`/src/app/icon.tsx`)
- ✅ 添加了 Apple Touch Icon (`/src/app/apple-icon.tsx`)
- ✅ 更新了 layout 配置以使用新图标

#### 2. 清理构建产物
- ✅ 添加 `*.tsbuildinfo` 到 `.gitignore`

#### 3. 文档更新
- ✅ 创建了 `CURRENT_STATUS.md` 状态文档

## 🚀 部署到 OVH 服务器

### 方式一：SSH 手动部署（推荐）

```bash
# 1. 连接到服务器
ssh root@15.204.119.74

# 2. 进入项目目录
cd /var/www/loveshow

# 3. 拉取最新代码
git pull origin main

# 4. 安装依赖（如果有新依赖）
npm install

# 5. 重新构建项目
npm run build

# 6. 重启应用
pm2 restart loveshow

# 7. 查看日志确认运行正常
pm2 logs loveshow --lines 50
```

### 方式二：使用部署脚本

如果服务器上已经配置了 `deploy.sh` 脚本：

```bash
# 在本地执行
ssh root@15.204.119.74 'cd /var/www/loveshow && ./deploy.sh'
```

### 验证部署

1. **检查应用状态**
```bash
pm2 status
```

2. **查看最新日志**
```bash
pm2 logs loveshow --lines 100
```

3. **测试网站访问**
```bash
curl -I https://loveshow.life
```

4. **在浏览器中验证**
- 访问 https://loveshow.life
- 检查浏览器标签页是否显示爱心图标 ❤️
- 打开开发者工具，确认没有 favicon 404 错误

## 📋 部署后检查清单

- [ ] 应用成功启动（`pm2 status` 显示 online）
- [ ] 没有错误日志（`pm2 logs loveshow`）
- [ ] 网站可以正常访问
- [ ] Favicon 正常显示（浏览器标签页有爱心图标）
- [ ] 所有功能正常工作：
  - [ ] 用户注册/登录
  - [ ] 520 专栏各功能
  - [ ] 图片生成
  - [ ] 音乐生成
  - [ ] 作品库查看

## 🔧 常见问题排查

### 问题 1: 图标不显示

**可能原因**：浏览器缓存

**解决方案**：
```bash
# 清除浏览器缓存，或使用隐私模式访问
# Chrome: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete
```

### 问题 2: 构建失败

**可能原因**：依赖问题或内存不足

**解决方案**：
```bash
# 清除缓存重新构建
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### 问题 3: PM2 重启失败

**可能原因**：端口被占用或配置错误

**解决方案**：
```bash
# 查看端口占用
netstat -tlnp | grep 3001

# 完全停止并重启
pm2 delete loveshow
pm2 start ecosystem.config.js
pm2 save
```

## 📊 性能监控

### 查看应用性能
```bash
pm2 monit
```

### 查看详细信息
```bash
pm2 show loveshow
```

### 查看内存使用
```bash
pm2 list
```

## 🔄 回滚操作

如果新版本有问题，可以回滚到上一个版本：

```bash
# 1. 查看提交历史
cd /var/www/loveshow
git log --oneline -10

# 2. 回滚到上一个提交
git reset --hard HEAD~1

# 3. 重新构建
npm run build

# 4. 重启应用
pm2 restart loveshow
```

## 📝 更新日志

### v1.3.0 (2026-05-21)
- 添加网站 favicon 和 app icons
- 优化 SEO 配置
- 清理构建产物

### v1.2.0 (之前)
- 520 专栏所有功能
- 音乐播放器优化
- AI 肖像生成优化
- 合规性更新
- SEO 优化

## 🆘 紧急联系

如果部署遇到严重问题：

1. **立即回滚**到上一个稳定版本
2. **查看日志**：`pm2 logs loveshow --err`
3. **检查服务器资源**：`htop` 或 `free -h`
4. **重启服务器**（最后手段）：`reboot`

## 📞 支持信息

- **GitHub**: https://github.com/sundny8/loveshow
- **服务器**: OVH (15.204.119.74)
- **域名**: loveshow.life
- **Email**: noreply@loveshow.life
