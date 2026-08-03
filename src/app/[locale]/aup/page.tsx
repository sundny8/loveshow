import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

type PolicySubsection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type PolicySection = PolicySubsection & {
  subsections?: PolicySubsection[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'aup' });

  return {
    title: t('title'),
    description: t('intro'),
  };
}

export default function AcceptableUsePolicyPage() {
  const t = useTranslations('aup');
  const sections = t.raw('sections') as PolicySection[];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {t('lastUpdated')}
        </p>
        <p className="text-slate-600 dark:text-slate-300 mb-10">
          {t('intro')}
        </p>

        <div className="prose dark:prose-invert max-w-none space-y-8">
          {sections.map((section, sectionIndex) => (
            <section key={sectionIndex}>
              <h2 className="text-xl font-semibold mb-3">{section.title}</h2>

              {section.paragraphs?.map((paragraph, paragraphIndex) => (
                <p
                  key={paragraphIndex}
                  className="text-slate-600 dark:text-slate-300 mb-2 whitespace-pre-line"
                >
                  {paragraph}
                </p>
              ))}

              {section.items && (
                <ol className="list-decimal pl-6 space-y-2 text-slate-600 dark:text-slate-300">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ol>
              )}

              {section.subsections?.map((subsection, subsectionIndex) => (
                <div key={subsectionIndex} className="mt-5">
                  <h3 className="text-lg font-semibold mb-2">
                    {subsection.title}
                  </h3>
                  {subsection.paragraphs?.map((paragraph, paragraphIndex) => (
                    <p
                      key={paragraphIndex}
                      className="text-slate-600 dark:text-slate-300 mb-2 whitespace-pre-line"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {subsection.items && (
                    <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300">
                      {subsection.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
