import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  let response = NextResponse.next();

  if (request.nextUrl.pathname.startsWith('/api/resourcing')) {
    const newUrl = new URL(request.url);
    newUrl.pathname = request.nextUrl.pathname.replace(
      '/api/resourcing',
      '/resourcing/api/resourcing'
    );

    response = NextResponse.rewrite(newUrl);

    return response;
  }

  return response;
}
