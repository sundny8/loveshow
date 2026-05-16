import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string; memberId: string }>;
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

// UPDATE member role
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, memberId } = await params;

    // Check if user is owner or admin
    const myRole = await getUserOrgRole(session.user.id, id);
    if (!myRole || (myRole !== 'owner' && myRole !== 'admin')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get target member's current role
    const targetMember = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, id),
          eq(organizationMembers.userId, memberId)
        )
      )
      .limit(1);

    if (!targetMember.length) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot change owner's role
    if (targetMember[0].role === 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });
    }

    const body = await request.json();
    const { role } = body;

    // Validate role
    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Admin can only assign member/viewer roles
    if (myRole === 'admin' && role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot promote to admin' }, { status: 403 });
    }

    // Update member role
    await db
      .update(organizationMembers)
      .set({ 
        role, 
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(organizationMembers.organizationId, id),
          eq(organizationMembers.userId, memberId)
        )
      );

    return NextResponse.json({
      message: 'Member role updated successfully',
    });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE member from organization
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, memberId } = await params;

    // Check if user is owner or admin
    const myRole = await getUserOrgRole(session.user.id, id);
    if (!myRole || (myRole !== 'owner' && myRole !== 'admin')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get target member's current role
    const targetMember = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, id),
          eq(organizationMembers.userId, memberId)
        )
      )
      .limit(1);

    if (!targetMember.length) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot remove owner
    if (targetMember[0].role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove organization owner' }, { status: 400 });
    }

    // Admin cannot remove other admins
    if (myRole === 'admin' && targetMember[0].role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot remove other admins' }, { status: 403 });
    }

    // Remove member
    await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, id),
          eq(organizationMembers.userId, memberId)
        )
      );

    return NextResponse.json({
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
