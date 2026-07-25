import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { r2Get } from '@/lib/r2-storage';

export const runtime = 'nodejs';

const STORAGE_DIR =
  process.env.PHOTO_STORAGE_DIR || path.join(process.cwd(), 'public', 'uploads');

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
};

/**
 * GET /api/generated/[...path]
 * R2 图片代理（当未配置 R2_PUBLIC_URL 或使用私有桶时兜底）。
 * 支持嵌套 key：/api/generated/<userId>/<fileName> → R2 generated/<userId>/<fileName>
 * 回退链：R2 (generated/<...path>) → 本地 uploads 目录（仅取最后一段文件名）。
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  if (
    !segments ||
    segments.length === 0 ||
    segments.some((s) => !s || s.includes('..') || s.includes('\\'))
  ) {
    return NextResponse.json({ error: 'invalid path' }, { status: 400 });
  }

  const key = `generated/${segments.join('/')}`;
  const fileName = segments[segments.length - 1];
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const fallbackContentType = CONTENT_TYPE_BY_EXT[ext] || 'application/octet-stream';

  // 1. 尝试从 R2 读取
  try {
    const obj = await r2Get(key);
    if (obj) {
      return new NextResponse(obj.buffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': obj.contentType || fallbackContentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  } catch (err) {
    console.warn('[api/generated] R2 read failed:', err);
  }

  // 2. 回退到本地 uploads 目录（本地模式扁平存储，仅取文件名）
  try {
    const absPath = path.join(STORAGE_DIR, fileName);
    const buffer = await fs.readFile(absPath);
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': fallbackContentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
}
