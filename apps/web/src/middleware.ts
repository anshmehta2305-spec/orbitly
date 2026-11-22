import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // Match internationalized pathnames, excluding api and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
