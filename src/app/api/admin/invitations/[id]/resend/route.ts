import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Resend invitation (admin only)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const currentUser = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser.length || !['owner', 'admin'].includes(currentUser[0].role ?? '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    // Get invitation
    const invitation = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        status: invitations.status,
      })
      .from(invitations)
      .where(eq(invitations.id, id))
      .limit(1);

    if (!invitation.length) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation[0].status !== 'pending') {
      return NextResponse.json({ error: 'Only pending invitations can be resent' }, { status: 400 });
    }

    // Update invitation with new token and expiration
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const newToken = nanoid(32);

    await db
      .update(invitations)
      .set({
        token: newToken,
        expiresAt,
        updatedAt: now,
      })
      .where(eq(invitations.id, id));

    // TODO: Send invitation email
    // await sendInvitationEmail(invitation[0].email, newToken, organizationName);

    return NextResponse.json({
      message: 'Invitation resent successfully',
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
