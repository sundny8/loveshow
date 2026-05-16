import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { invitations, organizationMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface RouteParams {
  params: Promise<{ id: string }>;
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

// GET invitations for organization
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is owner or admin
    const role = await getUserOrgRole(session.user.id, id);
    if (!role || (role !== 'owner' && role !== 'admin')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get all invitations
    const invitationsList = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        createdAt: invitations.createdAt,
      })
      .from(invitations)
      .where(eq(invitations.organizationId, id));

    return NextResponse.json({
      invitations: invitationsList.map(inv => ({
        ...inv,
        expiresAt: inv.expiresAt?.toISOString(),
        createdAt: inv.createdAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// CREATE invitation
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is owner or admin
    const myRole = await getUserOrgRole(session.user.id, id);
    if (!myRole || (myRole !== 'owner' && myRole !== 'admin')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['admin', 'member', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Admin cannot invite admins
    if (myRole === 'admin' && role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot invite other admins' }, { status: 403 });
    }

    // Check if user is already a member
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      const existingMember = await db
        .select({ id: organizationMembers.id })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, id),
            eq(organizationMembers.userId, existingUser[0].id)
          )
        )
        .limit(1);

      if (existingMember.length > 0) {
        return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 });
      }
    }

    // Check if there's already a pending invitation
    const existingInvite = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(
          eq(invitations.organizationId, id),
          eq(invitations.email, email),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvite.length > 0) {
      return NextResponse.json({ error: 'An invitation has already been sent to this email' }, { status: 400 });
    }

    // Create invitation
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const token = nanoid(32);

    const newInvitation = await db
      .insert(invitations)
      .values({
        id: nanoid(),
        email,
        organizationId: id,
        role: role || 'member',
        token,
        status: 'pending',
        invitedBy: session.user.id,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // TODO: Send invitation email
    // await sendInvitationEmail(email, token, organizationName);

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation: {
        ...newInvitation[0],
        expiresAt: newInvitation[0].expiresAt.toISOString(),
        createdAt: newInvitation[0].createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
