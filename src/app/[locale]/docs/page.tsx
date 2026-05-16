import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Book, Rocket, Database, Shield, Globe, CreditCard, Mail, BarChart3, FileText, TestTube, Palette } from 'lucide-react';

const docSections = [
  {
    title: 'Getting Started',
    description: 'Learn how to set up and run StartFast Pro',
    icon: Rocket,
    items: [
      { title: 'Installation', href: '/docs/installation' },
      { title: 'Environment Variables', href: '/docs/env-variables' },
      { title: 'Project Structure', href: '/docs/structure' },
      { title: 'Deployment', href: '/docs/deployment' },
    ],
  },
  {
    title: 'Authentication',
    description: 'User authentication with Better-Auth',
    icon: Shield,
    items: [
      { title: 'Email/Password', href: '/docs/auth/email' },
      { title: 'OAuth Providers', href: '/docs/auth/oauth' },
      { title: 'Magic Links', href: '/docs/auth/magic-links' },
      { title: 'Session Management', href: '/docs/auth/sessions' },
    ],
  },
  {
    title: 'Database',
    description: 'Database operations with Drizzle ORM',
    icon: Database,
    items: [
      { title: 'Schema Definition', href: '/docs/database/schema' },
      { title: 'Migrations', href: '/docs/database/migrations' },
      { title: 'Queries', href: '/docs/database/queries' },
      { title: 'Drizzle Studio', href: '/docs/database/studio' },
    ],
  },
  {
    title: 'Internationalization',
    description: 'Multi-language support with next-intl',
    icon: Globe,
    items: [
      { title: 'Configuration', href: '/docs/i18n/config' },
      { title: 'Adding Languages', href: '/docs/i18n/languages' },
      { title: 'Translation Files', href: '/docs/i18n/translations' },
      { title: 'Language Switcher', href: '/docs/i18n/switcher' },
    ],
  },
  {
    title: 'Payments',
    description: 'Stripe integration for subscriptions',
    icon: CreditCard,
    items: [
      { title: 'Setup', href: '/docs/payments/setup' },
      { title: 'Subscriptions', href: '/docs/payments/subscriptions' },
      { title: 'Webhooks', href: '/docs/payments/webhooks' },
      { title: 'Customer Portal', href: '/docs/payments/portal' },
    ],
  },
  {
    title: 'Email',
    description: 'Transactional emails with Resend',
    icon: Mail,
    items: [
      { title: 'Configuration', href: '/docs/email/config' },
      { title: 'Templates', href: '/docs/email/templates' },
      { title: 'Sending Emails', href: '/docs/email/sending' },
    ],
  },
  {
    title: 'Analytics',
    description: 'Product analytics with Posthog',
    icon: BarChart3,
    items: [
      { title: 'Setup', href: '/docs/analytics/setup' },
      { title: 'Event Tracking', href: '/docs/analytics/events' },
      { title: 'User Identification', href: '/docs/analytics/users' },
    ],
  },
  {
    title: 'Blog',
    description: 'MDX-powered blog system',
    icon: FileText,
    items: [
      { title: 'Creating Posts', href: '/docs/blog/posts' },
      { title: 'Categories & Tags', href: '/docs/blog/categories' },
      { title: 'SEO Optimization', href: '/docs/blog/seo' },
    ],
  },
  {
    title: 'Testing',
    description: 'E2E testing with Playwright',
    icon: TestTube,
    items: [
      { title: 'Writing Tests', href: '/docs/testing/writing' },
      { title: 'Running Tests', href: '/docs/testing/running' },
      { title: 'CI/CD Integration', href: '/docs/testing/ci' },
    ],
  },
  {
    title: 'UI Components',
    description: 'Pro UI kit components',
    icon: Palette,
    items: [
      { title: 'Button', href: '/docs/ui/button' },
      { title: 'Card', href: '/docs/ui/card' },
      { title: 'DataTable', href: '/docs/ui/data-table' },
      { title: 'Modal', href: '/docs/ui/modal' },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 mb-4">
              <Book className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Documentation</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Everything you need to know to build with StartFast Pro
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {docSections.map((section) => (
              <Card key={section.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <section.icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
