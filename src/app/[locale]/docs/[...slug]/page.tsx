import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Book, 
  Rocket, 
  Database, 
  Shield, 
  Globe, 
  CreditCard, 
  ChevronRight,
  Copy,
} from 'lucide-react';

// Documentation content
const docsContent: Record<string, {
  title: string;
  description: string;
  category: string;
  content: string;
}> = {
  'installation': {
    title: 'Installation',
    description: 'Learn how to install and set up StartFast Pro',
    category: 'Getting Started',
    content: `## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js 18+** - We recommend using the latest LTS version
- **npm** or **pnpm** - Package manager
- **PostgreSQL** - Database (we recommend Neon or Supabase)

## Clone the Repository

\`\`\`bash
git clone https://github.com/your-repo/startfast-pro.git
cd startfast-pro
\`\`\`

## Install Dependencies

\`\`\`bash
npm install
\`\`\`

Or with pnpm:

\`\`\`bash
pnpm install
\`\`\`

## Set Up Environment Variables

Copy the example environment file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit \`.env.local\` and fill in your values:

\`\`\`env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
\`\`\`

## Initialize the Database

Run the database migrations:

\`\`\`bash
npm run db:push
\`\`\`

## Start the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see your app!

## Next Steps

- Configure [Environment Variables](/docs/env-variables)
- Set up [Authentication](/docs/auth/email)
- Connect [Stripe Payments](/docs/payments/setup)`,
  },
  'env-variables': {
    title: 'Environment Variables',
    description: 'Configure your environment variables',
    category: 'Getting Started',
    content: `## Required Variables

These environment variables are required for the application to work:

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| BETTER_AUTH_SECRET | Secret key for authentication |
| BETTER_AUTH_URL | Your application URL |

## Authentication

\`\`\`env
# Better-Auth
BETTER_AUTH_SECRET="your-32-character-secret"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
\`\`\`

## Database

\`\`\`env
DATABASE_URL="postgresql://user:password@host:5432/database"
\`\`\`

We recommend using:
- **Neon** - Serverless PostgreSQL
- **Supabase** - PostgreSQL with additional features
- **Railway** - Simple deployment

## Payments (Stripe)

\`\`\`env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
\`\`\`

## Email (Resend)

\`\`\`env
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
\`\`\`

## Analytics (PostHog)

\`\`\`env
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
\`\`\``,
  },
  'structure': {
    title: 'Project Structure',
    description: 'Understanding the project layout',
    category: 'Getting Started',
    content: `## Directory Structure

\`\`\`
startfast-pro/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Internationalized routes
│   │   │   ├── admin/         # Admin dashboard
│   │   │   ├── auth/          # Authentication pages
│   │   │   ├── blog/          # Blog pages
│   │   │   ├── dashboard/     # User dashboard
│   │   │   └── docs/          # Documentation
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # UI primitives
│   ├── db/                    # Database schema
│   ├── lib/                   # Utility functions
│   └── messages/              # Translation files
├── public/                    # Static assets
├── tests/                     # E2E tests
└── drizzle.config.ts         # Database config
\`\`\`

## Key Directories

### /src/app

The Next.js App Router directory. All routes are defined here using the file-system based routing.

### /src/components

Reusable React components:
- **layout/** - Header, Footer, Sidebar
- **ui/** - Button, Card, Input, etc.

### /src/db

Database configuration and schema using Drizzle ORM.

### /src/lib

Utility functions including:
- **auth.ts** - Authentication configuration
- **utils.ts** - Helper functions
- **permissions.ts** - RBAC permissions

### /src/messages

Translation files for internationalization (i18n).`,
  },
  'deployment': {
    title: 'Deployment',
    description: 'Deploy your application to production',
    category: 'Getting Started',
    content: `## Vercel (Recommended)

StartFast Pro is optimized for Vercel deployment.

### Steps

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables

Make sure to add all required environment variables in your Vercel dashboard:

- DATABASE_URL
- BETTER_AUTH_SECRET
- BETTER_AUTH_URL (your production URL)
- STRIPE_SECRET_KEY
- And others...

## Other Platforms

### Railway

\`\`\`bash
railway init
railway up
\`\`\`

### Docker

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
\`\`\`

## Production Checklist

- [ ] Set all environment variables
- [ ] Configure your domain
- [ ] Set up SSL certificate
- [ ] Configure Stripe webhooks
- [ ] Set up email domain verification
- [ ] Enable analytics`,
  },
  'auth/email': {
    title: 'Email/Password Authentication',
    description: 'Set up email and password authentication',
    category: 'Authentication',
    content: `## Overview

StartFast Pro uses Better-Auth for authentication. Email/Password auth is enabled by default.

## Configuration

The authentication is configured in \`src/lib/auth.ts\`:

\`\`\`typescript
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
});
\`\`\`

## Sign Up Flow

1. User enters email and password
2. Verification email is sent
3. User clicks verification link
4. Account is activated

## Sign In Flow

1. User enters credentials
2. Session is created
3. User is redirected to dashboard

## Password Reset

The password reset flow:

1. User requests reset
2. Reset email is sent
3. User clicks link
4. User sets new password

## Customization

You can customize the auth pages in:
- \`src/app/[locale]/auth/signin/page.tsx\`
- \`src/app/[locale]/auth/signup/page.tsx\``,
  },
  'auth/oauth': {
    title: 'OAuth Providers',
    description: 'Configure social login providers',
    category: 'Authentication',
    content: `## Supported Providers

StartFast Pro supports:
- Google
- GitHub
- And more via Better-Auth

## Google OAuth

### 1. Create OAuth App

Go to [Google Cloud Console](https://console.cloud.google.com) and create OAuth credentials.

### 2. Configure Environment

\`\`\`env
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
\`\`\`

### 3. Add Redirect URI

Add this redirect URI in Google Console:
\`\`\`
https://yourdomain.com/api/auth/callback/google
\`\`\`

## GitHub OAuth

### 1. Create OAuth App

Go to GitHub Developer Settings and create a new OAuth App.

### 2. Configure Environment

\`\`\`env
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
\`\`\`

### 3. Add Callback URL

\`\`\`
https://yourdomain.com/api/auth/callback/github
\`\`\``,
  },
  'database/schema': {
    title: 'Schema Definition',
    description: 'Define your database schema with Drizzle ORM',
    category: 'Database',
    content: `## Schema File

The database schema is defined in \`src/db/schema.ts\`:

\`\`\`typescript
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  role: text('role').default('member'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
\`\`\`

## Available Tables

- **users** - User accounts
- **sessions** - Auth sessions
- **accounts** - OAuth accounts
- **subscriptions** - Stripe subscriptions
- **organizations** - Teams/organizations
- **blogPosts** - Blog content

## Adding New Tables

1. Define the table in \`schema.ts\`
2. Run migrations: \`npm run db:push\`
3. Use in your code

## Type Safety

Drizzle provides full type safety:

\`\`\`typescript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
\`\`\``,
  },
  'payments/setup': {
    title: 'Stripe Setup',
    description: 'Configure Stripe for payments',
    category: 'Payments',
    content: `## Prerequisites

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Dashboard

## Environment Variables

\`\`\`env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
\`\`\`

## Create Products

In your Stripe Dashboard, create:

1. **Products** - Your subscription plans
2. **Prices** - Monthly/yearly pricing

## Webhook Setup

### Local Development

\`\`\`bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
\`\`\`

### Production

Add webhook endpoint in Stripe Dashboard:
\`\`\`
https://yourdomain.com/api/webhooks/stripe
\`\`\`

Events to listen for:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_failed`,
  },
  'i18n/config': {
    title: 'i18n Configuration',
    description: 'Configure internationalization',
    category: 'Internationalization',
    content: `## Overview

StartFast Pro uses next-intl for internationalization.

## Supported Languages

Out of the box:
- English (en)
- 中文 (zh)
- 日本語 (ja)
- 한국어 (ko)
- Español (es)
- Français (fr)
- Deutsch (de)

## Configuration

The i18n config is in \`src/i18n/\`:

\`\`\`typescript
// src/i18n/config.ts
export const locales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de'];
export const defaultLocale = 'en';
\`\`\`

## Using Translations

\`\`\`typescript
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');
  return <h1>{t('welcome')}</h1>;
}
\`\`\`

## Adding a New Language

1. Add locale to config
2. Create translation file in \`messages/\`
3. Translate all strings`,
  },
};

// Sidebar navigation
const sidebarNav = [
  {
    title: 'Getting Started',
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
    icon: Shield,
    items: [
      { title: 'Email/Password', href: '/docs/auth/email' },
      { title: 'OAuth Providers', href: '/docs/auth/oauth' },
    ],
  },
  {
    title: 'Database',
    icon: Database,
    items: [
      { title: 'Schema Definition', href: '/docs/database/schema' },
    ],
  },
  {
    title: 'Internationalization',
    icon: Globe,
    items: [
      { title: 'Configuration', href: '/docs/i18n/config' },
    ],
  },
  {
    title: 'Payments',
    icon: CreditCard,
    items: [
      { title: 'Stripe Setup', href: '/docs/payments/setup' },
    ],
  },
];

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const path = slug.join('/');
  const doc = docsContent[path];
  
  if (!doc) {
    return { title: 'Documentation - StartFast Pro' };
  }

  return {
    title: `${doc.title} - StartFast Pro Docs`,
    description: doc.description,
  };
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="relative group my-4">
      {language && (
        <div className="absolute top-0 left-0 px-3 py-1 text-xs text-slate-400 bg-slate-800 rounded-tl-lg">
          {language}
        </div>
      )}
      <pre className="bg-slate-900 text-slate-100 p-4 pt-8 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <button 
        className="absolute top-2 right-2 p-2 rounded bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy code"
      >
        <Copy className="h-4 w-4 text-slate-300" />
      </button>
    </div>
  );
}

function renderContent(content: string) {
  return content.split('\n\n').map((block, index) => {
    // Headings
    if (block.startsWith('## ')) {
      return <h2 key={index} className="text-2xl font-bold mt-10 mb-4 text-slate-900 dark:text-white">{block.slice(3)}</h2>;
    }
    if (block.startsWith('### ')) {
      return <h3 key={index} className="text-xl font-semibold mt-8 mb-3 text-slate-900 dark:text-white">{block.slice(4)}</h3>;
    }
    
    // Code blocks
    if (block.startsWith('```')) {
      const lines = block.split('\n');
      const lang = lines[0].slice(3);
      const code = lines.slice(1, -1).join('\n');
      return <CodeBlock key={index} code={code} language={lang} />;
    }
    
    // Tables
    if (block.includes('|') && block.includes('---')) {
      const rows = block.split('\n').filter(row => !row.includes('---'));
      return (
        <div key={index} className="overflow-x-auto my-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800">
                {rows[0]?.split('|').filter(Boolean).map((cell, i) => (
                  <th key={i} className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-slate-200 dark:border-slate-700">
                  {row.split('|').filter(Boolean).map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // Lists
    if (block.startsWith('- ')) {
      const items = block.split('\n');
      return (
        <ul key={index} className="my-4 space-y-2 pl-6">
          {items.map((item, i) => (
            <li key={i} className="text-slate-600 dark:text-slate-300 relative before:content-[''] before:absolute before:-left-4 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-primary-500 before:rounded-full">
              {item.replace(/^- /, '')}
            </li>
          ))}
        </ul>
      );
    }
    
    // Numbered lists
    if (/^\d+\. /.test(block)) {
      const items = block.split('\n');
      return (
        <ol key={index} className="my-4 space-y-2 pl-6 list-decimal">
          {items.map((item, i) => (
            <li key={i} className="text-slate-600 dark:text-slate-300 pl-2">
              {item.replace(/^\d+\. /, '')}
            </li>
          ))}
        </ol>
      );
    }
    
    // Regular paragraphs
    return (
      <p key={index} className="text-slate-600 dark:text-slate-300 my-4 leading-relaxed">
        {block}
      </p>
    );
  });
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const path = slug.join('/');
  const doc = docsContent[path];

  if (!doc) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Header />
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="sticky top-0 h-screen overflow-y-auto p-6">
            <Link href="/docs" className="flex items-center gap-2 mb-8 text-slate-900 dark:text-white">
              <Book className="h-5 w-5 text-primary-600" />
              <span className="font-semibold">Documentation</span>
            </Link>
            <nav className="space-y-6">
              {sidebarNav.map((section) => (
                <div key={section.title}>
                  <div className="flex items-center gap-2 mb-2">
                    <section.icon className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{section.title}</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {section.items.map((item) => {
                      const isActive = item.href === `/docs/${path}`;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`block text-sm py-1 ${
                              isActive 
                                ? 'text-primary-600 font-medium' 
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {item.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <article className="max-w-3xl mx-auto px-6 py-12">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
              <Link href="/docs" className="hover:text-slate-900 dark:hover:text-white">Docs</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-slate-900 dark:text-white">{doc.category}</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-slate-900 dark:text-white">{doc.title}</span>
            </nav>

            {/* Header */}
            <header className="mb-10">
              <Badge variant="outline" className="mb-4">{doc.category}</Badge>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">{doc.title}</h1>
              <p className="text-xl text-slate-600 dark:text-slate-300">{doc.description}</p>
            </header>

            {/* Content */}
            <div className="prose-lg">
              {renderContent(doc.content)}
            </div>
          </article>
        </main>
      </div>
      <Footer />
    </div>
  );
}
