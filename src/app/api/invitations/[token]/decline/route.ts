import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// POST decline invitation (no auth required - anyone with token can decline)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    // Get invitation
    const invitation = await db
      .select({
        id: invitations.id,
        status: invitations.status,
      })
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (!invitation.length) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const inv = invitation[0];

    // Check if already processed
    if (inv.status !== 'pending') {
      return NextResponse.json({ 
        error: 'This invitation has already been processed' 
      }, { status: 400 });
    }

    // Update invitation status to revoked (declined)
    await db
      .update(invitations)
      .set({ 
        status: 'revoked', 
        updatedAt: new Date() 
      })
      .where(eq(invitations.id, inv.id));

    return NextResponse.json({
      message: 'Invitation declined successfully',
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
