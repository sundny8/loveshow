import { promises as fs } from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { uploadToStorage } from '@/lib/storage/s3';
import { r2Put, r2PublicUrl } from '@/lib/r2-storage';

const STORAGE_DIR =
  process.env.PHOTO_STORAGE_DIR || path.join(process.cwd(), 'public', 'uploads');

export interface StoredImage {
  id: string;
  url: string;       // public url, eg /uploads/abc.jpg or https://bucket.tos-xxx.volces.com/xxx
  absPath: string;   // fs path (仅 local 模式)
  key?: string;      // 对象 key（tos / r2 模式）
}

/**
 * 存储模式：GENERATED_IMAGE_STORE_MODE 优先，回退 FILE_STORE_MODE，再回退 local
 * 支持 tos / r2 / local 三种模式
 */
export function getStoreMode(): 'tos' | 'r2' | 'local' {
  const mode = (
    process.env.GENERATED_IMAGE_STORE_MODE ||
    process.env.FILE_STORE_MODE ||
    'local'
  ).toLowerCase();
  if (mode === 'tos') return 'tos';
  if (mode === 'r2') return 'r2';
  return 'local';
}

export async function ensureStorage(): Promise<void> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

const MIME_BY_EXT: Record<'jpg' | 'png', string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
};

async function persistToTos(
  buffer: Buffer,
  ext: 'jpg' | 'png',
  id: string,
  userId?: string
): Promise<StoredImage> {
  const fileName = `${id}.${ext}`;
  const key = userId ? `loveshow/${userId}/${fileName}` : `loveshow/${fileName}`;
  const url = await uploadToStorage(key, buffer, MIME_BY_EXT[ext]);
  return {
    id,
    url,
    absPath: '',
    key,
  };
}

async function persistToR2(
  buffer: Buffer,
  ext: 'jpg' | 'png',
  id: string,
  userId?: string
): Promise<StoredImage> {
  const fileName = `${id}.${ext}`;
  const key = userId ? `generated/${userId}/${fileName}` : `generated/${fileName}`;
  await r2Put(key, buffer, MIME_BY_EXT[ext]);
  return {
    id,
    url: r2PublicUrl(key),
    absPath: '',
    key,
  };
}

async function persistToLocal(
  buffer: Buffer,
  ext: 'jpg' | 'png',
  id: string
): Promise<StoredImage> {
  await ensureStorage();
  const fileName = `${id}.${ext}`;
  const absPath = path.join(STORAGE_DIR, fileName);
  await fs.writeFile(absPath, buffer);
  // storage dir 约定位于 public/uploads → url 直接走 /uploads/*
  return {
    id,
    url: `/uploads/${fileName}`,
    absPath,
  };
}

export async function persistImage(
  buffer: Buffer,
  ext: 'jpg' | 'png' = 'jpg',
  userId?: string
): Promise<StoredImage> {
  const id = `${Date.now()}_${nanoid(8)}`;
  const mode = getStoreMode();

  if (mode === 'tos') {
    return await persistToTos(buffer, ext, id, userId);
  }

  if (mode === 'r2') {
    try {
      return await persistToR2(buffer, ext, id, userId);
    } catch (err) {
      // R2 失败时回退到本地，保证生成流程不中断
      console.warn('[storage] R2 upload failed, falling back to local:', err);
      return await persistToLocal(buffer, ext, id);
    }
  }

  return await persistToLocal(buffer, ext, id);
}

/**
 * 通用文件持久化（音频、封面等任意类型），遵循 tos / r2 / local 存储模式。
 * @param buffer   文件内容
 * @param fileName 文件名（含扩展名，如 abc.mp3）
 * @param mimeType MIME 类型（如 audio/mpeg）
 * @param userId   可选，用于按用户组织目录
 * @param subdir   可选子目录（如 music）
 */
export async function persistFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  userId?: string,
  subdir?: string
): Promise<StoredImage> {
  const id = fileName.replace(/\.[^.]+$/, '');
  const mode = getStoreMode();
  const parts = [subdir, userId, fileName].filter(Boolean);

  if (mode === 'tos') {
    const key = `loveshow/${parts.join('/')}`;
    const url = await uploadToStorage(key, buffer, mimeType);
    return { id, url, absPath: '', key };
  }

  if (mode === 'r2') {
    try {
      const key = `generated/${parts.join('/')}`;
      await r2Put(key, buffer, mimeType);
      return { id, url: r2PublicUrl(key), absPath: '', key };
    } catch (err) {
      console.warn('[storage] R2 upload failed, falling back to local:', err);
    }
  }

  // local 模式或 R2 失败回退：写入 uploads 目录（扁平存储）
  await ensureStorage();
  const absPath = path.join(STORAGE_DIR, fileName);
  await fs.writeFile(absPath, buffer);
  return { id, url: `/uploads/${fileName}`, absPath };
}
