import { promises as fs } from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { uploadToStorage } from '@/lib/storage/s3';

const STORAGE_DIR =
  process.env.PHOTO_STORAGE_DIR || path.join(process.cwd(), 'public', 'uploads');

// 存储模式：tos 或 local
const STORAGE_MODE = process.env.FILE_STORE_MODE || 'local';

export interface StoredImage {
  id: string;
  url: string;       // public url, eg /uploads/abc.jpg or https://bucket.tos-xxx.volces.com/xxx
  absPath: string;   // fs path (仅 local 模式)
  key?: string;      // TOS object key (仅 tos 模式)
}

export async function ensureStorage(): Promise<void> {
  if (STORAGE_MODE === 'local') {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

export async function persistImage(
  buffer: Buffer,
  ext: 'jpg' | 'png' = 'jpg',
  userId?: string
): Promise<StoredImage> {
  const id = `${Date.now()}_${nanoid(8)}`;
  const fileName = `${id}.${ext}`;

  if (STORAGE_MODE === 'tos') {
    // TOS 存储模式
    const key = userId ? `loveshow/${userId}/${fileName}` : `loveshow/${fileName}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    
    const url = await uploadToStorage(key, buffer, contentType);
    
    return {
      id,
      url,
      absPath: '',
      key,
    };
  } else {
    // 本地存储模式
    await ensureStorage();
    const absPath = path.join(STORAGE_DIR, fileName);
    await fs.writeFile(absPath, buffer);
    // storage dir 约定位于 public/uploads → url 直接走 /uploads/*
    return {
      id,
      url: `/uploads/${fileName}`,
      absPath,
    };
  }
}
