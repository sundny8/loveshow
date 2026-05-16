# LoveShow 部署方案总结

## 📋 概述

本文档为 LoveShow 项目部署到 OVH 服务器的完整解决方案。包含详细的部署指南、环境配置、快速参考和自动化脚本。

---

## 🎯 部署目标

- **服务器**: OVH (IP: 15.204.119.74)
- **域名**: loveshow.life
- **技术栈**: Next.js + Node.js + Nginx + PM2
- **应用端口**: 3001
- **反向代理**: Nginx
- **SSL**: Let's Encrypt
- **进程管理**: PM2

---

## 📚 文档清单

### 1. **DEPLOYMENT_GUIDE.md** (详细部署指南)
   - 10 个完整的部署步骤
   - 每个步骤都有详细的命令和说明
   - 包含故障排查和性能优化建议
   - **适合**: 第一次部署或需要详细了解的用户

### 2. **ENV_SETUP.md** (环境变量配置指南)
   - 所有必需和可选的环境变量说明
   - 如何获取各个 API 密钥
   - 完整的配置示例
   - 安全建议
   - **适合**: 需要配置 API 密钥和环境变量的用户

### 3. **DEPLOYMENT_CHECKLIST.md** (部署检查清单)
   - 部署前、中、后的完整检查项
   - 常见问题排查
   - 部署后维护建议
   - **适合**: 确保部署完整性和质量的用户

### 4. **QUICK_REFERENCE.md** (快速参考卡片)
   - 常用命令速查表
   - 文件位置索引
   - 性能优化快速指南
   - **适合**: 日常维护和快速查询

### 5. **deploy.sh** (自动化部署脚本)
   - 一键部署脚本
   - 自动检查环境
   - 自动配置 PM2、Nginx、SSL
   - **适合**: 快速部署或自动化部署

---

## 🚀 快速开始

### 方案 A: 一键自动部署 (推荐)

```bash
# 1. SSH 连接到服务器
ssh root@15.204.119.74

# 2. 下载并执行部署脚本
cd /tmp
wget https://raw.githubusercontent.com/sundny8/loveshow/main/deploy.sh
bash deploy.sh

# 3. 按照提示配置环境变量
```

**优点**: 快速、自动化、减少手动错误
**缺点**: 需要网络连接下载脚本

### 方案 B: 手动部署 (推荐学习)

按照 `DEPLOYMENT_GUIDE.md` 中的 10 个步骤逐一执行。

**优点**: 完全控制、易于理解、便于调试
**缺点**: 需要更多时间和手动操作

---

## 📋 部署前检查清单

在开始部署前，请确保以下条件已满足:

- [ ] 获得 OVH 服务器 SSH 访问权限
- [ ] 域名 `loveshow.life` 已注册
- [ ] 获得所有必需的 API 密钥:
  - [ ] OpenAI API 密钥
  - [ ] Google Gemini API 密钥
  - [ ] Resend 邮件服务密钥
  - [ ] Stripe 支付密钥 (如需要)
- [ ] 了解基本的 Linux 命令
- [ ] 有文本编辑器的使用经验 (nano 或 vim)

---

## 🔑 必需的 API 密钥

| 服务 | 用途 | 获取地址 | 优先级 |
|------|------|---------|--------|
| OpenAI | 图像生成 | https://platform.openai.com | 必需 |
| Google Gemini | 图像生成备用 | https://makersuite.google.com | 必需 |
| Resend | 邮件发送 | https://resend.com | 必需 |
| Stripe | 支付处理 | https://dashboard.stripe.com | 可选 |
| Google OAuth | 社交登录 | https://console.cloud.google.com | 可选 |
| GitHub OAuth | 社交登录 | https://github.com/settings/developers | 可选 |

详见 `ENV_SETUP.md` 获取详细的获取指南。

---

## 📁 部署后的文件结构

```
/var/www/loveshow/
├── .env.local                 # 环境变量 (不提交到 Git)
├── .next/                     # Next.js 构建输出
├── public/
│   ├── uploads/              # 用户上传文件
│   └── ...
├── src/                       # 源代码
├── ecosystem.config.js        # PM2 配置
├── package.json
├── package-lock.json
└── ...

/etc/nginx/
├── sites-available/
│   └── loveshow              # Nginx 配置
└── sites-enabled/
    └── loveshow -> ../sites-available/loveshow

/etc/letsencrypt/
└── live/
    └── loveshow.life/
        ├── fullchain.pem     # SSL 证书
        └── privkey.pem       # SSL 私钥

/var/log/
├── pm2/
│   ├── loveshow-error.log
│   └── loveshow-out.log
└── nginx/
    ├── loveshow-access.log
    └── loveshow-error.log
```

---

## 🔧 常用维护命令

### 应用管理
```bash
# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs loveshow

# 重启应用
pm2 restart loveshow

# 停止应用
pm2 stop loveshow

# 启动应用
pm2 start loveshow
```

### 代码更新
```bash
# 更新代码
cd /var/www/loveshow
git pull origin main

# 重新安装依赖
npm install

# 重新构建
npm run build

# 重启应用
pm2 restart loveshow
```

### 日志查看
```bash
# PM2 日志
pm2 logs loveshow

# Nginx 错误日志
tail -f /var/log/nginx/loveshow-error.log

# Nginx 访问日志
tail -f /var/log/nginx/loveshow-access.log

# 系统日志
journalctl -xe
```

---

## 🐛 常见问题

### Q1: 应用无法启动
**A**: 查看 PM2 日志 `pm2 logs loveshow --err`，检查环境变量是否完整。

### Q2: 无法访问网站
**A**: 检查 DNS 解析 `nslookup loveshow.life`，检查防火墙规则，检查 Nginx 状态。

### Q3: SSL 证书错误
**A**: 检查证书有效期 `certbot certificates`，手动续期 `certbot renew --force-renewal`。

### Q4: 性能问题
**A**: 使用 `pm2 monit` 监控资源，增加 PM2 实例数，启用 Gzip 压缩。

详见 `DEPLOYMENT_GUIDE.md` 的故障排查部分。

---

## 📊 部署时间估计

| 步骤 | 时间 | 说明 |
|------|------|------|
| 环境准备 | 5-10 分钟 | 安装依赖 |
| 克隆项目 | 2-5 分钟 | 下载代码 |
| 配置环境 | 5-10 分钟 | 编辑 .env.local |
| 安装依赖 | 10-20 分钟 | npm install |
| 构建项目 | 5-10 分钟 | npm run build |
| 配置 PM2 | 2-3 分钟 | 启动应用 |
| 配置 Nginx | 3-5 分钟 | 反向代理 |
| 配置 SSL | 5-10 分钟 | Let's Encrypt |
| 配置 DNS | 5-30 分钟 | DNS 生效 |
| **总计** | **45-100 分钟** | 取决于网络速度 |

---

## ✅ 部署完成标志

当以下条件都满足时，部署即完成:

- ✅ 网站可通过 `https://loveshow.life` 访问
- ✅ 页面加载正常，无 SSL 证书警告
- ✅ 所有功能正常工作
- ✅ PM2 应用状态为 "online"
- ✅ Nginx 状态为 "active (running)"
- ✅ 应用日志无错误
- ✅ 可以登录和使用应用

---

## 🔐 安全建议

1. **定期更新系统**
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

## 📞 获取帮助

### 文档查询
- 详细部署步骤: 查看 `DEPLOYMENT_GUIDE.md`
- 环境变量配置: 查看 `ENV_SETUP.md`
- 部署检查清单: 查看 `DEPLOYMENT_CHECKLIST.md`
- 快速参考: 查看 `QUICK_REFERENCE.md`

### 常见问题
- 查看 `DEPLOYMENT_GUIDE.md` 中的故障排查部分
- 查看 `DEPLOYMENT_CHECKLIST.md` 中的常见问题排查

### 日志查询
```bash
# PM2 日志
pm2 logs loveshow

# Nginx 错误日志
tail -f /var/log/nginx/loveshow-error.log

# 系统日志
journalctl -xe
```

---

## 📈 后续优化

部署完成后，可以考虑以下优化:

1. **性能优化**
   - 启用 Gzip 压缩
   - 配置 CDN
   - 增加 PM2 实例数
   - 优化数据库查询

2. **监控和告警**
   - 配置 PM2 Plus
   - 配置 Sentry 错误追踪
   - 配置日志收集 (ELK Stack)
   - 配置性能监控

3. **备份和恢复**
   - 配置自动备份
   - 测试恢复流程
   - 文档化恢复步骤

4. **安全加固**
   - 配置 WAF (Web Application Firewall)
   - 配置 DDoS 防护
   - 定期安全审计
   - 配置入侵检测

---

## 📝 版本信息

- **项目**: LoveShow
- **版本**: 1.0.0
- **部署日期**: 2024
- **文档版本**: 1.0
- **最后更新**: 2024

---

## 📄 许可证

本部署文档和脚本遵循项目的许可证。详见 `LICENSE` 文件。

---

## 🎉 祝贺

如果你已经按照本指南成功部署了 LoveShow，恭喜你！

**下一步:**
1. 邀请用户使用
2. 收集反馈
3. 持续改进
4. 监控性能

感谢使用 LoveShow！

