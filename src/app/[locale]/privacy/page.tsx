import { useTranslations } from "next-intl";
import { useNow } from "next-intl";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LegalText } from "@/components/legal/legal-text";

const sectionKeys = [
  "controller",
  "dataCollection",
  "dataUsage",
  "cookies",
  "sharing",
  "dataSecurity",
  "dataRetention",
  "dataRights",
  "marketing",
  "international",
  "children",
  "thirdParty",
  "policyChanges",
  "contact",
] as const;

export default function PrivacyPage() {
  const t = useTranslations("privacy");
  const now = useNow();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          {t("lastUpdated")}: {now.toLocaleDateString()}
        </p>
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
                    <LegalText>{section.content}</LegalText>
                  </p>
                )}
                {typeof section.intro === "string" && (
                  <p className="text-slate-600 dark:text-slate-300 mb-2">
                    <LegalText>{section.intro}</LegalText>
                  </p>
                )}
                {Array.isArray(section.items) && (
                  <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-300">
                    {(section.items as string[]).map((item, i) => (
                      <li key={i}>
                        <LegalText>{item}</LegalText>
                      </li>
                    ))}
                  </ul>
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
