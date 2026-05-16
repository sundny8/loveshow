'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Palette, Heart } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useToast } from '@/components/ui/toast';

export function HeroSection() {
  const { data: session } = useSession();
  const t = useTranslations('hero');
  const router = useRouter();
  const { info } = useToast();

  const handleNavigate = (href: string) => {
    if (!session) {
      info('请先登录后再使用创作功能', '登录后即可使用所有AI创作功能');
      setTimeout(() => {
        router.push('/auth/signin');
      }, 1500);
      return;
    }
    router.push(href);
  };

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Background: violet → pink → orange radial glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-white dark:bg-slate-950" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full bg-loveshow-radial opacity-60 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 dark:border-violet-800/60 dark:bg-violet-900/20 px-4 py-1.5 text-sm font-medium text-violet-700 dark:text-violet-300 backdrop-blur font-display">
            <Sparkles className="h-3.5 w-3.5" />
            {t('badge')}
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.15] mb-6 font-display">
            {t('title.part1')}{' '}
            <span className="text-gradient">{t('title.highlight')}</span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('description.line1')}
            <br />
            {t('description.line2')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="btn-gradient group text-white border-0"
              onClick={() => handleNavigate('/blog')}
            >
              <Heart className="mr-2 h-4 w-4 fill-current" />
              {t('cta.column520')}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleNavigate('/workspace')}
            >
              {t('cta.primary')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleNavigate('/music')}
            >
              {t('cta.secondary')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleNavigate('/portrait')}
            >
              <Palette className="mr-2 h-4 w-4" />
              {t('cta.tertiary')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
