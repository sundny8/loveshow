# TOS 对象存储集成说明

## 概述

LoveShow520 项目已集成火山引擎 TOS（对象存储），用于存储：
- 用户上传的参考图片
- AI 生成的证件照
- 作品库中的所有图片

## 环境配置

已在 `.env.local` 中配置以下 TOS 参数：

```env
# 对象存储配置（火山引擎TOS）
STORAGE_TYPE=tos
AWS_REGION=cn-beijing
AWS_ACCESS_KEY_ID=AKLTMDg0ZmFmN2EyYmYzNDQ0N2I1ZDc0NzYyNGViZjk4NzA
AWS_SECRET_ACCESS_KEY=WW1RMlkyRmhNemsyTldOaU5HTmlabUpqTmpGbU16Wm1ZemszT1RJNE9UVQ==
AWS_S3_BUCKET=imagehouse1
AWS_S3_ENDPOINT=https://tos-cn-beijing.volces.com

# 文件存储模式
FILE_STORE_MODE=tos

# 可选：CDN 加速
NEXT_PUBLIC_CDN_BASE_URL=
```

## 架构说明

### 1. 存储工具库

**文件**: `src/lib/storage/s3.ts`

提供以下功能：
- `getUploadPresignedUrl()` - 生成上传预签名 URL
- `getDownloadPresignedUrl()` - 生成下载预签名 URL
- `getPublicUrl()` - 获取公开访问 URL
- `uploadToStorage()` - 直接上传 Buffer 到 TOS

### 2. 图片存储

**文件**: `src/lib/photo/storage.ts`

根据 `FILE_STORE_MODE` 环境变量自动切换存储模式：
- `tos` - 上传到火山引擎 TOS
- `local` - 上传到本地 `public/uploads` 目录

**存储路径规则**:
```
TOS 模式:
- 参考图: loveshow/{userId}/{timestamp}_{nanoid}.png
- 生成图: loveshow/{userId}/{timestamp}_{nanoid}.jpg

本地模式:
- 所有图片: public/uploads/{timestamp}_{nanoid}.{ext}
```

### 3. API 集成

#### 照片生成 API
**文件**: `src/app/api/photo/generate/route.ts`

- 上传参考图到 TOS
- AI 生成后将结果图上传到 TOS
- 数据库中存储完整的 TOS 公开 URL

#### 上传 URL API
**文件**: `src/app/api/tasks/upload-url/route.ts`

- 为前端直接上传生成 TOS 预签名 URL
- 前端可使用该 URL 直接上传文件到 TOS

### 4. 作品库

**文件**: `src/app/[locale]/gallery/page.tsx`

- 从数据库读取图片 URL（已是完整的 TOS URL）
- 直接展示 TOS 上的图片
- 无需额外修改

## TOS URL 格式

### 公开访问 URL
```
https://{bucket}.tos-{region}.volces.com/{key}

示例:
https://imagehouse1.tos-cn-beijing.volces.com/loveshow/user123/1234567890_abc123.jpg
```

### CDN 加速（可选）
如果配置了 `NEXT_PUBLIC_CDN_BASE_URL`，将使用 CDN 域名：
```
https://cdn.example.com/loveshow/user123/1234567890_abc123.jpg
```

## 存储模式切换

### 切换到 TOS 存储
```env
FILE_STORE_MODE=tos
```

### 切换到本地存储（开发调试用）
```env
FILE_STORE_MODE=local
```

## 注意事项

1. **TOS Bucket 权限**: 确保 Bucket 设置为公开读取，或者使用预签名 URL 访问
2. **CORS 配置**: 如果前端直接上传，需要在 TOS 控制台配置 CORS 规则
3. **成本优化**: 建议配置 CDN 加速和生命周期规则
4. **文件组织**: 所有文件按 `loveshow/{userId}/` 路径组织，便于管理

## 测试验证

### 1. 检查 TOS 客户端初始化
启动服务器后，控制台应输出：
```
[S3 Client] Initializing TOS client
[S3 Client] Region: cn-beijing
[S3 Client] Endpoint: https://tos-cn-beijing.volces.com
[S3 Client] Bucket: imagehouse1
```

### 2. 测试照片生成
1. 访问 http://localhost:3000/workspace
2. 上传一张参考图
3. 点击生成证件照
4. 检查生成的图片 URL 是否为 TOS 地址

### 3. 检查作品库
1. 访问 http://localhost:3000/gallery
2. 确认图片正常加载
3. 右键查看图片地址，应为 TOS URL

## 故障排查

### 问题：上传图片失败
- 检查 TOS 凭证是否正确
- 检查网络连接是否能访问 `tos-cn-beijing.volces.com`
- 查看控制台错误日志

###问题：图片无法访问
- 检查 Bucket 是否设置为公开读取
- 检查文件路径是否正确
- 尝试使用预签名 URL 访问

### 问题：切换到本地模式
- 修改 `.env.local` 中的 `FILE_STORE_MODE=local`
- 重启开发服务器
- 新生成的图片将保存到本地

## 参考项目

实现参考了 `imagehouse` 项目中的 TOS 集成方案：
- `imagehouse/src/lib/s3.ts` - S3/TOS 客户端配置
- `imagehouse/src/lib/tos-upload.ts` - TOS 上传实现
- `imagehouse/src/lib/tos-presign.ts` - TOS 预签名 URL 生成
