import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, blogPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const mockPosts = [
  {
    slug: 'getting-started-with-startfast',
    title: 'Getting Started with StartFast Pro',
    excerpt: 'Learn how to set up your first project with StartFast Pro and deploy to production in minutes.',
    content: `# Getting Started with StartFast Pro

Welcome to StartFast Pro! This guide will help you set up your first project and deploy it to production.

## Prerequisites

Before you begin, make sure you have:
- Node.js 18+ installed
- A PostgreSQL database (we recommend Neon or Supabase)
- A Stripe account for payments

## Installation

\`\`\`bash
git clone https://github.com/your-repo/startfast-pro
cd startfast-pro
npm install
\`\`\`

## Environment Setup

Copy the example environment file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in your environment variables:
- \`DATABASE_URL\`: Your PostgreSQL connection string
- \`BETTER_AUTH_SECRET\`: A random secret for authentication
- \`STRIPE_SECRET_KEY\`: Your Stripe secret key

## Running the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see your app!

## Deploying to Production

StartFast Pro is optimized for Vercel deployment:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your environment variables
4. Deploy!

That's it! You now have a fully functional SaaS application running in production.`,
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop',
    published: true,
    publishedAt: new Date('2024-03-10'),
    locale: 'en',
    category: 'Tutorial',
    tags: ['setup', 'deployment', 'getting-started'],
    readingTime: '5 min',
    metaTitle: 'Getting Started with StartFast Pro - Complete Setup Guide',
    metaDescription: 'Learn how to set up your first project with StartFast Pro and deploy to production in minutes.',
  },
  {
    slug: 'internationalization-guide',
    title: 'Complete Guide to Internationalization',
    excerpt: 'A comprehensive guide to implementing multi-language support in your SaaS application.',
    content: `# Complete Guide to Internationalization

Building a global SaaS product requires proper internationalization (i18n). StartFast Pro uses next-intl for seamless multi-language support.

## Supported Languages

Out of the box, StartFast Pro supports:
- English (en)
- 中文 (zh)
- 日本語 (ja)
- 한국어 (ko)
- Español (es)
- Français (fr)
- Deutsch (de)

## Adding Translations

Translations are stored in \`messages/\` directory:

\`\`\`
messages/
├── en.json
├── zh.json
├── ja.json
└── ...
\`\`\`

## Using Translations in Components

\`\`\`tsx
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');
  
  return <h1>{t('welcome')}</h1>;
}
\`\`\`

## Language Switcher

The built-in language switcher automatically detects user preferences and allows manual language selection.

## URL Structure

StartFast Pro uses locale prefixes in URLs:
- \`/en/dashboard\` - English
- \`/zh/dashboard\` - Chinese
- \`/ja/dashboard\` - Japanese

This structure is SEO-friendly and helps search engines index your content in multiple languages.`,
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
    published: true,
    publishedAt: new Date('2024-03-08'),
    locale: 'en',
    category: 'Guide',
    tags: ['i18n', 'localization', 'next-intl'],
    readingTime: '8 min',
    metaTitle: 'Complete Internationalization Guide for Next.js SaaS',
    metaDescription: 'Learn how to implement multi-language support in your SaaS application with next-intl.',
  },
  {
    slug: 'role-based-access-control',
    title: 'Implementing Role-Based Access Control',
    excerpt: 'Learn how to set up granular permissions and team management in your application.',
    content: `# Implementing Role-Based Access Control

Security is paramount in any SaaS application. StartFast Pro includes a comprehensive RBAC system out of the box.

## Role Hierarchy

StartFast Pro defines four roles:

| Role | Description |
|------|-------------|
| Owner | Full access, can transfer ownership |
| Admin | Can manage members and most settings |
| Member | Can create and edit content |
| Viewer | Read-only access |

## Permission System

Each role has specific permissions:

\`\`\`typescript
const permissions = {
  'organization:delete': ['owner'],
  'member:update_role': ['owner'],
  'member:invite': ['owner', 'admin'],
  'content:create': ['owner', 'admin', 'member'],
  'content:read': ['owner', 'admin', 'member', 'viewer'],
};
\`\`\`

## Checking Permissions

Use the \`hasPermission\` helper:

\`\`\`typescript
import { hasPermission } from '@/lib/permissions';

if (hasPermission(user.role, 'content:create')) {
  // Allow content creation
}
\`\`\`

## Team Management

Admins can invite team members and assign roles through the admin dashboard. Invitations are sent via email with secure tokens.

## Best Practices

1. Always check permissions on both client and server
2. Use the principle of least privilege
3. Audit role changes for security compliance`,
    coverImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop',
    published: true,
    publishedAt: new Date('2024-03-05'),
    locale: 'en',
    category: 'Guide',
    tags: ['security', 'permissions', 'rbac', 'teams'],
    readingTime: '10 min',
    metaTitle: 'Role-Based Access Control Guide for SaaS Applications',
    metaDescription: 'Learn how to implement secure role-based access control in your SaaS application.',
  },
  {
    slug: 'stripe-integration-deep-dive',
    title: 'Deep Dive into Stripe Integration',
    excerpt: 'Everything you need to know about handling payments, subscriptions, and webhooks.',
    content: `# Deep Dive into Stripe Integration

Monetization is key to any SaaS business. StartFast Pro includes a complete Stripe integration for subscriptions and one-time payments.

## Setting Up Stripe

1. Create a Stripe account at stripe.com
2. Get your API keys from the dashboard
3. Add them to your environment:

\`\`\`
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
\`\`\`

## Creating Products

Define your products in Stripe Dashboard or via API:

\`\`\`typescript
const product = await stripe.products.create({
  name: 'Pro Plan',
  description: 'Full access to all features',
});

const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 2900, // $29.00
  currency: 'usd',
  recurring: { interval: 'month' },
});
\`\`\`

## Checkout Flow

StartFast Pro uses Stripe Checkout for secure payments:

\`\`\`typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: \`\${baseUrl}/dashboard?success=true\`,
  cancel_url: \`\${baseUrl}/pricing\`,
});
\`\`\`

## Webhook Handling

Handle subscription events in your webhook endpoint:

- \`customer.subscription.created\`
- \`customer.subscription.updated\`
- \`customer.subscription.deleted\`
- \`invoice.paid\`
- \`invoice.payment_failed\`

## Customer Portal

Let customers manage their subscriptions through the Stripe Customer Portal, already integrated in StartFast Pro.`,
    coverImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
    published: true,
    publishedAt: new Date('2024-03-01'),
    locale: 'en',
    category: 'Tutorial',
    tags: ['payments', 'stripe', 'subscriptions'],
    readingTime: '12 min',
    metaTitle: 'Complete Stripe Integration Guide for SaaS',
    metaDescription: 'Learn how to integrate Stripe payments and subscriptions in your SaaS application.',
  },
  {
    slug: 'analytics-with-posthog',
    title: 'Product Analytics with PostHog',
    excerpt: 'How to track user behavior and make data-driven decisions using PostHog analytics.',
    content: `# Product Analytics with PostHog

Understanding your users is crucial for building successful products. StartFast Pro integrates PostHog for comprehensive product analytics.

## Why PostHog?

- Open source and privacy-focused
- Feature flags and A/B testing
- Session recordings
- Self-hostable option

## Setup

Add your PostHog credentials:

\`\`\`
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
\`\`\`

## Tracking Events

Track custom events throughout your app:

\`\`\`typescript
import { trackEvent } from '@/lib/analytics';

// Track a button click
trackEvent('button_clicked', {
  button_name: 'upgrade_plan',
  page: 'pricing',
});

// Track a feature usage
trackEvent('feature_used', {
  feature: 'export_data',
  format: 'csv',
});
\`\`\`

## Identifying Users

Link analytics data to user accounts:

\`\`\`typescript
import { identifyUser } from '@/lib/analytics';

identifyUser(user.id, {
  email: user.email,
  name: user.name,
  plan: subscription.plan,
});
\`\`\`

## Dashboard Insights

PostHog provides powerful dashboards for:
- User funnels
- Retention analysis
- Feature adoption
- Conversion tracking

## Privacy Compliance

StartFast Pro respects user privacy preferences and integrates with cookie consent mechanisms.`,
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    published: true,
    publishedAt: new Date('2024-02-25'),
    locale: 'en',
    category: 'Guide',
    tags: ['analytics', 'posthog', 'tracking'],
    readingTime: '7 min',
    metaTitle: 'PostHog Analytics Integration for SaaS',
    metaDescription: 'Learn how to implement product analytics with PostHog in your SaaS application.',
  },
  {
    slug: 'email-with-resend',
    title: 'Transactional Emails with Resend',
    excerpt: 'Build beautiful, reliable transactional emails using Resend and React Email.',
    content: `# Transactional Emails with Resend

Great email communication builds trust with your users. StartFast Pro uses Resend for reliable transactional emails.

## Why Resend?

- Developer-friendly API
- React Email support
- High deliverability
- Simple pricing

## Configuration

Add your Resend API key:

\`\`\`
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
\`\`\`

## Sending Emails

\`\`\`typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: process.env.EMAIL_FROM,
  to: user.email,
  subject: 'Welcome to StartFast Pro!',
  html: welcomeEmailHtml,
});
\`\`\`

## Email Templates

StartFast Pro includes templates for:
- Welcome emails
- Email verification
- Password reset
- Subscription confirmations
- Team invitations
- Security alerts

## Testing

Use Resend's test mode to preview emails without sending them to real addresses.`,
    coverImage: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&h=400&fit=crop',
    published: true,
    publishedAt: new Date('2024-02-20'),
    locale: 'en',
    category: 'Tutorial',
    tags: ['email', 'resend', 'notifications'],
    readingTime: '6 min',
    metaTitle: 'Transactional Email Guide with Resend',
    metaDescription: 'Learn how to send transactional emails using Resend in your SaaS application.',
  },
];

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser.length || (currentUser[0].role !== 'admin' && currentUser[0].role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Insert mock posts
    const insertedPosts = [];
    for (const post of mockPosts) {
      try {
        const newPost = await db.insert(blogPosts).values({
          id: nanoid(),
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          authorId: session.user.id,
          published: post.published,
          publishedAt: post.publishedAt,
          locale: post.locale,
          category: post.category,
          tags: post.tags,
          readingTime: post.readingTime,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
        }).onConflictDoNothing().returning();
        
        if (newPost.length > 0) {
          insertedPosts.push(newPost[0]);
        }
      } catch {
        console.log(`Post ${post.slug} might already exist, skipping...`);
      }
    }

    return NextResponse.json({
      message: `Successfully seeded ${insertedPosts.length} blog posts`,
      posts: insertedPosts,
    });
  } catch (error) {
    console.error('Error seeding content:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
