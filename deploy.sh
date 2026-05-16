#!/bin/bash

# LoveShow 快速部署脚本
# 使用方法: bash deploy.sh

set -e

echo "=========================================="
echo "LoveShow 项目部署脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_DIR="/var/www/loveshow"
APP_NAME="loveshow"
APP_PORT="3001"
DOMAIN="loveshow.life"
REPO_URL="https://github.com/sundny8/loveshow.git"

# 函数：打印信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 步骤 1: 检查系统环境
print_info "步骤 1: 检查系统环境..."

if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm 未安装"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    print_warn "PM2 未安装，正在安装..."
    npm install -g pm2
fi

if ! command -v nginx &> /dev/null; then
    print_warn "Nginx 未安装，正在安装..."
    apt update
    apt install -y nginx
fi

print_info "Node.js 版本: $(node --version)"
print_info "npm 版本: $(npm --version)"
print_info "PM2 版本: $(pm2 --version)"

# 步骤 2: 创建项目目录
print_info "步骤 2: 创建项目目录..."

if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p /var/www
    cd /var/www
    git clone $REPO_URL loveshow
    print_info "项目已克隆到 $PROJECT_DIR"
else
    print_warn "项目目录已存在，跳过克隆"
    cd $PROJECT_DIR
    git pull origin main
    print_info "项目已更新"
fi

# 步骤 3: 检查环境变量
print_info "步骤 3: 检查环境变量..."

if [ ! -f "$PROJECT_DIR/.env.local" ]; then
    print_warn ".env.local 不存在，正在创建..."
    cp $PROJECT_DIR/.env.example $PROJECT_DIR/.env.local
    print_warn "请编辑 $PROJECT_DIR/.env.local 配置环境变量"
    print_warn "特别是: BETTER_AUTH_SECRET, OPENAI_API_KEY, GEMINI_API_KEY 等"
    read -p "按 Enter 继续..."
else
    print_info ".env.local 已存在"
fi

# 步骤 4: 安装依赖
print_info "步骤 4: 安装依赖..."

cd $PROJECT_DIR
npm install

# 步骤 5: 构建项目
print_info "步骤 5: 构建项目..."

npm run build

if [ ! -d "$PROJECT_DIR/.next" ]; then
    print_error "构建失败，.next 目录不存在"
    exit 1
fi

print_info "项目构建成功"

# 步骤 6: 配置 PM2
print_info "步骤 6: 配置 PM2..."

cat > $PROJECT_DIR/ecosystem.config.js << 'EOF'
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

mkdir -p /var/log/pm2

# 停止旧的应用实例
pm2 delete $APP_NAME 2>/dev/null || true

# 启动应用
pm2 start $PROJECT_DIR/ecosystem.config.js
pm2 save

print_info "PM2 已启动应用"

# 步骤 7: 配置 Nginx
print_info "步骤 7: 配置 Nginx..."

cat > /etc/nginx/sites-available/loveshow << 'EOF'
upstream loveshow_backend {
    server 127.0.0.1:3001;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name loveshow.life www.loveshow.life;

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name loveshow.life www.loveshow.life;

    ssl_certificate /etc/letsencrypt/live/loveshow.life/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/loveshow.life/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    access_log /var/log/nginx/loveshow-access.log;
    error_log /var/log/nginx/loveshow-error.log;

    client_max_body_size 100M;

    root /var/www/loveshow/public;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

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

    location /uploads/ {
        alias /var/www/loveshow/public/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
EOF

# 启用 Nginx 配置
ln -sf /etc/nginx/sites-available/loveshow /etc/nginx/sites-enabled/loveshow

# 测试 Nginx 配置
if nginx -t; then
    systemctl restart nginx
    print_info "Nginx 已配置并重启"
else
    print_error "Nginx 配置有误"
    exit 1
fi

# 步骤 8: 配置 SSL 证书
print_info "步骤 8: 配置 SSL 证书..."

if [ ! -f "/etc/letsencrypt/live/loveshow.life/fullchain.pem" ]; then
    print_warn "SSL 证书不存在，正在申请..."
    
    if ! command -v certbot &> /dev/null; then
        apt install -y certbot python3-certbot-nginx
    fi
    
    certbot certonly --nginx -d loveshow.life -d www.loveshow.life --non-interactive --agree-tos -m admin@loveshow.life
    
    if [ $? -eq 0 ]; then
        print_info "SSL 证书已申请"
        systemctl restart nginx
    else
        print_warn "SSL 证书申请失败，请手动执行: certbot certonly --nginx -d loveshow.life"
    fi
else
    print_info "SSL 证书已存在"
fi

# 步骤 9: 配置防火墙
print_info "步骤 9: 配置防火墙..."

if command -v ufw &> /dev/null; then
    ufw allow 22/tcp 2>/dev/null || true
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    print_info "防火墙规则已配置"
fi

# 步骤 10: 验证部署
print_info "步骤 10: 验证部署..."

sleep 2

if pm2 status | grep -q "online"; then
    print_info "应用已启动"
else
    print_error "应用启动失败"
    pm2 logs $APP_NAME
    exit 1
fi

if systemctl is-active --quiet nginx; then
    print_info "Nginx 已运行"
else
    print_error "Nginx 未运行"
    exit 1
fi

# 完成
echo ""
echo "=========================================="
echo -e "${GREEN}部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址: https://loveshow.life"
echo ""
echo "常用命令:"
echo "  查看应用状态: pm2 status"
echo "  查看应用日志: pm2 logs loveshow"
echo "  重启应用: pm2 restart loveshow"
echo "  查看 Nginx 日志: tail -f /var/log/nginx/loveshow-error.log"
echo ""
echo "下一步:"
echo "  1. 配置 DNS 记录指向 15.204.119.74"
echo "  2. 编辑 .env.local 配置必要的 API 密钥"
echo "  3. 重启应用: pm2 restart loveshow"
echo ""
