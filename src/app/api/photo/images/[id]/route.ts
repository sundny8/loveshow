import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, generatedImages } from '@/db';

export const runtime = 'nodejs';

/**
 * DELETE /api/photo/images/[id]
 * 软删除当前用户的一张生成图片（设置 isDeleted = true）。
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [img] = await db
    .select({ id: generatedImages.id, userId: generatedImages.userId })
    .from(generatedImages)
    .where(and(eq(generatedImages.id, id), eq(generatedImages.userId, session.user.id)))
    .limit(1);

  if (!img) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db
    .update(generatedImages)
    .set({ isDeleted: true })
    .where(eq(generatedImages.id, id));

  return NextResponse.json({ success: true });
}

