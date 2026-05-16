'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Camera, Music, Palette, Heart } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

export function EnginesSection() {
  const { data: session } = useSession();
  const t = useTranslations('engines');
  const router = useRouter();
  const studioHref = session ? '/workspace' : '/auth/signup';
  const portraitHref = session ? '/portrait' : '/auth/signup';

  const photoChips = t.raw('idPhoto.chips') as string[];
  const portraitChips = t.raw('portrait.chips') as string[];
  const musicChips = t.raw('music.chips') as string[];
  const column520Chips = t.raw('column520.chips') as string[];
  const musicHref = session ? '/music' : '/auth/signup';

  const handleColumn520Click = () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    router.push('/blog');
  };

  return (
    <section id="engines" className="py-20 sm:py-28 bg-slate-50/80 dark:bg-slate-900/40">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 font-display">
            {t('title.part1')} <span className="text-gradient">{t('title.highlight')}</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {t('description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {/* Engine 0: 520 Column - New */}
          <div className="group relative surface-card p-8 overflow-hidden flex flex-col">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-rose-400/30 via-pink-400/20 to-transparent blur-2xl" />
            <div className="relative flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <Heart className="h-6 w-6 text-white fill-current" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      {t('column520.engineLabel')}
                    </div>
                    <h3 className="text-xl font-bold">{t('column520.title')}</h3>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {t('column520.description')}
              </p>

              <div className="flex flex-wrap justify-center gap-1.5 mb-8">
                {column520Chips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50 transition-all duration-200 hover:scale-105 hover:shadow-sm hover:shadow-rose-200/50 dark:hover:shadow-rose-900/30"
                  >
                    <span className="h-1 w-1 rounded-full bg-rose-400 dark:bg-rose-500" />
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex justify-center">
                <Button
                  onClick={handleColumn520Click}
                  className="btn-gradient bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0 group/btn"
                >
                  {t('column520.cta')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>

          {/* Engine 1: ID Photo - Available */}
          <div className="group relative surface-card p-8 overflow-hidden flex flex-col">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-violet-400/30 via-pink-400/20 to-transparent blur-2xl" />
            <div className="relative flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-loveshow-gradient flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                      {t('idPhoto.engineLabel')}
                    </div>
                    <h3 className="text-xl font-bold">{t('idPhoto.title')}</h3>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {t('idPhoto.description')}
              </p>

              <div className="flex flex-wrap justify-center gap-1.5 mb-8">
                {photoChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/50 transition-all duration-200 hover:scale-105 hover:shadow-sm hover:shadow-violet-200/50 dark:hover:shadow-violet-900/30"
                  >
                    <span className="h-1 w-1 rounded-full bg-violet-400 dark:bg-violet-500" />
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex justify-center">
                <Link href={studioHref}>
                  <Button className="btn-gradient text-white border-0 group/btn">
                    {t('idPhoto.cta')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Engine 2: Portrait Studio - Available */}
          <div className="group relative surface-card p-8 overflow-hidden flex flex-col">
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-orange-400/20 via-pink-400/20 to-transparent blur-2xl" />
            <div className="relative flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Palette className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                      {t('portrait.engineLabel')}
                    </div>
                    <h3 className="text-xl font-bold">{t('portrait.title')}</h3>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {t('portrait.description')}
              </p>

              <div className="flex flex-wrap justify-center gap-1.5 mb-8">
                {portraitChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/50 transition-all duration-200 hover:scale-105 hover:shadow-sm hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30"
                  >
                    <span className="h-1 w-1 rounded-full bg-orange-400 dark:bg-orange-500" />
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex justify-center">
                <Link href={portraitHref}>
                  <Button className="btn-gradient bg-gradient-to-r from-orange-400 to-pink-600 text-white border-0 group/btn">
                    {t('portrait.cta')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Engine 3: AI Music - Available */}
          <div className="group relative surface-card p-8 overflow-hidden flex flex-col">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-400/30 via-teal-400/20 to-transparent blur-2xl" />
            <div className="relative flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      {t('music.engineLabel')}
                    </div>
                    <h3 className="text-xl font-bold">{t('music.title')}</h3>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {t('music.description')}
              </p>

              <div className="flex flex-wrap justify-center gap-1.5 mb-8">
                {musicChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 transition-all duration-200 hover:scale-105 hover:shadow-sm hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30"
                  >
                    <span className="h-1 w-1 rounded-full bg-emerald-400 dark:bg-emerald-500" />
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex justify-center">
                <Link href={musicHref}>
                  <Button className="btn-gradient bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 group/btn">
                    {t('music.cta')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
