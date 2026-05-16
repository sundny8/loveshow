import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Leave organization
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is a member
    const member = await db
      .select({ 
        id: organizationMembers.id,
        role: organizationMembers.role 
      })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, id),
          eq(organizationMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!member.length) {
      return NextResponse.json({ error: 'You are not a member of this organization' }, { status: 400 });
    }

    // Owner cannot leave - must transfer ownership first
    if (member[0].role === 'owner') {
      return NextResponse.json({ 
        error: 'Organization owners cannot leave. Transfer ownership first or delete the organization.' 
      }, { status: 400 });
    }

    // Remove user from organization
    await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, id),
          eq(organizationMembers.userId, session.user.id)
        )
      );

    return NextResponse.json({
      message: 'Successfully left the organization',
    });
  } catch (error) {
    console.error('Error leaving organization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
