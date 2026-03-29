const { unlink, readdir } = require('fs/promises');
const { join } = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanup() {
  console.log('[cleanup] sweep started...');
  
  try {
    const expired = await prisma.file.findMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    console.log(`[cleanup] Found ${expired.length} expired records.`);

    for (const f of expired) {
      const filePath = join(process.cwd(), 'uploads', f.path);
      try {
        await unlink(filePath);
        console.log(`[cleanup] Deleted file: ${f.filename} (${f.id})`);
      } catch (err) {
        console.warn(`[cleanup] File not found or already deleted: ${f.path}`);
      }
      
      await prisma.file.delete({ where: { id: f.id } });
      console.log(`[cleanup] Removed DB record: ${f.id}`);
    }

    console.log('[cleanup] sweep finished.');
  } catch (err) {
    console.error('[cleanup] Fatal error during sweep:', err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
