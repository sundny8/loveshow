import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, redeemCodes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

// LoveShow pricing tiers (zh CNY)
const PLAN_POINTS: Record<string, number> = {
  creator: 300,
  enthusiast: 700,
  studio: 1500,
};

const PLAN_SALTS: Record<string, string> = {
  creator: '¥29.9',
  enthusiast: '¥49.9',
  studio: '¥99.9',
};

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const me = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!me.length || me[0].role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { userId: session.user.id };
}

export async function GET() {
  try {
    const guard = await requireAdmin();
    if ('error' in guard) return guard.error;

    const codes = await db
      .select({
        id: redeemCodes.id,
        code: redeemCodes.code,
        planType: redeemCodes.planType,
        points: redeemCodes.points,
        isUsed: redeemCodes.isUsed,
        usedAt: redeemCodes.usedAt,
        createdAt: redeemCodes.createdAt,
        usedByName: users.name,
        usedByEmail: users.email,
      })
      .from(redeemCodes)
      .leftJoin(users, eq(redeemCodes.usedBy, users.id))
      .orderBy(desc(redeemCodes.createdAt));

    return NextResponse.json(codes);
  } catch (error) {
    console.error('Error fetching codes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if ('error' in guard) return guard.error;

    const { planType, count = 10 } = await request.json();
    const salt = PLAN_SALTS[planType];
    const points = PLAN_POINTS[planType];

    if (!salt || !points) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const batchSize = Math.min(Math.max(1, Number(count)), 50);
    const newCodes = [];

    for (let i = 0; i < batchSize; i++) {
      const seed = nanoid(24);
      const hash = crypto
        .createHash('sha256')
        .update(seed + salt + Date.now() + i)
        .digest('hex')
        .slice(0, 32);
      const code = hash.toUpperCase();

      const newCode = {
        id: nanoid(),
        code,
        planType,
        points,
        isUsed: false,
        createdAt: new Date(),
      };

      await db.insert(redeemCodes).values(newCode);
      newCodes.push(newCode);
    }

    return NextResponse.json(newCodes);
  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
