import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET all members of an organization
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser.length || (currentUser[0].role !== 'admin' && currentUser[0].role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Get members with user info
    const memberList = await db
      .select({
        id: organizationMembers.id,
        userId: organizationMembers.userId,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
        role: organizationMembers.role,
        createdAt: organizationMembers.createdAt,
      })
      .from(organizationMembers)
      .leftJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, id));

    return NextResponse.json({
      members: memberList.map(m => ({
        ...m,
        createdAt: m.createdAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Add member to organization
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser.length || (currentUser[0].role !== 'admin' && currentUser[0].role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate
    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const targetUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (!targetUser.length) {
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, id),
          eq(organizationMembers.userId, targetUser[0].id)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 });
    }

    // Add member
    const now = new Date();
    const newMember = await db
      .insert(organizationMembers)
      .values({
        id: nanoid(),
        organizationId: id,
        userId: targetUser[0].id,
        role: body.role || 'member',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({
      message: 'Member added successfully',
      member: newMember[0],
    });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
