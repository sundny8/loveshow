import { NextResponse } from 'next/server';
import { PHOTO_SPECS } from '@/lib/photo/specs';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ specs: PHOTO_SPECS });
}
