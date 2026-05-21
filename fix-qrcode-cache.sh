#!/bin/bash

# 修复二维码图片缓存问题的脚本
# 用法: ./fix-qrcode-cache.sh

set -e

echo "🔍 诊断二维码图片缓存问题..."
echo "================================"

# 1. 检查当前 Git 状态
echo "📋 1. 检查 Git 状态..."
git status

# 2. 确保在 main 分支
echo ""
echo "🌿 2. 确保在 main 分支..."
git checkout main

# 3. 强制拉取最新代码
echo ""
echo "📥 3. 强制拉取最新代码..."
git fetch origin main
git reset --hard origin/main

# 4. 检查二维码文件
echo ""
echo "🖼️  4. 检查二维码文件..."
if [ -f "public/qrcode/qrcode.jpg" ]; then
    echo "✅ 文件存在"
    ls -lh public/qrcode/qrcode.jpg
    echo "文件 MD5: $(md5sum public/qrcode/qrcode.jpg | cut -d' ' -f1)"
else
    echo "❌ 文件不存在！"
    exit 1
fi

# 5. 清除 Next.js 缓存
echo ""
echo "🗑️  5. 清除 Next.js 缓存..."
rm -rf .next/cache
rm -rf .next/static

# 6. 重新构建
echo ""
echo "🔨 6. 重新构建项目..."
npm run build

# 7. 重启 PM2
echo ""
echo "🔄 7. 重启 PM2 应用..."
pm2 restart loveshow

# 8. 清除 PM2 日志（可选）
echo ""
echo "📝 8. 清除旧日志..."
pm2 flush loveshow

# 9. 等待应用启动
echo ""
echo "⏳ 9. 等待应用启动..."
sleep 5

# 10. 检查应用状态
echo ""
echo "📊 10. 检查应用状态..."
pm2 status loveshow

# 11. 显示最新日志
echo ""
echo "📝 11. 最新日志："
echo "================================"
pm2 logs loveshow --lines 20 --nostream

echo ""
echo "✅ 修复完成！"
echo ""
echo "🌐 现在请执行以下步骤清除浏览器缓存："
echo ""
echo "方法 1: 硬刷新（推荐）"
echo "  - Chrome/Edge: Ctrl + Shift + R 或 Ctrl + F5"
echo "  - Firefox: Ctrl + Shift + R 或 Ctrl + F5"
echo "  - Safari: Cmd + Shift + R"
echo ""
echo "方法 2: 清除浏览器缓存"
echo "  - Chrome: Ctrl + Shift + Delete"
echo "  - 选择 '图片和文件' 选项"
echo "  - 点击 '清除数据'"
echo ""
echo "方法 3: 使用隐私/无痕模式"
echo "  - Chrome: Ctrl + Shift + N"
echo "  - Firefox: Ctrl + Shift + P"
echo ""
echo "方法 4: 在 URL 后添加时间戳参数"
echo "  - 访问: https://loveshow.life/qrcode/qrcode.jpg?t=$(date +%s)"
echo ""
echo "💡 如果还是显示旧图片，可能需要清除 Nginx 缓存："
echo "  sudo systemctl reload nginx"
