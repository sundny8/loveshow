import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { TosClient, TosClientError, TosServerError } from "@volcengine/tos-sdk";

// 支持多种存储服务：AWS S3, Cloudflare R2, 火山引擎 TOS
const storageType = process.env.STORAGE_TYPE || "tos"; // 's3' | 'r2' | 'tos'

// ============================================================
// 火山引擎 TOS 官方 SDK 客户端（签名与服务端完全兼容，推荐）
// ============================================================
let _tosClient: TosClient | null = null;

function getTosClient(): TosClient {
  if (_tosClient) return _tosClient;

  const region = process.env.AWS_REGION || "cn-beijing";
  // 注意：官方 TOS SDK 的 endpoint 不能包含协议前缀 (https://)
  // 否则会被误识别为主机名的一部分，导致 ENOTFOUND
  const rawEndpoint = process.env.AWS_S3_ENDPOINT || `tos-${region}.volces.com`;
  const endpoint = rawEndpoint.replace(/^https?:\/\//i, "");
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
  const accessKeySecret = process.env.AWS_SECRET_ACCESS_KEY || "";

  console.log("[TOS Client] Initializing official VolcEngine TOS client");
  console.log("[TOS Client] Region:", region);
  console.log("[TOS Client] Endpoint (normalized):", endpoint);
  console.log("[TOS Client] Bucket:", process.env.AWS_S3_BUCKET);

  _tosClient = new TosClient({
    accessKeyId,
    accessKeySecret,
    region,
    endpoint,
    secure: true, // 使用 HTTPS
  });

  return _tosClient;
}

// ============================================================
// AWS S3 兼容客户端（仅用于 S3 / R2 / 回退场景）
// ============================================================
const getS3Client = () => {
  const baseConfig = {
    region: process.env.AWS_REGION || "auto",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  };

  if (storageType === "tos") {
    const region = process.env.AWS_REGION || "cn-beijing";
    const endpoint = process.env.AWS_S3_ENDPOINT || `https://tos-${region}.volces.com`;

    return new S3Client({
      ...baseConfig,
      region,
      endpoint,
      forcePathStyle: true,
      tls: true,
      maxAttempts: 3,
    });
  }

  if (storageType === "r2") {
    return new S3Client({
      ...baseConfig,
      endpoint: process.env.AWS_S3_ENDPOINT,
      forcePathStyle: false,
    });
  }

  return new S3Client({
    ...baseConfig,
    endpoint: process.env.AWS_S3_ENDPOINT,
  });
};

export const s3Client = getS3Client();

/**
 * 获取公开访问 URL（如果桶配置为公开读取）
 */
export function getPublicUrl(key: string) {
  if (process.env.NEXT_PUBLIC_CDN_BASE_URL) {
    return `${process.env.NEXT_PUBLIC_CDN_BASE_URL}/${key}`;
  }

  const bucket = process.env.AWS_S3_BUCKET || "";
  const region = process.env.AWS_REGION || "cn-beijing";

  switch (storageType) {
    case "tos":
      return `https://${bucket}.tos-${region}.volces.com/${key}`;
    case "r2":
      return `https://pub-${bucket}.r2.dev/${key}`;
    case "s3":
    default:
      return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}

/**
 * 直接上传 Buffer 到存储
 * - TOS：使用官方 SDK 的 putObject（推荐，签名完全兼容）
 * - S3/R2：使用 AWS SDK 的 PutObjectCommand
 */
export async function uploadToStorage(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (storageType === "tos") {
    const client = getTosClient();
    const bucket = process.env.AWS_S3_BUCKET || "";

    try {
      console.log("[TOS] Uploading:", key, "bucket:", bucket, "size:", body.length);
      await client.putObject({
        bucket,
        key,
        body,
        contentType,
      });
      console.log("[TOS] Upload succeeded:", key);
      return getPublicUrl(key);
    } catch (error: any) {
      if (error instanceof TosClientError) {
        console.error("[TOS] Client error:", error.message);
      } else if (error instanceof TosServerError) {
        console.error(
          "[TOS] Server error:",
          "code=", error.code,
          "message=", error.message,
          "requestId=", error.requestId,
          "statusCode=", error.statusCode
        );
      } else {
        console.error("[TOS] Upload failed (unknown):", error);
      }
      throw error;
    }
  }

  // 非 TOS：使用 AWS SDK
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await s3Client.send(command);
    console.log("[S3] Uploaded file to:", key);
    return getPublicUrl(key);
  } catch (error: any) {
    console.error("[S3] Upload failed:", error);
    throw error;
  }
}
