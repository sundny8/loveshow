import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { organizations, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Transfer ownership to another member
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if current user is owner
    const currentMember = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, id),
          eq(organizationMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!currentMember.length || currentMember[0].role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can transfer ownership' }, { status: 403 });
    }

    const body = await request.json();
    const { newOwnerId } = body;

    if (!newOwnerId) {
      return NextResponse.json({ error: 'New owner ID is required' }, { status: 400 });
    }

    if (newOwnerId === session.user.id) {
      return NextResponse.json({ error: 'You are already the owner' }, { status: 400 });
    }

    // Check if new owner is a member
    const newOwnerMember = await db
      .select({ id: organizationMembers.id, role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, id),
          eq(organizationMembers.userId, newOwnerId)
        )
      )
      .limit(1);

    if (!newOwnerMember.length) {
      return NextResponse.json({ error: 'User is not a member of this organization' }, { status: 400 });
    }

    const now = new Date();

    // Update old owner to admin
    await db
      .update(organizationMembers)
      .set({ 
        role: 'admin', 
        updatedAt: now 
      })
      .where(
        and(
          eq(organizationMembers.organizationId, id),
          eq(organizationMembers.userId, session.user.id)
        )
      );

    // Update new owner
    await db
      .update(organizationMembers)
      .set({ 
        role: 'owner', 
        updatedAt: now 
      })
      .where(
        and(
          eq(organizationMembers.organizationId, id),
          eq(organizationMembers.userId, newOwnerId)
        )
      );

    // Update organization ownerId
    await db
      .update(organizations)
      .set({ 
        ownerId: newOwnerId, 
        updatedAt: now 
      })
      .where(eq(organizations.id, id));

    return NextResponse.json({
      message: 'Ownership transferred successfully',
    });
  } catch (error) {
    console.error('Error transferring ownership:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
