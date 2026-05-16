import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, invitations, organizations, organizationMembers } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET all invitations (admin only)
export async function GET() {
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

    // Get all invitations with organization and inviter details
    const invitationsList = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        token: invitations.token,
        organizationId: invitations.organizationId,
        invitedBy: invitations.invitedBy,
        expiresAt: invitations.expiresAt,
        createdAt: invitations.createdAt,
      })
      .from(invitations)
      .orderBy(desc(invitations.createdAt));

    // Get organization names
    const orgIds = [...new Set(invitationsList.map(i => i.organizationId))];
    const orgsData: { id: string; name: string }[] = [];
    for (const orgId of orgIds) {
      const org = await db
        .select({ id: organizations.id, name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
      if (org.length) {
        orgsData.push(org[0]);
      }
    }
    const orgMap = new Map(orgsData.map(o => [o.id, o.name]));

    // Get inviter names
    const inviterIds = [...new Set(invitationsList.map(i => i.invitedBy))];
    const invitersData: { id: string; name: string }[] = [];
    for (const userId of inviterIds) {
      const user = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (user.length) {
        invitersData.push(user[0]);
      }
    }
    const inviterMap = new Map(invitersData.map(u => [u.id, u.name]));

    return NextResponse.json({
      invitations: invitationsList.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        token: inv.token,
        organizationId: inv.organizationId,
        organizationName: orgMap.get(inv.organizationId) || 'Unknown',
        invitedByName: inviterMap.get(inv.invitedBy) || 'Unknown',
        expiresAt: inv.expiresAt?.toISOString(),
        createdAt: inv.createdAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// CREATE invitation (admin only)
export async function POST(request: Request) {
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

    const body = await request.json();
    const { email, organizationId, role } = body;

    if (!email || !organizationId) {
      return NextResponse.json({ error: 'Email and organization are required' }, { status: 400 });
    }

    // Validate organization exists
    const org = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!org.length) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user already member
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
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.userId, existingUser[0].id)
          )
        )
        .limit(1);

      if (existingMember.length > 0) {
        return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 });
      }
    }

    // Check existing pending invitation
    const existingInvite = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(
          eq(invitations.organizationId, organizationId),
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
        organizationId,
        role: role || 'member',
        token,
        status: 'pending',
        invitedBy: session.user.id,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({
      message: 'Invitation created successfully',
      invitation: newInvitation[0],
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
