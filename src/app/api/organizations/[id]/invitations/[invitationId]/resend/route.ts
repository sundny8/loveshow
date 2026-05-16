import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { invitations, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface RouteParams {
  params: Promise<{ id: string; invitationId: string }>;
}

// Helper to check user's role in organization
async function getUserOrgRole(userId: string, orgId: string) {
  const member = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, userId)
      )
    )
    .limit(1);
  
  return member.length > 0 ? member[0].role : null;
}

// POST - Resend invitation
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, invitationId } = await params;

    // Check if user is owner or admin
    const role = await getUserOrgRole(session.user.id, id);
    if (!role || (role !== 'owner' && role !== 'admin')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Check if invitation exists and is pending
    const invitation = await db
      .select({ 
        id: invitations.id,
        email: invitations.email,
        organizationId: invitations.organizationId,
        status: invitations.status,
      })
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1);

    if (!invitation.length) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation[0].organizationId !== id) {
      return NextResponse.json({ error: 'Invitation does not belong to this organization' }, { status: 400 });
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
      .where(eq(invitations.id, invitationId));

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
