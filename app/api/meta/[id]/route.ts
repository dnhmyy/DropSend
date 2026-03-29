import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const SAFE_ID = /^[a-z0-9]+$/i;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!SAFE_ID.test(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const expired = file.expiresAt ? file.expiresAt < new Date() : false;

  return NextResponse.json({
    id:        file.id,
    filename:  file.filename,
    size:      file.size,
    mimeType:  file.mimeType,
    expiresAt: file.expiresAt?.toISOString() ?? null,
    createdAt: file.createdAt.toISOString(),
    downloads: file.downloads,
    expired,
  });
}
