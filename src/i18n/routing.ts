import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'zh',
  localePrefix: 'always', // Changed to 'always' for consistent URL structure
  localeDetection: true,  // Enabled automatic locale detection
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
