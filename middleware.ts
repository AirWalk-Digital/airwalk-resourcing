import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/resourcing')) {
    return NextResponse.rewrite(new URL('/', request.url));
  }
  return NextResponse.next();
}
