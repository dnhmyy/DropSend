import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// in-memory rate limiter (use redis for production)
const buckets = new Map<string, { count: number; lastReset: number }>();

const LIMITS = {
  upload:   10,  // 10 per 10 mins
  download: 100, // 100 per 10 mins
  meta:     150,
  cleanup:  10,
};

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function getRateLimit(ip: string, type: keyof typeof LIMITS) {
  const key = `${ip}:${type}`;
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, lastReset: now };

  if (now - bucket.lastReset > WINDOW_MS) {
    bucket.count = 1;
    bucket.lastReset = now;
  } else {
    bucket.count++;
  }

  buckets.set(key, bucket);
  return bucket.count <= LIMITS[type];
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // rate limit api routes only
  if (
    pathname.startsWith('/api/upload') ||
    pathname.startsWith('/api/file') ||
    pathname.startsWith('/api/meta') ||
    pathname.startsWith('/api/cleanup')
  ) {
    // get ip from proxy or fallback
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';

    const type = pathname.startsWith('/api/upload')
      ? 'upload'
      : pathname.startsWith('/api/file')
        ? 'download'
        : pathname.startsWith('/api/meta')
          ? 'meta'
          : 'cleanup';
    
    if (!getRateLimit(ip, type)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 } 
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/upload/:path*', '/api/file/:path*', '/api/meta/:path*', '/api/cleanup/:path*'],
};
