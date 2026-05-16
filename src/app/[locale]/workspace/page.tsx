import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Camera } from 'lucide-react';
import { auth } from '@/lib/auth';
import { PhotoStudio } from '@/components/workspace/photo-studio';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AI ID Photo · LoveShow',
  description: 'Upload your photo and generate a high-quality, specification-compliant ID photo in one click.',
};

export default async function WorkspacePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations('workspace');
  
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/workspace');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-violet-950 dark:to-purple-950">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-xs text-slate-500 hover:text-violet-600 transition-colors mb-1"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              {t('backToHome')}
            </Link>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-loveshow-gradient shadow-lg shadow-violet-500/30">
                <Camera className="h-5 w-5 text-white" />
              </span>
              {t('title')}
            </h1>
          </div>
        </div>

        <PhotoStudio />
      </div>
    </div>
  );
}
