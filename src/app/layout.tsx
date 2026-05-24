import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';
import { Nunito, Noto_Serif_SC } from 'next/font/google';
import { cn } from '@/lib/utils';
import { getSiteUrl } from '@/lib/seo';

// UI body font: rounded humanist sans for clean interface elements
const cereal = Nunito({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

// Display / heading font: Noto Serif SC — classical literary warmth,
// evokes the romantic editorial feel of "用创意留住爱".
// Supports full CJK character set with multiple weights.
const serif = Noto_Serif_SC({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600', '700', '900'],
  display: 'swap',
});

// Root metadata acts as a fallback for non-locale paths (sitemap, robots, etc.).
// Locale-specific metadata (title/description/canonical/hreflang) lives in
// app/[locale]/layout.tsx so each language page gets the proper SEO bundle.
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'LoveShow 520 · 520 Meaning "I Love You" · AI Love Studio',
  description:
    '520 means "I love you" in Chinese internet culture (5/2/0 ≈ wǒ ài nǐ). LoveShow 520 is an AI love studio that turns this meaning into couple portraits, romantic copy, custom songs and love memoirs.',
  applicationName: 'LoveShow 520',
  authors: [{ name: 'LoveShow' }],
  creator: 'LoveShow',
  publisher: 'LoveShow',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Icons are registered automatically via the file conventions:
  //   src/app/icon.tsx       → /icon (favicon)
  //   src/app/apple-icon.tsx → /apple-icon (iOS home screen)
  // Do NOT add an explicit `icons` block here — it would re-target a path
  // that Next.js already serves and trigger a public/page conflict.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The [locale] layout overrides language attributes via React; we keep
    // a sensible default here so non-locale pages stay valid HTML.
    <html lang="en" suppressHydrationWarning className={cn('font-sans', cereal.variable, serif.variable)}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
