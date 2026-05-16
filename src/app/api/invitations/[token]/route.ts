import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { invitations, organizations, organizationMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET invitation details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    // Get invitation with organization details
    const invitation = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        organizationId: invitations.organizationId,
        invitedBy: invitations.invitedBy,
      })
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (!invitation.length) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const inv = invitation[0];

    // Check if expired
    if (inv.status !== 'pending') {
      return NextResponse.json({ 
        error: inv.status === 'accepted' ? 'Invitation already accepted' : 'Invitation is no longer valid',
        status: inv.status,
      }, { status: 400 });
    }

    if (new Date(inv.expiresAt) < new Date()) {
      // Update status to expired
      await db
        .update(invitations)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(invitations.id, inv.id));
      
      return NextResponse.json({ error: 'Invitation has expired', status: 'expired' }, { status: 400 });
    }

    // Get organization details
    const org = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
      })
      .from(organizations)
      .where(eq(organizations.id, inv.organizationId))
      .limit(1);

    // Get inviter details
    const inviter = await db
      .select({
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, inv.invitedBy))
      .limit(1);

    return NextResponse.json({
      invitation: {
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt.toISOString(),
      },
      organization: org.length > 0 ? org[0] : null,
      invitedBy: inviter.length > 0 ? inviter[0] : null,
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST accept invitation
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to accept this invitation' }, { status: 401 });
    }

    const { token } = await params;

    // Get invitation
    const invitation = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        organizationId: invitations.organizationId,
      })
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (!invitation.length) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const inv = invitation[0];

    // Check if valid
    if (inv.status !== 'pending') {
      return NextResponse.json({ 
        error: inv.status === 'accepted' ? 'Invitation already accepted' : 'Invitation is no longer valid' 
      }, { status: 400 });
    }

    if (new Date(inv.expiresAt) < new Date()) {
      await db
        .update(invitations)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(invitations.id, inv.id));
      
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Verify email matches (optional - can remove this check to allow any logged in user)
    // if (session.user.email !== inv.email) {
    //   return NextResponse.json({ 
    //     error: 'This invitation was sent to a different email address' 
    //   }, { status: 400 });
    // }

    // Check if already a member
    const existingMember = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, inv.organizationId),
          eq(organizationMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json({ error: 'You are already a member of this organization' }, { status: 400 });
    }

    const now = new Date();

    // Add user to organization
    await db.insert(organizationMembers).values({
      id: nanoid(),
      organizationId: inv.organizationId,
      userId: session.user.id,
      role: inv.role,
      createdAt: now,
      updatedAt: now,
    });

    // Update invitation status
    await db
      .update(invitations)
      .set({ status: 'accepted', updatedAt: now })
      .where(eq(invitations.id, inv.id));

    // Get organization details for redirect
    const org = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, inv.organizationId))
      .limit(1);

    return NextResponse.json({
      message: 'Successfully joined the organization',
      organization: org.length > 0 ? org[0] : null,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
