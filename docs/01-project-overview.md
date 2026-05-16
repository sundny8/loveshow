# Project Overview

> **Document Version:** 1.0  
> **Last Updated:** 2024-03-16  
> **Status:** Active

---

## 1. Project Introduction

### 1.1 Product Name
**StartFast Pro** - Premium Next.js SaaS Boilerplate

### 1.2 Product Positioning
A production-ready SaaS boilerplate that helps developers ship their SaaS products 10x faster. It includes authentication, payments, i18n, role-based access control, analytics, and more.

### 1.3 Target Users
- Indie hackers building SaaS products
- Startups needing rapid MVP development
- Development teams looking for a solid foundation
- Agencies building multi-tenant applications

---

## 2. Technical Architecture

### 2.1 Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 15 |
| UI Library | React | 19 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 3.4 |
| Database ORM | Drizzle ORM | Latest |
| Database | PostgreSQL | 15+ |
| Authentication | Better-Auth | Latest |
| Payments | Stripe | Latest |
| Email | Resend | Latest |
| i18n | next-intl | Latest |
| Analytics | Posthog | Latest |
| Testing | Playwright | Latest |

### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Next.js App Router                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │ │
│  │  │  Landing │  │   Auth   │  │Dashboard │  │    Admin     │ │ │
│  │  │   Page   │  │  Pages   │  │  Pages   │  │   Backend    │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │   Auth   │  │   User   │  │   Org    │  │     Admin        │ │
│  │   API    │  │   API    │  │   API    │  │      API         │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │   RBAC   │  │Payments  │  │   Email  │  │    Analytics     │ │
│  │  System  │  │ (Stripe) │  │ (Resend) │  │    (Posthog)     │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     Drizzle ORM                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     PostgreSQL                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Directory Structure

```
startfast-pro/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── admin/         # Admin APIs
│   │   │   ├── auth/          # Auth APIs
│   │   │   ├── blog/          # Blog APIs
│   │   │   ├── invitations/   # Invitation APIs
│   │   │   ├── organizations/ # Organization APIs
│   │   │   └── user/          # User APIs
│   │   └── [locale]/          # i18n routes
│   │       ├── admin/         # Admin pages
│   │       ├── auth/          # Auth pages
│   │       ├── blog/          # Blog pages
│   │       ├── dashboard/     # User dashboard
│   │       ├── docs/          # Documentation
│   │       └── invite/        # Invitation pages
│   ├── components/
│   │   ├── layout/            # Header, Footer, Sidebar
│   │   ├── sections/          # Landing page sections
│   │   └── ui/                # Reusable UI components
│   ├── db/
│   │   ├── index.ts           # Database connection
│   │   └── schema.ts          # Drizzle schema
│   ├── i18n/
│   │   ├── messages/          # Translation files (7 languages)
│   │   ├── request.ts         # i18n request config
│   │   └── routing.ts         # Locale routing
│   └── lib/
│       ├── analytics.ts       # Posthog analytics
│       ├── auth.ts            # Better-Auth config
│       ├── auth-client.ts     # Auth client hooks
│       ├── permissions.ts     # RBAC permissions
│       └── utils.ts           # Utility functions
├── docs/                       # Project documentation
├── tests/                      # Playwright E2E tests
├── drizzle.config.ts          # Drizzle config
├── next.config.ts             # Next.js config
├── playwright.config.ts       # Playwright config
└── tailwind.config.ts         # Tailwind config
```

---

## 3. Core Modules

| Module | Description | Documentation |
|--------|-------------|---------------|
| Authentication | User registration, login, OAuth, sessions | [02-authentication.md](./02-authentication.md) |
| User Dashboard | Profile, billing, settings, organizations | [03-user-dashboard.md](./03-user-dashboard.md) |
| Organization | Multi-tenant org management, members, invitations | [04-organization-requirements.md](./organization-requirements.md) |
| Admin Backend | System management, users, content, analytics | [05-admin-backend.md](./05-admin-backend.md) |
| Blog System | MDX blog with categories and SEO | [06-blog-system.md](./06-blog-system.md) |
| RBAC | Role-based access control, permissions | [07-rbac-permissions.md](./07-rbac-permissions.md) |
| i18n | Internationalization, 7 languages | [08-internationalization.md](./08-internationalization.md) |
| API | REST API endpoints | [09-api-reference.md](./09-api-reference.md) |

---

## 4. Database Schema

### 4.1 Core Tables

```
┌─────────────────┐      ┌─────────────────────┐
│     users       │      │    organizations    │
├─────────────────┤      ├─────────────────────┤
│ id              │      │ id                  │
│ name            │      │ name                │
│ email           │◄────►│ ownerId             │
│ password        │      │ slug                │
│ role            │      │ description         │
│ emailVerified   │      │ logo                │
│ image           │      │ createdAt           │
│ createdAt       │      │ updatedAt           │
│ updatedAt       │      └─────────────────────┘
└─────────────────┘               │
         │                        │
         │                        ▼
         │              ┌─────────────────────┐
         │              │  organizationMembers│
         │              ├─────────────────────┤
         └─────────────►│ id                  │
                        │ organizationId      │
                        │ userId              │
                        │ role                │
                        │ joinedAt            │
                        └─────────────────────┘

┌─────────────────┐      ┌─────────────────────┐
│   invitations   │      │    subscriptions    │
├─────────────────┤      ├─────────────────────┤
│ id              │      │ id                  │
│ email           │      │ userId              │
│ organizationId  │      │ stripeCustomerId    │
│ role            │      │ stripePriceId       │
│ token           │      │ status              │
│ status          │      │ currentPeriodEnd    │
│ expiresAt       │      │ createdAt           │
│ invitedBy       │      └─────────────────────┘
│ createdAt       │
└─────────────────┘

┌─────────────────┐      ┌─────────────────────┐
│    sessions     │      │     accounts        │
├─────────────────┤      ├─────────────────────┤
│ id              │      │ id                  │
│ userId          │      │ userId              │
│ token           │      │ provider            │
│ expiresAt       │      │ providerAccountId   │
│ ipAddress       │      │ accessToken         │
│ userAgent       │      │ refreshToken        │
│ createdAt       │      │ expiresAt           │
└─────────────────┘      └─────────────────────┘
```

---

## 5. Environment Configuration

### 5.1 Required Environment Variables

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=StartFast Pro

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/startfast_pro

# Authentication
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=onboarding@yourdomain.com

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Analytics (Posthog)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 6. Development Workflow

### 6.1 Setup Commands

```bash
# Install dependencies
npm install

# Setup database
npm run db:push

# Start development server
npm run dev
```

### 6.2 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run test` | Run Playwright tests |
| `npm run test:ui` | Run Playwright tests with UI |

---

## 7. Deployment

### 7.1 Supported Platforms

- **Vercel** (Recommended)
- Railway
- Render
- AWS Amplify
- Docker

### 7.2 Vercel Deployment Steps

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

---

## 8. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-16 | Initial documentation |
