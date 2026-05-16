import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Music } from 'lucide-react';
import { auth } from '@/lib/auth';
import { MusicStudio } from '@/components/workspace/music-studio';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AI Music Production · LoveShow',
  description: 'Use AI to generate your own original song. Enter a description or lyrics, pick a genre, and generate a complete song in one click.',
};

export default async function MusicPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations('musicStudio.page');

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/music');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-emerald-950 dark:to-teal-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              {t('backToHome')}
            </Link>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl shadow-emerald-500/30">
                <Music className="h-6 w-6 text-white" />
              </span>
              {t('title')}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 ml-15">
              {t('description')}
            </p>
          </div>
        </div>

        <MusicStudio />
      </div>
    </div>
  );
}
