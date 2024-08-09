import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('hostname');
  console.log(process.env.HOSTNAME);

  console.log('call1');
  console.log(request.url);
  console.log(request.nextUrl.pathname);
  console.log('');

  let response;

  if (request.nextUrl.pathname.startsWith('/api/resourcing')) {
    const newUrl = new URL(request.url);
    newUrl.pathname = request.nextUrl.pathname.replace(
      '/api/resourcing',
      '/resourcing/api/resourcing'
    );

    response = NextResponse.rewrite(newUrl);

    console.log('call3');
    console.log(response);
    console.log('');

    return response;
  }

  console.log('call2');

  console.log(request.url);
  console.log(request.nextUrl.pathname);
  console.log();

  response = NextResponse.next();

  console.log('call4');
  console.log(response);
  console.log();

  return response;
}
