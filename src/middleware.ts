import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all pathnames except for
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /static (static files)
    // - /m (public memoir share pages, no locale prefix)
    // - /favicon.ico, /robots.txt, etc. (static files in public folder)
    '/((?!api|_next|static|m/|.*\\..*|favicon.ico|robots.txt).*)',
  ],
};
