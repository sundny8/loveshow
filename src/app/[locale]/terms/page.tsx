import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useTranslations, useNow } from 'next-intl';

export default function TermsPage() {
  const t = useTranslations('terms');
  const now = useNow();

  const formattedDate = now.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              {t('lastUpdated')}: {formattedDate}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.agreement.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.agreement.content')}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.license.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.license.intro')}
            </p>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.license.intro2')}
            </p>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 mb-4 space-y-2">
              {t.raw('sections.license.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.disclaimer.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.disclaimer.content')}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.limitations.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.limitations.content')}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.accuracy.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.accuracy.content')}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.links.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.links.content')}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.acceptableUse.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.acceptableUse.intro')}
            </p>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 mb-4 space-y-2">
              {t.raw('sections.acceptableUse.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.acceptableUse.moderation')}
            </p>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.acceptableUse.report')}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.modifications.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.modifications.content')}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.contact.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.contact.content')}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
