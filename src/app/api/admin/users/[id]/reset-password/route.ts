import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, scrypt } from 'crypto';

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const currentUser = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!currentUser.length || currentUser[0].role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session, userId: session.user.id };
}

function generateKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, key) => err ? reject(err) : resolve(key)
    );
  });
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await generateKey(password, salt);
  return `${salt}:${key.toString('hex')}`;
}

// POST /api/admin/users/[id]/reset-password - Reset user password
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;

    // Get user email
    const userResult = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const email = userResult[0].email;
    const newPassword = '*Asdf9527';
    const hashedPassword = await hashPassword(newPassword);

    // Update or create account password
    const existingAccount = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.userId, id))
      .limit(1);

    if (existingAccount.length > 0) {
      await db
        .update(accounts)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(accounts.userId, id));
    } else {
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: email,
        providerId: 'credential',
        userId: id,
        password: hashedPassword,
      });
    }

    return NextResponse.json({
      message: `密码已重置为: ${newPassword}`,
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
