'use client';

import { Link } from '@/i18n/routing';
import { Camera, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();
  const supportEmail = 'noreply@loveshow.life';

  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-loveshow-gradient shadow-md shadow-violet-500/20">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">LoveShow</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              {t('brand.description')}
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>{supportEmail}</span>
            </a>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">{t('product.title')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#engines" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {t('product.engines')}
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {t('product.features')}
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {t('product.pricing')}
                </Link>
              </li>
              <li>
                <Link href="/workspace" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {t('product.workspace')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">{t('resources.title')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/gallery" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {t('resources.gallery')}
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {t('resources.faq')}
                </Link>
              </li>
              <li>
                <Link href="/520-meaning" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {t('resources.meaning520')}
                </Link>
              </li>
              <li>
                <Link href="/ai-image-editor" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {t('resources.imageEditor')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {t('resources.dashboard')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">{t('legal.title')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {t('legal.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {t('legal.terms')}
                </Link>
              </li>
              <li>
                <Link href="/aup" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  {t('legal.aup')}
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {t('legal.contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t('copyright', { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
}
