import { useTranslations } from "next-intl";
import { useNow } from "next-intl";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Link } from "@/i18n/routing";

const sectionKeys = [
  "acceptance",
  "services",
  "account",
  "credits",
  "billing",
  "creditExpiry",
  "refunds",
  "billingDisputes",
  "aiContent",
  "acceptableUse",
  "dataPrivacy",
  "disclaimer",
  "termination",
  "governingLaw",
  "generalTerms",
  "contact",
] as const;

export default function TermsPage() {
  const t = useTranslations("terms");
  const now = useNow();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          {t("lastUpdated")}: {now.toLocaleDateString()}
        </p>
        <aside className="mb-8 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-slate-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-slate-200">
          {t("aupNotice")}{" "}
          <Link
            href="/aup"
            className="font-medium text-violet-700 underline underline-offset-2 dark:text-violet-300"
          >
            {t("aupLink")}
          </Link>
        </aside>
        <div className="prose dark:prose-invert max-w-none space-y-8">
          {sectionKeys.map((key) => {
            const section = t.raw(`sections.${key}`) as Record<string, unknown>;
            if (!section) return null;
            return (
              <section key={key}>
                <h2 className="text-xl font-semibold mb-3">
                  {String(section.title)}
                </h2>
                {typeof section.content === "string" && (
                  <p className="text-slate-600 dark:text-slate-300 mb-2 whitespace-pre-line">
                    {section.content}
                  </p>
                )}
                {typeof section.intro === "string" && (
                  <p className="text-slate-600 dark:text-slate-300 mb-2">
                    {section.intro}
                  </p>
                )}
                {Array.isArray(section.items) && (
                  <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-300">
                    {(section.items as string[]).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
                {Array.isArray(section.subsections) &&
                  (
                    section.subsections as Array<{
                      title: string;
                      intro?: string;
                      items?: string[];
                    }>
                  ).map((sub, i) => (
                    <div key={i} className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">{sub.title}</h3>
                      {sub.intro && (
                        <p className="text-slate-600 dark:text-slate-300 mb-2">
                          {sub.intro}
                        </p>
                      )}
                      {Array.isArray(sub.items) && (
                        <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-300">
                          {sub.items.map((item, j) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                {typeof section.moderation === "string" && (
                  <p className="text-slate-600 dark:text-slate-300 mt-2">
                    {section.moderation}
                  </p>
                )}
                {typeof section.report === "string" && (
                  <p className="text-slate-600 dark:text-slate-300 mt-2">
                    {section.report}
                  </p>
                )}
                {typeof section.moderationProcess === "string" && (
                  <p className="text-slate-600 dark:text-slate-300 mt-2">
                    {section.moderationProcess}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
