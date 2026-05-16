import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Palette } from 'lucide-react';
import { auth } from '@/lib/auth';
import { PortraitStudio } from '@/components/workspace/portrait-studio';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AI Portrait · LoveShow',
  description: 'Upload your photo, pick a portrait style, and let AI generate a studio-quality portrait in one click.',
};

export default async function PortraitPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations('portraitStudio.page');

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/portrait');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50 dark:from-slate-900 dark:via-orange-950 dark:to-pink-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-sm text-slate-500 hover:text-orange-600 transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              {t('backToHome')}
            </Link>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-pink-600 shadow-xl shadow-orange-500/30">
                <Palette className="h-6 w-6 text-white" />
              </span>
              {t('title')}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 ml-15">
              {t('description')}
            </p>
          </div>
        </div>

        <PortraitStudio />
      </div>
    </div>
  );
}
