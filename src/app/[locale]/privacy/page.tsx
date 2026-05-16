import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useTranslations, useNow } from 'next-intl';

export default function PrivacyPage() {
  const t = useTranslations('privacy');
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

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.intro.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.intro.content')}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.dataCollection.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.dataCollection.intro')}
            </p>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 mb-4 space-y-2">
              {t.raw('sections.dataCollection.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.dataUsage.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.dataUsage.intro')}
            </p>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 mb-4 space-y-2">
              {t.raw('sections.dataUsage.items').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.dataSecurity.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.dataSecurity.content')}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('sections.rights.title')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t('sections.rights.content')}
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
