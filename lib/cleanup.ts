import { unlink } from 'fs/promises';
import { join } from 'path';
import prisma from './prisma';

const SAFE_STORED_PATH = /^[a-z0-9._-]+$/i;

export async function cleanupExpiredFiles(): Promise<number> {
  const expired = await prisma.file.findMany({
    where: { expiresAt: { lt: new Date() } },
  });

  let count = 0;
  for (const f of expired) {
    if (!SAFE_STORED_PATH.test(f.path)) {
      await prisma.file.delete({ where: { id: f.id } });
      continue;
    }

    try {
      await unlink(join(process.cwd(), 'uploads', f.path));
    } catch {
      // likely already gone
    }
    await prisma.file.delete({ where: { id: f.id } });
    count++;
  }

  return count;
}
