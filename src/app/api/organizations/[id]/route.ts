import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { organizations, organizationMembers } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

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

// GET organization details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is a member
    const role = await getUserOrgRole(session.user.id, id);
    if (!role) {
      return NextResponse.json({ error: 'You are not a member of this organization' }, { status: 403 });
    }

    // Get organization details
    const org = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        ownerId: organizations.ownerId,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (!org.length) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get member count
    const memberCount = await db
      .select({ count: count() })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, id));

    return NextResponse.json({
      organization: {
        ...org[0],
        role,
        memberCount: memberCount[0].count,
        createdAt: org[0].createdAt?.toISOString(),
        updatedAt: org[0].updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// UPDATE organization
export async function PUT(request: Request, { params }: RouteParams) {
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

    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.logo !== undefined) updateData.logo = body.logo;

    // Check if slug is being changed and already exists
    if (body.slug) {
      const existing = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, body.slug))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== id) {
        return NextResponse.json({ error: 'An organization with this slug already exists' }, { status: 400 });
      }
    }

    const updatedOrg = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id))
      .returning();

    if (!updatedOrg.length) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Organization updated successfully',
      organization: updatedOrg[0],
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE organization
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is owner
    const role = await getUserOrgRole(session.user.id, id);
    if (role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can delete this organization' }, { status: 403 });
    }

    // Delete organization (cascade will delete members)
    const deletedOrg = await db
      .delete(organizations)
      .where(eq(organizations.id, id))
      .returning();

    if (!deletedOrg.length) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
