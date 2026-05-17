'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';

export function PricingSection() {
  const { data: session } = useSession();
  const t = useTranslations('pricing');
  const paidHref = session ? '/dashboard/billing' : '/auth/signup';
  // Trial: signup if not logged-in, otherwise scroll to engines section to start creating
  const trialHref = session ? '#engines' : '/auth/signup';

  const plans = [
    { ...t.raw('plans.trial'), highlight: false, key: 'trial', href: trialHref },
    { ...t.raw('plans.starter'), highlight: false, key: 'starter', href: paidHref },
    { ...t.raw('plans.creator'), highlight: false, key: 'creator', href: paidHref },
    { ...t.raw('plans.enthusiast'), highlight: true, key: 'enthusiast', href: paidHref },
    { ...t.raw('plans.studio'), highlight: false, key: 'studio', href: paidHref },
  ] as Array<{ name: string; price: string; unit: string; highlight: boolean; features: string[]; cta: string; key: string; href: string }>;

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-slate-50/80 dark:bg-slate-900/40">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 font-display">
            {t('title.part1')}<span className="text-gradient">{t('title.highlight')}</span>{t('title.part2')}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {t('description')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`surface-card p-8 relative flex flex-col h-full ${
                plan.highlight
                  ? 'border-violet-300 dark:border-violet-700 shadow-xl shadow-violet-500/10 lg:-translate-y-2'
                  : ''
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 chip bg-loveshow-gradient text-white border-0 shadow-md whitespace-nowrap">
                  {t('mostPopular')}
                </div>
              )}
              <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold">{plan.price}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {plan.unit}
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className="block mt-auto">
                <Button
                  className={
                    plan.highlight
                      ? 'w-full btn-gradient text-white border-0'
                      : 'w-full'
                  }
                  variant={plan.highlight ? 'primary' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
