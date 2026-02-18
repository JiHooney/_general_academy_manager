import createMiddleware from 'next-intl/middleware';
import { SUPPORTED_LOCALES } from '@gam/shared';

export default createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: 'en',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
