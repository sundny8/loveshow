import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

// GET organization members
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is a member of this org
    const role = await getUserOrgRole(session.user.id, id);
    if (!role) {
      return NextResponse.json({ error: 'You are not a member of this organization' }, { status: 403 });
    }

    // Get all members with user details
    const membersData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: organizationMembers.role,
        joinedAt: organizationMembers.createdAt,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.organizationId, id));

    return NextResponse.json({
      members: membersData.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        image: m.image,
        role: m.role,
        joinedAt: m.joinedAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
