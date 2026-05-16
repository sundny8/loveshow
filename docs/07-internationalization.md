# Internationalization (i18n) Requirements

> **Document Version:** 1.0  
> **Last Updated:** 2024-03-16  
> **Status:** Implemented

---

## 1. Overview

### 1.1 Purpose
Provide multi-language support for the entire application, enabling users worldwide to use the platform in their preferred language.

### 1.2 Technology
- **Library:** next-intl
- **Routing:** Locale-prefixed URLs (`/en/`, `/zh/`, etc.)
- **Default Locale:** English (en)

---

## 2. Supported Locales

### 2.1 Language Support

| Code | Language | Native Name | Status |
|------|----------|-------------|--------|
| `en` | English | English | ✅ Default |
| `zh` | Chinese | 中文 | ✅ Implemented |
| `ja` | Japanese | 日本語 | ✅ Implemented |
| `ko` | Korean | 한국어 | ✅ Implemented |
| `es` | Spanish | Español | ✅ Implemented |
| `fr` | French | Français | ✅ Implemented |
| `de` | German | Deutsch | ✅ Implemented |

### 2.2 URL Structure
```
https://example.com/en/dashboard    # English
https://example.com/zh/dashboard    # Chinese
https://example.com/ja/dashboard    # Japanese
```

---

## 3. Implementation

### 3.1 Directory Structure
```
src/
├── i18n/
│   ├── messages/
│   │   ├── en.json       # English translations
│   │   ├── zh.json       # Chinese translations
│   │   ├── ja.json       # Japanese translations
│   │   ├── ko.json       # Korean translations
│   │   ├── es.json       # Spanish translations
│   │   ├── fr.json       # French translations
│   │   └── de.json       # German translations
│   ├── request.ts        # i18n request configuration
│   └── routing.ts        # Locale routing configuration
└── app/
    └── [locale]/         # Locale-prefixed routes
        ├── page.tsx
        ├── layout.tsx
        └── ...
```

### 3.2 Routing Configuration
```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de'] as const;
export type Locale = typeof locales[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always'  // or 'as-needed'
});
```

### 3.3 Request Configuration
```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
```

---

## 4. Translation Files Structure

### 4.1 Message Namespace Organization
```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create"
  },
  "nav": {
    "home": "Home",
    "features": "Features",
    "pricing": "Pricing",
    "blog": "Blog",
    "docs": "Docs",
    "signin": "Sign In",
    "signup": "Get Started"
  },
  "auth": {
    "signin": {
      "title": "Sign in to your account",
      "email": "Email",
      "password": "Password",
      "remember": "Remember me",
      "forgot": "Forgot password?",
      "button": "Sign In",
      "noAccount": "Don't have an account?",
      "signupLink": "Sign up"
    },
    "signup": {
      "title": "Create your account",
      "name": "Full name",
      "email": "Email",
      "password": "Password",
      "button": "Sign Up",
      "hasAccount": "Already have an account?",
      "signinLink": "Sign in"
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome back, {name}!",
    "profile": {
      "title": "Profile",
      "subtitle": "Manage your account"
    },
    "billing": {
      "title": "Billing",
      "subtitle": "Manage subscription"
    },
    "settings": {
      "title": "Settings",
      "subtitle": "App preferences"
    }
  },
  "organizations": {
    "title": "My Organizations",
    "create": "Create Organization",
    "empty": "No organizations yet"
  }
}
```

### 4.2 Dynamic Values
```json
{
  "greeting": "Hello, {name}!",
  "itemCount": "{count, plural, =0 {No items} =1 {1 item} other {# items}}",
  "lastLogin": "Last login: {date, date, medium}"
}
```

---

## 5. Usage in Components

### 5.1 Client Components
```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function Dashboard() {
  const t = useTranslations('dashboard');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcome', { name: 'John' })}</p>
    </div>
  );
}
```

### 5.2 Server Components
```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('dashboard');
  
  return (
    <div>
      <h1>{t('title')}</h1>
    </div>
  );
}
```

### 5.3 Namespace-Specific Translations
```tsx
import { useTranslations } from 'next-intl';

export default function AuthForm() {
  const t = useTranslations('auth.signin');
  
  return (
    <form>
      <input placeholder={t('email')} />
      <input placeholder={t('password')} />
      <button>{t('button')}</button>
    </form>
  );
}
```

---

## 6. Language Switcher

### 6.1 Component Implementation
```tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { locales } from '@/i18n/routing';

const languageNames: Record<string, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  
  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };
  
  return (
    <select value={locale} onChange={(e) => handleChange(e.target.value)}>
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {languageNames[loc]}
        </option>
      ))}
    </select>
  );
}
```

---

## 7. SEO Considerations

### 7.1 Alternate Language Tags
```tsx
// In layout.tsx
export function generateMetadata({ params: { locale } }) {
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        zh: '/zh',
        ja: '/ja',
        ko: '/ko',
        es: '/es',
        fr: '/fr',
        de: '/de',
      },
    },
  };
}
```

### 7.2 HTML Lang Attribute
```tsx
// In layout.tsx
export default function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 8. Adding a New Locale

### Step-by-Step Guide

1. **Add to routing configuration:**
```typescript
// src/i18n/routing.ts
export const locales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt'] as const;
```

2. **Create translation file:**
```bash
cp src/i18n/messages/en.json src/i18n/messages/pt.json
```

3. **Translate all keys:**
```json
// src/i18n/messages/pt.json
{
  "common": {
    "loading": "Carregando...",
    "error": "Ocorreu um erro",
    ...
  }
}
```

4. **Update language switcher:**
```typescript
const languageNames = {
  ...existing,
  pt: 'Português',
};
```

---

## 9. Date & Number Formatting

### 9.1 Date Formatting
```tsx
import { useFormatter } from 'next-intl';

function DateDisplay({ date }) {
  const format = useFormatter();
  
  return (
    <span>
      {format.dateTime(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </span>
  );
}
```

### 9.2 Number Formatting
```tsx
function PriceDisplay({ amount, currency = 'USD' }) {
  const format = useFormatter();
  
  return (
    <span>
      {format.number(amount, {
        style: 'currency',
        currency
      })}
    </span>
  );
}
```

---

## 10. Testing

### 10.1 Translation Coverage
- All UI text must have translation keys
- No hardcoded strings in components
- All locales must have complete translation files

### 10.2 Locale Testing Checklist
- [ ] Navigation works in all locales
- [ ] Language switcher changes URL and content
- [ ] Date/number formatting is locale-aware
- [ ] RTL support (if applicable)
- [ ] Font rendering for all character sets

---

## 11. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-16 | Initial documentation |
