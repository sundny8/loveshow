import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, organizations, organizationMembers } from '@/db/schema';
import { eq, like, desc, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET all organizations
export async function GET(request: Request) {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Build query
    const whereClause = search ? like(organizations.name, `%${search}%`) : undefined;

    // Get organizations with owner info and member count
    const orgList = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        ownerId: organizations.ownerId,
        ownerName: users.name,
        ownerEmail: users.email,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.ownerId, users.id))
      .where(whereClause)
      .orderBy(desc(organizations.createdAt));

    // Get member counts for each organization
    const memberCounts = await db
      .select({
        organizationId: organizationMembers.organizationId,
        count: count(),
      })
      .from(organizationMembers)
      .groupBy(organizationMembers.organizationId);

    const memberCountMap = new Map(memberCounts.map(m => [m.organizationId, m.count]));

    // Get total stats
    const totalOrgs = await db.select({ count: count() }).from(organizations);
    const totalMembers = await db.select({ count: count() }).from(organizationMembers);

    return NextResponse.json({
      organizations: orgList.map(org => ({
        ...org,
        memberCount: memberCountMap.get(org.id) || 0,
        createdAt: org.createdAt?.toISOString(),
        updatedAt: org.updatedAt?.toISOString(),
      })),
      stats: {
        total: totalOrgs[0].count,
        totalMembers: totalMembers[0].count,
      },
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Create new organization
export async function POST(request: Request) {
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
