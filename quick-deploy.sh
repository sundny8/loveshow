#!/bin/bash

# LoveShow 520 快速部署脚本
# 用法: ./quick-deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署 LoveShow 520..."
echo "================================"

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 2. 检查是否有 package.json 变化
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
    echo "📦 检测到依赖变化，重新安装..."
    npm install
else
    echo "✅ 依赖无变化，跳过安装"
fi

# 3. 构建项目
echo "🔨 构建项目..."
npm run build

# 4. 重启应用
echo "🔄 重启应用..."
pm2 restart loveshow

# 5. 等待应用启动
echo "⏳ 等待应用启动..."
sleep 3

# 6. 检查状态
echo "📊 检查应用状态..."
pm2 status loveshow

# 7. 显示最新日志
echo "📝 最新日志："
echo "================================"
pm2 logs loveshow --lines 20 --nostream

echo ""
echo "✅ 部署完成！"
echo "🌐 访问: https://loveshow.life"
echo ""
echo "💡 提示："
echo "  - 查看完整日志: pm2 logs loveshow"
echo "  - 监控应用: pm2 monit"
echo "  - 查看状态: pm2 status"
