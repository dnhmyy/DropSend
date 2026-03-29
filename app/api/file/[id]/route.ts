import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const SAFE_ID = /^[a-z0-9]+$/i;
const SAFE_STORED_PATH = /^[a-z0-9._-]+$/i;

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
  if (file.expiresAt && file.expiresAt < new Date()) {
    return NextResponse.json({ error: 'File has expired' }, { status: 410 });
  }

  // prevent path traversal (sanitized on upload)
  if (!SAFE_STORED_PATH.test(file.path)) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  const filePath = join(process.cwd(), 'uploads', file.path);

  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
  }

  // bump download counter
    prisma.file.update({ where: { id }, data: { downloads: { increment: 1 } } }).catch(() => {});

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': file.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'no-store',
    },
  });
}
