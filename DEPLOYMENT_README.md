# 🚀 LoveShow 部署指南

欢迎使用 LoveShow 部署指南！本文档将帮助你快速部署项目到 OVH 服务器。

---

## 📖 从这里开始

### 第一次部署？

1. **阅读部署总结** → `DEPLOYMENT_SUMMARY.md`
   - 了解部署架构和整体流程
   - 检查部署前的准备条件

2. **选择部署方式**
   - **快速部署** (推荐): 使用 `deploy.sh` 自动化脚本
   - **详细部署**: 按照 `DEPLOYMENT_GUIDE.md` 逐步操作

3. **配置环境变量** → `ENV_SETUP.md`
   - 获取必需的 API 密钥
   - 配置 `.env.local` 文件

4. **验证部署** → `DEPLOYMENT_CHECKLIST.md`
   - 按照检查清单验证部署完整性
   - 排查常见问题

---

## 🎯 快速部署 (5 分钟)

### 前置条件
- [ ] OVH 服务器 SSH 访问权限
- [ ] 域名 `loveshow.life` 已注册
- [ ] 获得必需的 API 密钥 (OpenAI, Gemini, Resend)

### 部署步骤

```bash
# 1. SSH 连接到服务器
ssh root@15.204.119.74

# 2. 下载部署脚本
cd /tmp
wget https://raw.githubusercontent.com/sundny8/loveshow/main/deploy.sh

# 3. 执行部署脚本
bash deploy.sh

# 4. 按照提示配置环境变量
# 脚本会自动:
# - 检查系统环境
# - 克隆项目代码
# - 安装依赖
# - 构建项目
# - 配置 PM2
# - 配置 Nginx
# - 申请 SSL 证书
```

### 部署完成后

1. 配置 DNS 记录
   ```
   主机: @
   类型: A
   值: 15.204.119.74
   ```

2. 等待 DNS 生效 (5-30 分钟)

3. 访问 `https://loveshow.life`

---

## 📚 文档导航

### 核心文档

| 文档 | 用途 | 适合人群 |
|------|------|---------|
| **DEPLOYMENT_SUMMARY.md** | 部署方案总结 | 所有人 |
| **DEPLOYMENT_GUIDE.md** | 详细部署步骤 | 需要详细了解的用户 |
| **ENV_SETUP.md** | 环境变量配置 | 需要配置 API 密钥的用户 |
| **DEPLOYMENT_CHECKLIST.md** | 部署检查清单 | 需要验证部署的用户 |
| **QUICK_REFERENCE.md** | 快速参考卡片 | 日常维护用户 |

### 脚本

| 脚本 | 用途 |
|------|------|
| **deploy.sh** | 一键自动部署脚本 |

---

## 🔑 必需的 API 密钥

在部署前，请获取以下 API 密钥:

### 1. OpenAI API 密钥 (必需)
- 访问: https://platform.openai.com/account/api-keys
- 创建新密钥
- 复制到 `OPENAI_API_KEY`

### 2. Google Gemini API 密钥 (必需)
- 访问: https://makersuite.google.com/app/apikey
- 创建 API 密钥
- 复制到 `GEMINI_API_KEY`

### 3. Resend 邮件服务 (必需)
- 访问: https://resend.com
- 注册账户
- 获取 API 密钥
- 复制到 `RESEND_API_KEY`

### 4. Stripe 支付 (可选)
- 访问: https://dashboard.stripe.com
- 获取 API 密钥
- 复制到 `STRIPE_SECRET_KEY`

详见 `ENV_SETUP.md` 获取详细指南。

---

## 🚀 部署方式对比

### 方式 A: 自动部署 (推荐)

```bash
bash deploy.sh
```

**优点:**
- ✅ 快速 (5-10 分钟)
- ✅ 自动化 (减少手动错误)
- ✅ 适合初学者

**缺点:**
- ❌ 需要网络连接
- ❌ 难以自定义

### 方式 B: 手动部署

按照 `DEPLOYMENT_GUIDE.md` 逐步操作。

**优点:**
- ✅ 完全控制
- ✅ 易于理解
- ✅ 便于调试

**缺点:**
- ❌ 需要更多时间 (30-60 分钟)
- ❌ 容易出错

---

## 📋 部署检查清单

### 部署前
- [ ] 获得服务器 SSH 访问权限
- [ ] 域名已注册
- [ ] 获得所有必需的 API 密钥
- [ ] 了解基本 Linux 命令

### 部署中
- [ ] 环境已准备
- [ ] 代码已克隆
- [ ] 依赖已安装
- [ ] 项目已构建
- [ ] PM2 已启动
- [ ] Nginx 已配置
- [ ] SSL 已申请

### 部署后
- [ ] DNS 已配置
- [ ] 网站可访问
- [ ] 功能正常
- [ ] 日志无错误

详见 `DEPLOYMENT_CHECKLIST.md` 获取完整清单。

---

## 🔧 常用命令

### 查看应用状态
```bash
pm2 status
pm2 logs loveshow
```

### 重启应用
```bash
pm2 restart loveshow
```

### 更新代码
```bash
cd /var/www/loveshow
git pull origin main
npm install
npm run build
pm2 restart loveshow
```

### 查看日志
```bash
# PM2 日志
pm2 logs loveshow

# Nginx 错误日志
tail -f /var/log/nginx/loveshow-error.log

# Nginx 访问日志
tail -f /var/log/nginx/loveshow-access.log
```

详见 `QUICK_REFERENCE.md` 获取更多命令。

---

## 🐛 遇到问题？

### 问题排查步骤

1. **查看应用日志**
   ```bash
   pm2 logs loveshow --err
   ```

2. **查看 Nginx 日志**
   ```bash
   tail -f /var/log/nginx/loveshow-error.log
   ```

3. **检查环境变量**
   ```bash
   cat /var/www/loveshow/.env.local
   ```

4. **查看系统日志**
   ```bash
   journalctl -xe
   ```

### 常见问题

- **应用无法启动**: 查看 `DEPLOYMENT_GUIDE.md` 的故障排查部分
- **无法访问网站**: 检查 DNS、防火墙、Nginx 状态
- **SSL 证书错误**: 检查证书有效期，手动续期
- **性能问题**: 增加 PM2 实例数，启用 Gzip 压缩

详见 `DEPLOYMENT_CHECKLIST.md` 获取完整的故障排查指南。

---

## 📞 获取帮助

### 文档
- 部署总结: `DEPLOYMENT_SUMMARY.md`
- 详细指南: `DEPLOYMENT_GUIDE.md`
- 环境配置: `ENV_SETUP.md`
- 检查清单: `DEPLOYMENT_CHECKLIST.md`
- 快速参考: `QUICK_REFERENCE.md`

### 日志
```bash
pm2 logs loveshow
tail -f /var/log/nginx/loveshow-error.log
journalctl -xe
```

### 项目仓库
https://github.com/sundny8/loveshow

---

## ✅ 部署完成

当你看到以下情况时，部署即完成:

- ✅ 网站可通过 `https://loveshow.life` 访问
- ✅ 页面加载正常
- ✅ 没有 SSL 证书警告
- ✅ 所有功能正常工作
- ✅ 应用日志无错误

---

## 🎉 下一步

部署完成后，你可以:

1. **邀请用户使用**
   - 分享网站链接
   - 收集用户反馈

2. **监控应用**
   - 定期检查日志
   - 监控系统资源
   - 配置告警

3. **持续改进**
   - 修复 bug
   - 添加新功能
   - 优化性能

4. **定期维护**
   - 更新系统
   - 更新依赖
   - 备份数据

---

## 📝 快速链接

- 🚀 [快速部署](#快速部署-5-分钟)
- 📚 [文档导航](#文档导航)
- 🔑 [API 密钥](#必需的-api-密钥)
- 🔧 [常用命令](#常用命令)
- 🐛 [问题排查](#遇到问题)
- ✅ [完成标志](#部署完成)

---

## 💡 提示

- 📖 **第一次部署?** 从 `DEPLOYMENT_SUMMARY.md` 开始
- ⚡ **想快速部署?** 使用 `deploy.sh` 脚本
- 🔍 **需要详细步骤?** 查看 `DEPLOYMENT_GUIDE.md`
- 🔑 **需要配置 API?** 查看 `ENV_SETUP.md`
- ✓ **需要验证部署?** 查看 `DEPLOYMENT_CHECKLIST.md`
- ⚙️ **日常维护?** 查看 `QUICK_REFERENCE.md`

---

## 📄 许可证

本部署文档和脚本遵循项目的许可证。详见 `LICENSE` 文件。

---

**祝你部署顺利！** 🎉

如有任何问题，请查看相应的文档或检查应用日志。

