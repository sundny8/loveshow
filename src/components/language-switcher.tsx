'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n/routing';
import { Globe } from 'lucide-react';
import { Dropdown, DropdownItem } from './ui/dropdown';
import { Button } from './ui/button';

const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    // Remove current locale from pathname if present
    const segments = pathname.split('/');
    const hasLocalePrefix = locales.includes(segments[1] as Locale);
    
    let pathWithoutLocale: string;
    if (hasLocalePrefix) {
      // Remove the locale segment
      pathWithoutLocale = '/' + segments.slice(2).join('/') || '/';
    } else {
      pathWithoutLocale = pathname;
    }
    
    // For default locale (en), don't add prefix
    // For other locales, add the locale prefix
    let newPathname: string;
    if (newLocale === 'en') {
      newPathname = pathWithoutLocale;
    } else {
      newPathname = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
    }
    
    router.push(newPathname);
  };

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="icon" className="w-9 h-9 p-0">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      }
      align="right"
    >
      {locales.map((loc) => (
        <DropdownItem
          key={loc}
          onClick={() => handleLocaleChange(loc)}
        >
          <span className={locale === loc ? 'font-semibold text-primary-600' : ''}>
            {localeNames[loc]}
          </span>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
