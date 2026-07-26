import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
  // Disabled so every first visit lands on English regardless of the
  // browser's Accept-Language; users can still switch via the locale toggle.
  localeDetection: false,
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
