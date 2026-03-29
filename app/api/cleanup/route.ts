import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { cleanupExpiredFiles } from '@/lib/cleanup';

export const runtime = 'nodejs';

function safeCompare(secret: string, provided: string) {
  const left = Buffer.from(secret);
  const right = Buffer.from(provided);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function getProvidedSecret(req: NextRequest) {
  const bearer = req.headers.get('authorization');
  if (bearer?.startsWith('Bearer ')) {
    return bearer.slice('Bearer '.length).trim();
  }

  return req.headers.get('x-cleanup-secret')?.trim() ?? '';
}

export async function POST(req: NextRequest) {
  const secret = process.env.CLEANUP_SECRET?.trim();
  const provided = getProvidedSecret(req);

  if (!secret || !provided || !safeCompare(secret, provided)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deleted = await cleanupExpiredFiles();
  return NextResponse.json({ deleted, ok: true });
}
