/**
 * Cloudflare R2 对象存储工具
 * 使用 AWS SDK S3 兼容 API 操作 R2 存储桶
 *
 * 环境变量：
 *   R2_ACCOUNT_ID        - Cloudflare Account ID
 *   R2_ACCESS_KEY_ID     - R2 API Token Access Key
 *   R2_SECRET_ACCESS_KEY - R2 API Token Secret Key
 *   R2_BUCKET            - R2 存储桶名称
 *   R2_PUBLIC_URL        - R2 公开访问域名（自定义域名或 r2.dev 公开 URL）
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

function getR2Config() {
  return {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || '',
    publicUrl: process.env.R2_PUBLIC_URL || '', // e.g. https://img.yourdomain.com
  };
}

let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_r2Client) return _r2Client;

  const { accountId, accessKeyId, secretAccessKey } = getR2Config();
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      '[R2] Missing R2 configuration (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)'
    );
  }

  _r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return _r2Client;
}

/**
 * 上传文件到 R2
 * @param key 对象 key，例如 "generated/abc123.jpg"
 * @param buffer 文件内容
 * @param mimeType MIME 类型
 */
export async function r2Put(key: string, buffer: Buffer, mimeType: string): Promise<void> {
  const { bucket } = getR2Config();
  if (!bucket) throw new Error('[R2] Missing R2_BUCKET');

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  const startTime = Date.now();
  await client.send(command);
  const elapsed = Date.now() - startTime;
  console.log(`[R2] ✓ PUT ${key} (${(buffer.length / 1024).toFixed(1)} KB) in ${elapsed}ms`);
}

/**
 * 从 R2 下载文件
 * @param key 对象 key
 * @returns Buffer + contentType，失败返回 null
 */
export async function r2Get(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const { bucket } = getR2Config();
  if (!bucket) return null;

  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    const response = await client.send(command);
    if (!response.Body) return null;

    const arrayBuffer = await response.Body.transformToByteArray();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.ContentType || 'image/jpeg';
    return { buffer, contentType };
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    console.error(`[R2] GET failed: ${error.message} key=${key}`);
    return null;
  }
}

/**
 * 检查 R2 中对象是否存在
 */
export async function r2Exists(key: string): Promise<boolean> {
  const { bucket } = getR2Config();
  if (!bucket) return false;

  const client = getR2Client();
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取 R2 对象的公开访问 URL
 * 优先使用自定义域名 / r2.dev 公开 URL，否则回退到 API 代理路径
 */
export function r2PublicUrl(key: string): string {
  const { publicUrl } = getR2Config();
  if (publicUrl) {
    // 自定义域名：https://img.yourdomain.com/generated/xxx.jpg
    return `${publicUrl.replace(/\/$/, '')}/${key}`;
  }
  // 回退到 API 代理
  return `/api/generated/${key.replace(/^generated\//, '')}`;
}

/**
 * 判断 URL 是否属于当前 R2 存储
 */
export function isR2Url(url: string): boolean {
  const { publicUrl, accountId } = getR2Config();
  if (publicUrl && url.includes(publicUrl.replace('https://', '').replace('http://', ''))) {
    return true;
  }
  if (accountId && url.includes(`${accountId}.r2.cloudflarestorage.com`)) return true;
  return false;
}

/**
 * 判断当前是否已启用 R2（配置齐全）
 */
export function isR2Configured(): boolean {
  const { accountId, accessKeyId, secretAccessKey, bucket } = getR2Config();
  return Boolean(accountId && accessKeyId && secretAccessKey && bucket);
}
