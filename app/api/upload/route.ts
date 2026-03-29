import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const MAX_SIZE = 1024 * 1024 * 1024; // 1 GB

function getExpiresAt(exp: string): Date | null {
  const map: Record<string, number> = {
    '3600':   3600,
    '86400':  86400,
    '604800': 604800,
  };
  if (!map[exp]) return null;
  return new Date(Date.now() + map[exp] * 1000);
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const expiration = (form.get('expiration') as string) || 'never';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 1 GB limit' }, { status: 413 });
    }

    // generate safe 12-char id
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);

    // build stored filename with extension
    const rawExt = file.name.includes('.') ? file.name.split('.').pop()! : '';
    const safeExt = rawExt.replace(/[^a-z0-9]/gi, '').slice(0, 8);
    const storedName = safeExt ? `${id}.${safeExt}` : id;

    // write file to disk
    const uploadsDir = join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(join(uploadsDir, storedName), Buffer.from(bytes));

    // sanitize filename for storage/ui
    const sanitizedFilename = file.name
      .replace(/[<>:"/\\|?*]/g, '_')
      .slice(0, 255);

    // persist metadata to db
    const record = await prisma.file.create({
      data: {
        id,
        filename: sanitizedFilename,
        path: storedName,
        size: file.size,
        mimeType: file.type || null,
        expiresAt: getExpiresAt(expiration),
      },
    });

    return NextResponse.json({
      id: record.id,
      filename: record.filename,
      size: record.size,
      expiresAt: record.expiresAt?.toISOString() ?? null,
      url: `/download/${record.id}`,
    });
  } catch (err) {
    console.error('[upload] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
