# 二维码图片缓存问题解决方案

## 问题描述

更新了二维码图片并上传到 Git 仓库，OVH 服务器重新拉取 main 分支构建部署后，显示的还是旧的二维码图片。

## 原因分析

这是一个**多层缓存**问题，可能涉及：

1. **浏览器缓存** ⭐ 最常见
2. **Next.js 图片优化缓存**
3. **Nginx 静态文件缓存**
4. **CDN 缓存**（如果使用）
5. **服务器文件未正确更新**

## 解决方案

### 方案 1: 添加版本号参数（已实施）✅

**原理**: 通过改变 URL 强制浏览器重新加载图片

**修改内容**:
```tsx
// 旧代码
<Image src="/qrcode/qrcode.jpg" ... />

// 新代码
<Image src="/qrcode/qrcode.jpg?v=2" unoptimized ... />
```

**优点**:
- ✅ 简单有效
- ✅ 每次更新图片只需改变版本号
- ✅ 不需要清除缓存
- ✅ 添加 `unoptimized` 避免 Next.js 图片优化缓存

**使用方法**:
- 每次更新二维码图片时，将 `?v=2` 改为 `?v=3`、`?v=4` 等

---

### 方案 2: 服务器端完整清理（推荐执行一次）

在 OVH 服务器上执行以下命令：

```bash
# 1. SSH 连接到服务器
ssh root@15.204.119.74

# 2. 进入项目目录
cd /var/www/loveshow

# 3. 使用修复脚本（推荐）
chmod +x fix-qrcode-cache.sh
./fix-qrcode-cache.sh
```

或者手动执行：

```bash
# 3. 强制拉取最新代码
git fetch origin main
git reset --hard origin/main

# 4. 验证文件已更新
ls -lh public/qrcode/qrcode.jpg
md5sum public/qrcode/qrcode.jpg

# 5. 清除 Next.js 缓存
rm -rf .next/cache
rm -rf .next/static

# 6. 重新构建
npm run build

# 7. 重启应用
pm2 restart loveshow

# 8. 清除 PM2 日志
pm2 flush loveshow

# 9. 查看状态
pm2 status
pm2 logs loveshow --lines 50
```

---

### 方案 3: 清除浏览器缓存

#### 方法 A: 硬刷新（最快）⭐

- **Chrome/Edge**: `Ctrl + Shift + R` 或 `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R` 或 `Ctrl + F5`
- **Safari**: `Cmd + Shift + R`
- **移动端**: 清除浏览器缓存后重新访问

#### 方法 B: 清除浏览器缓存

**Chrome/Edge**:
1. 按 `Ctrl + Shift + Delete`
2. 选择时间范围：全部时间
3. 勾选 "缓存的图片和文件"
4. 点击 "清除数据"

**Firefox**:
1. 按 `Ctrl + Shift + Delete`
2. 选择时间范围：全部
3. 勾选 "缓存"
4. 点击 "立即清除"

#### 方法 C: 使用隐私/无痕模式

- **Chrome**: `Ctrl + Shift + N`
- **Firefox**: `Ctrl + Shift + P`
- **Edge**: `Ctrl + Shift + N`

#### 方法 D: 直接访问图片 URL 验证

访问以下 URL 查看是否是最新图片：
```
https://loveshow.life/qrcode/qrcode.jpg?t=1234567890
```
（在 URL 后添加随机时间戳参数）

---

### 方案 4: 清除 Nginx 缓存（如果配置了缓存）

```bash
# 检查 Nginx 配置
cat /etc/nginx/sites-available/loveshow | grep cache

# 如果配置了缓存，清除缓存
sudo rm -rf /var/cache/nginx/*

# 重新加载 Nginx
sudo systemctl reload nginx
```

---

### 方案 5: 验证文件是否正确更新

#### 在服务器上验证：

```bash
# 1. 检查文件大小和修改时间
ls -lh /var/www/loveshow/public/qrcode/qrcode.jpg

# 2. 查看文件 MD5
md5sum /var/www/loveshow/public/qrcode/qrcode.jpg

# 3. 查看 Git 提交历史
cd /var/www/loveshow
git log --oneline -- public/qrcode/qrcode.jpg

# 4. 查看当前分支和提交
git branch
git log --oneline -1
```

#### 在本地验证：

```bash
# 查看本地文件 MD5
md5sum public/qrcode/qrcode.jpg

# 查看 Git 中的文件
git show HEAD:public/qrcode/qrcode.jpg | md5sum
```

**对比两个 MD5 值**，如果不同说明服务器文件未正确更新。

---

## 完整部署流程（推荐）

```bash
# 1. SSH 连接
ssh root@15.204.119.74

# 2. 进入项目目录
cd /var/www/loveshow

# 3. 备份当前文件（可选）
cp public/qrcode/qrcode.jpg public/qrcode/qrcode.jpg.backup

# 4. 强制更新代码
git fetch origin main
git reset --hard origin/main

# 5. 验证文件已更新
ls -lh public/qrcode/qrcode.jpg
# 应该显示新的文件大小（约 9KB）

# 6. 清除所有缓存
rm -rf .next/cache
rm -rf .next/static
rm -rf node_modules/.cache

# 7. 重新构建
npm run build

# 8. 重启应用
pm2 restart loveshow

# 9. 验证应用运行正常
pm2 status
pm2 logs loveshow --lines 50

# 10. 测试访问
curl -I https://loveshow.life/qrcode/qrcode.jpg
```

---

## 预防措施

### 1. 使用版本号参数（已实施）

每次更新图片时修改版本号：
```tsx
<Image src="/qrcode/qrcode.jpg?v=3" ... />
```

### 2. 添加时间戳

使用动态时间戳：
```tsx
const timestamp = Date.now();
<Image src={`/qrcode/qrcode.jpg?t=${timestamp}`} ... />
```

### 3. 配置 Nginx 不缓存特定文件

在 Nginx 配置中添加：
```nginx
location ~* /qrcode/ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
}
```

### 4. 使用 Next.js 的 unoptimized 属性

```tsx
<Image src="/qrcode/qrcode.jpg" unoptimized ... />
```

---

## 故障排查检查清单

- [ ] 服务器上的文件是否已更新？
  ```bash
  ls -lh /var/www/loveshow/public/qrcode/qrcode.jpg
  ```

- [ ] Git 是否拉取了最新代码？
  ```bash
  git log --oneline -1
  ```

- [ ] Next.js 是否重新构建？
  ```bash
  ls -lh .next/
  ```

- [ ] PM2 是否重启？
  ```bash
  pm2 status
  ```

- [ ] 浏览器是否清除缓存？
  - 尝试硬刷新 `Ctrl + Shift + R`
  - 尝试隐私模式

- [ ] 直接访问图片 URL 是否显示新图片？
  ```
  https://loveshow.life/qrcode/qrcode.jpg?t=123456
  ```

- [ ] 检查浏览器开发者工具 Network 标签
  - 查看图片请求的响应头
  - 查看是否从缓存加载（from cache）

---

## 技术细节

### 文件信息

**旧文件**:
- 大小: 27786 字节 (27KB)
- 提交: 9322bca

**新文件**:
- 大小: 9610 字节 (9KB)
- 提交: 8bacf44

### 缓存层级

```
用户浏览器
    ↓
CDN（如果有）
    ↓
Nginx 静态文件缓存
    ↓
Next.js 图片优化缓存
    ↓
实际文件系统
```

每一层都可能缓存旧图片，需要逐层清除。

---

## 快速参考

### 服务器端一键修复
```bash
ssh root@15.204.119.74 'cd /var/www/loveshow && git reset --hard origin/main && rm -rf .next/cache && npm run build && pm2 restart loveshow'
```

### 浏览器端快速验证
```
访问: https://loveshow.life/qrcode/qrcode.jpg?v=2
```

### 检查文件是否更新
```bash
curl -I https://loveshow.life/qrcode/qrcode.jpg
# 查看 Content-Length 是否约为 9610 字节
```

---

## 总结

**最有效的解决方案组合**:

1. ✅ 代码中添加版本号参数（已完成）
2. 🔧 服务器执行完整清理流程
3. 🌐 浏览器硬刷新或清除缓存

**下次更新图片时**:
- 只需修改版本号 `?v=3`、`?v=4` 等
- 无需清除任何缓存

---

**更新时间**: 2026-05-21  
**状态**: ✅ 已添加版本号参数和 unoptimized 属性
