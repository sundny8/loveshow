import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all pathnames except for
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /static (static files)
    // - /favicon.ico, /robots.txt, etc. (static files in public folder)
    '/((?!api|_next|static|.*\\..*|favicon.ico|robots.txt).*)',
  ],
};
