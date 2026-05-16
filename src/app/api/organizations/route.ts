import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { organizations, organizationMembers } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET user's organizations
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organizations where user is a member
    const memberOrgs = await db
      .select({
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, session.user.id));

    if (memberOrgs.length === 0) {
      return NextResponse.json({ organizations: [] });
    }

    const orgIds = memberOrgs.map(m => m.organizationId);
    const roleMap = new Map(memberOrgs.map(m => [m.organizationId, m.role]));

    // Get all orgs by iterating (since we can't do IN clause easily)
    const allOrgs = [];
    for (const orgId of orgIds) {
      const org = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          logo: organizations.logo,
          createdAt: organizations.createdAt,
        })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
      
      if (org.length > 0) {
        allOrgs.push(org[0]);
      }
    }

    // Get member counts
    const memberCounts = await db
      .select({
        organizationId: organizationMembers.organizationId,
        count: count(),
      })
      .from(organizationMembers)
      .groupBy(organizationMembers.organizationId);

    const memberCountMap = new Map(memberCounts.map(m => [m.organizationId, m.count]));

    return NextResponse.json({
      organizations: allOrgs.map(org => ({
        ...org,
        role: roleMap.get(org.id) || 'member',
        memberCount: memberCountMap.get(org.id) || 0,
        createdAt: org.createdAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// CREATE organization
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, body.slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'An organization with this slug already exists' }, { status: 400 });
    }

    const now = new Date();
    const orgId = nanoid();

    // Create organization
    const newOrg = await db
      .insert(organizations)
      .values({
        id: orgId,
        name: body.name,
        slug: body.slug,
        logo: body.logo || null,
        ownerId: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Add creator as owner member
    await db.insert(organizationMembers).values({
      id: nanoid(),
      organizationId: orgId,
      userId: session.user.id,
      role: 'owner',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      message: 'Organization created successfully',
      organization: newOrg[0],
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
