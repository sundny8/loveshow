'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';

export function CTASection() {
  const { data: session } = useSession();
  const t = useTranslations('cta');
  const href = session ? '/workspace' : '/auth/signup';

  return (
    <section className="py-20 sm:py-28">
      <div className="container mx-auto px-4">
        <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden p-10 sm:p-16 bg-loveshow-gradient text-white animate-[gradient-pan_12s_ease-in-out_infinite]" style={{ backgroundSize: '200% 200%' }}>
          <div className="relative z-10 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {t('title')}
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {t('description')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link href="/gallery">
                <Button
                  size="lg"
                  className="bg-white text-rose-600 border-0 hover:bg-rose-50 hover:text-rose-700 ring-2 ring-rose-400 shadow-lg shadow-rose-500/40 animate-pulse group font-semibold"
                >
                  <Heart className="mr-2 h-4 w-4 fill-rose-500 text-rose-500" />
                  {t('column520')}
                </Button>
              </Link>
              <Link href={href}>
                <Button size="lg" variant="outline" className="bg-white text-violet-700 border-white hover:bg-white/90 hover:text-violet-800 group">
                  {t('button')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-black/10" />
        </div>
      </div>
    </section>
  );
}
