# Technical Architecture Document

> **Document Version:** 1.0  
> **Last Updated:** 2024-03-16  
> **Status:** Active

---

## 1. System Overview

### 1.1 Product Summary
**StartFast Pro** is a production-ready Next.js SaaS boilerplate featuring authentication, multi-tenancy, payments, internationalization, role-based access control, and analytics.

### 1.2 Architecture Pattern
- **Frontend:** React 19 with Next.js 15 App Router (Server Components + Client Components)
- **Backend:** Next.js API Routes (Serverless Functions)
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Better-Auth with session-based JWT
- **Styling:** Tailwind CSS with custom design system

---

## 2. High-Level Architecture

### 2.1 System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Browser / Mobile                            │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │   │  Public  │  │   Auth   │  │Dashboard │  │    Admin     │   │   │
│  │   │  Pages   │  │  Pages   │  │  Pages   │  │   Backend    │   │   │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS SERVER                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        Middleware Layer                          │   │
│  │   i18n Routing │ Auth Protection │ Admin Access Control         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌────────────────────────┬────────────────────────────────────────┐   │
│  │     Server Components  │           API Routes                    │   │
│  │  ┌──────────────────┐  │  ┌─────────────────────────────────┐   │   │
│  │  │   React Server   │  │  │  /api/auth/*    Authentication  │   │   │
│  │  │   Components     │  │  │  /api/user/*    User Profile     │   │   │
│  │  │   (RSC)          │  │  │  /api/organizations/*  Orgs     │   │   │
│  │  └──────────────────┘  │  │  /api/invitations/* Invites      │   │   │
│  │                        │  │  /api/admin/*   Admin APIs        │   │   │
│  │  ┌──────────────────┐  │  │  /api/blog/*    Blog Content     │   │   │
│  │  │   Client         │  │  └─────────────────────────────────┘   │   │
│  │  │   Components     │  │                                        │   │
│  │  │   (Interactivity)│  │                                        │   │
│  │  └──────────────────┘  │                                        │   │
│  └────────────────────────┴────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │ Better   │  │  Stripe  │  │  Resend  │  │ Posthog  │  │ Drizzle │  │
│  │ Auth     │  │ Payments │  │  Email   │  │Analytics │  │   ORM   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        PostgreSQL                                │   │
│  │   users │ sessions │ accounts │ organizations │ subscriptions   │   │
│  │   invitations │ blog_posts │ analytics_events │ verifications   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

```
User Request
     │
     ▼
┌──────────────┐
│  Middleware  │ ──► i18n locale detection
│              │ ──► Authentication check
│              │ ──► Admin role verification
└──────────────┘
     │
     ▼
┌──────────────┐
│   Routing    │ ──► /[locale]/page routes
│              │ ──► /api/* API routes
└──────────────┘
     │
     ▼
┌──────────────┐
│   Handler    │ ──► Server Component / API Route
└──────────────┘
     │
     ▼
┌──────────────┐
│  Database    │ ──► Drizzle ORM queries
└──────────────┘
     │
     ▼
Response
```

---

## 3. Technology Stack

### 3.1 Core Dependencies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 15.1.7 | React framework with App Router |
| **UI Library** | React | 19.0.0 | Component library |
| **Language** | TypeScript | 5.7.0 | Type safety |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS |
| **Database ORM** | Drizzle ORM | 0.45.0 | Type-safe database operations |
| **Database Driver** | postgres | 3.4.5 | PostgreSQL client |
| **Database** | PostgreSQL | 15+ | Relational database |

### 3.2 Authentication & Security

| Technology | Version | Purpose |
|------------|---------|---------|
| better-auth | 1.2.0 | Authentication library |
| zod | 3.24.0 | Schema validation |

### 3.3 External Services

| Service | Library | Purpose |
|---------|---------|---------|
| Stripe | stripe@17.0.0 | Payment processing |
| Resend | resend@4.0.0 | Transactional email |
| Posthog | posthog-js@1.203.0 | Analytics & tracking |

### 3.4 Internationalization

| Technology | Version | Purpose |
|------------|---------|---------|
| next-intl | 3.26.0 | i18n routing and translations |

### 3.5 UI & Utilities

| Library | Version | Purpose |
|---------|---------|---------|
| lucide-react | 0.468.0 | Icon library |
| clsx | 2.1.1 | Conditional class names |
| tailwind-merge | 2.6.0 | Tailwind class merging |
| date-fns | 4.1.0 | Date utilities |
| nanoid | 5.0.9 | ID generation |
| next-themes | 0.4.4 | Dark mode support |

### 3.6 Blog & Content

| Library | Purpose |
|---------|---------|
| gray-matter | Frontmatter parsing |
| remark / remark-html | Markdown processing |
| rehype-highlight | Syntax highlighting |
| rehype-slug | Heading IDs |
| reading-time | Reading time calculation |

### 3.7 Development & Testing

| Tool | Version | Purpose |
|------|---------|---------|
| drizzle-kit | 0.31.9 | Database migrations |
| Playwright | 1.49.0 | E2E testing |
| ESLint | 9.0.0 | Code linting |

---

## 4. Database Architecture

### 4.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE SCHEMA                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────────┐     │
│  │   users     │──────────│  sessions   │          │   accounts      │     │
│  ├─────────────┤    1:N   ├─────────────┤    1:N   ├─────────────────┤     │
│  │ id (PK)     │◄─────────│ userId (FK) │◄─────────│ userId (FK)     │     │
│  │ name        │          │ token       │          │ providerId      │     │
│  │ email       │          │ expiresAt   │          │ accessToken     │     │
│  │ role        │          │ ipAddress   │          │ refreshToken    │     │
│  │ emailVerified│         │ userAgent   │          │ password        │     │
│  │ image       │          └─────────────┘          └─────────────────┘     │
│  │ locale      │                                                            │
│  │ createdAt   │                                                            │
│  └─────────────┘                                                            │
│         │                                                                   │
│         │ 1:N                                                               │
│         ▼                                                                   │
│  ┌─────────────────┐       ┌───────────────────────┐                       │
│  │  subscriptions  │       │    organizations      │                       │
│  ├─────────────────┤       ├───────────────────────┤                       │
│  │ id (PK)         │       │ id (PK)               │                       │
│  │ userId (FK)     │       │ name                  │                       │
│  │ stripeCustomerId│       │ slug (UNIQUE)         │                       │
│  │ stripeSubId     │       │ logo                  │                       │
│  │ status          │       │ ownerId (FK) ─────────┼───► users.id          │
│  │ plan            │       │ createdAt             │                       │
│  └─────────────────┘       └───────────────────────┘                       │
│                                      │                                      │
│                                      │ 1:N                                  │
│                                      ▼                                      │
│                            ┌───────────────────────┐                       │
│                            │ organization_members  │                       │
│                            ├───────────────────────┤                       │
│                            │ id (PK)               │                       │
│  users.id ◄────────────────│ userId (FK)           │                       │
│  organizations.id ◄────────│ organizationId (FK)   │                       │
│                            │ role (enum)           │                       │
│                            │ createdAt             │                       │
│                            └───────────────────────┘                       │
│                                                                             │
│  ┌───────────────────────┐          ┌───────────────────────┐              │
│  │     invitations       │          │      blog_posts       │              │
│  ├───────────────────────┤          ├───────────────────────┤              │
│  │ id (PK)               │          │ id (PK)               │              │
│  │ email                 │          │ slug (UNIQUE)         │              │
│  │ organizationId (FK) ──┼──►orgs   │ title                 │              │
│  │ role (enum)           │          │ content               │              │
│  │ token (UNIQUE)        │          │ authorId (FK) ────────┼───► users   │
│  │ status (enum)         │          │ published             │              │
│  │ invitedBy (FK) ───────┼───►users │ tags[]                │              │
│  │ expiresAt             │          │ category              │              │
│  └───────────────────────┘          └───────────────────────┘              │
│                                                                             │
│  ┌───────────────────────┐          ┌───────────────────────┐              │
│  │    verifications      │          │   analytics_events    │              │
│  ├───────────────────────┤          ├───────────────────────┤              │
│  │ id (PK)               │          │ id (PK)               │              │
│  │ identifier            │          │ eventName             │              │
│  │ value                 │          │ userId (FK)           │              │
│  │ expiresAt             │          │ sessionId             │              │
│  └───────────────────────┘          │ properties (JSON)     │              │
│                                     │ timestamp             │              │
│                                     └───────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Table Specifications

| Table | Records | Purpose | Key Relationships |
|-------|---------|---------|-------------------|
| `users` | Core | User accounts | Root entity |
| `sessions` | Auth | Active sessions | FK → users |
| `accounts` | Auth | OAuth accounts | FK → users |
| `verifications` | Auth | Email/password verification | - |
| `subscriptions` | Billing | Stripe subscriptions | FK → users |
| `organizations` | Multi-tenant | Team/workspace | FK → users (owner) |
| `organization_members` | Multi-tenant | Team membership | FK → users, organizations |
| `invitations` | Multi-tenant | Team invites | FK → users, organizations |
| `blog_posts` | Content | Blog articles | FK → users (author) |
| `analytics_events` | Analytics | Event tracking | FK → users (optional) |

### 4.3 Enums

```typescript
// Role hierarchy (system & organization level)
roleEnum = ['owner', 'admin', 'member', 'viewer']

// Invitation status lifecycle
inviteStatusEnum = ['pending', 'accepted', 'expired', 'revoked']
```

---

## 5. Authentication Architecture

### 5.1 Better-Auth Configuration

```typescript
// src/lib/auth.ts
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: { enabled: true, autoSignIn: true },
  socialProviders: {
    google: { clientId, clientSecret },
    github: { clientId, clientSecret },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days
    updateAge: 60 * 60 * 24,      // Refresh daily
  },
});
```

### 5.2 Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOWS                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Email/Password Flow:                                            │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Sign Up │───►│  Create  │───►│  Create  │───►│ Redirect │  │
│  │   Form   │    │   User   │    │ Session  │    │Dashboard │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                  │
│  OAuth Flow:                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  OAuth   │───►│ Provider │───►│ Callback │───►│ Create/  │  │
│  │  Button  │    │  Consent │    │  Handler │    │Link User │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                  │
│  Session Management:                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  Every   │───►│  Verify  │───►│  Refresh │                   │
│  │ Request  │    │  Token   │    │ If Needed│                   │
│  └──────────┘    └──────────┘    └──────────┘                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Session Storage
- **Token:** JWT stored in HTTP-only secure cookie
- **Duration:** 7 days with daily refresh
- **Security:** SameSite=Lax, Secure flag in production

---

## 6. Multi-Tenancy Architecture

### 6.1 Organization Model

```
┌─────────────────────────────────────────────────────────────┐
│                    MULTI-TENANCY MODEL                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User ─────────────────────────┐                            │
│    │                           │                            │
│    │ can belong to             │ owns (system role)         │
│    │ multiple orgs             │                            │
│    ▼                           ▼                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Organization (Workspace)                │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  Members                                       │  │   │
│  │  │   ├─ Owner (1)    ◄── Full control            │  │   │
│  │  │   ├─ Admins (N)   ◄── Manage members          │  │   │
│  │  │   ├─ Members (N)  ◄── Access resources        │  │   │
│  │  │   └─ Viewers (N)  ◄── Read-only               │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  Invitations                                   │  │   │
│  │  │   ├─ Token-based (unique, expires in 7 days)  │  │   │
│  │  │   └─ Status: pending → accepted/revoked       │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Two-Level RBAC

```
┌───────────────────────────────────────────────────────────┐
│                   RBAC ARCHITECTURE                        │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  SYSTEM LEVEL (users.role)                                │
│  ─────────────────────────                                │
│  Controls: /admin access, system-wide permissions         │
│                                                           │
│  owner ──► admin ──► member ──► viewer                    │
│    │        │         │          │                        │
│    │        │         │          └─ Read-only dashboard   │
│    │        │         └─ User dashboard, create content   │
│    │        └─ Admin panel access, manage users           │
│    └─ Full system access, promote admins                  │
│                                                           │
│  ORGANIZATION LEVEL (organization_members.role)           │
│  ──────────────────────────────────────────               │
│  Controls: Per-organization permissions                   │
│                                                           │
│  owner ──► admin ──► member ──► viewer                    │
│    │        │         │          │                        │
│    │        │         │          └─ View org resources    │
│    │        │         └─ Access org resources             │
│    │        └─ Manage members, settings                   │
│    └─ Delete org, transfer ownership                      │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 7. Internationalization Architecture

### 7.1 Locale Configuration

```typescript
// src/i18n/routing.ts
export const locales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de'] as const;

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'as-needed',  // Only prefix non-default locales
  localeDetection: false,
});
```

### 7.2 URL Structure

```
┌────────────────────────────────────────────────────────────┐
│                    i18n URL PATTERNS                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Default locale (en):                                      │
│    /dashboard          ◄── No prefix needed                │
│    /admin              ◄── Clean URLs                      │
│    /blog/my-post                                           │
│                                                            │
│  Other locales:                                            │
│    /zh/dashboard       ◄── Chinese                         │
│    /ja/admin           ◄── Japanese                        │
│    /ko/blog/my-post    ◄── Korean                          │
│    /es/pricing         ◄── Spanish                         │
│    /fr/features        ◄── French                          │
│    /de/about           ◄── German                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 7.3 Translation File Structure

```
src/i18n/messages/
├── en.json    # English (default)
├── zh.json    # Chinese
├── ja.json    # Japanese
├── ko.json    # Korean
├── es.json    # Spanish
├── fr.json    # French
└── de.json    # German

Each file structure:
{
  "common": { ... },      // Shared translations
  "nav": { ... },         // Navigation
  "auth": { ... },        // Authentication
  "dashboard": { ... },   // Dashboard
  "admin": { ... },       // Admin panel
  "blog": { ... },        // Blog
  ...
}
```

---

## 8. API Architecture

### 8.1 API Route Structure

```
src/app/api/
├── auth/                      # Better-Auth endpoints
│   └── [...all]/route.ts
├── user/                      # User profile APIs
│   └── profile/route.ts
├── organizations/             # Organization APIs
│   ├── route.ts              # List/Create orgs
│   └── [id]/
│       ├── route.ts          # Get/Update/Delete org
│       ├── leave/route.ts    # Leave org
│       ├── transfer/route.ts # Transfer ownership
│       ├── members/
│       │   ├── route.ts      # List/Add members
│       │   └── [memberId]/route.ts
│       └── invitations/
│           ├── route.ts      # List/Create invitations
│           └── [invitationId]/route.ts
├── invitations/               # Public invitation APIs
│   └── [token]/
│       ├── route.ts          # Get invitation
│       ├── accept/route.ts   # Accept invitation
│       └── decline/route.ts  # Decline invitation
├── blog/                      # Public blog APIs
│   └── route.ts
└── admin/                     # Admin APIs (protected)
    ├── stats/route.ts
    ├── users/route.ts
    ├── organizations/route.ts
    ├── invitations/route.ts
    └── content/route.ts
```

### 8.2 API Response Patterns

```typescript
// Success Response
{ data: T, message?: string }

// Error Response
{ error: string, code?: string }

// Paginated Response
{
  data: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

---

## 9. Security Architecture

### 9.1 Security Layers

```
┌────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Layer 1: Network                                          │
│  ─────────────────                                         │
│  • HTTPS only                                              │
│  • Rate limiting (10 auth / 100 API requests per minute)   │
│                                                            │
│  Layer 2: Authentication                                   │
│  ───────────────────────                                   │
│  • Session-based JWT                                       │
│  • HTTP-only secure cookies                                │
│  • OAuth2 for social login                                 │
│                                                            │
│  Layer 3: Authorization                                    │
│  ──────────────────────                                    │
│  • System-level RBAC                                       │
│  • Organization-level RBAC                                 │
│  • Middleware protection for /admin routes                 │
│                                                            │
│  Layer 4: Data                                             │
│  ────────────                                              │
│  • Input validation (Zod)                                  │
│  • SQL injection prevention (Drizzle parameterized)        │
│  • XSS prevention (React auto-escaping)                    │
│                                                            │
│  Layer 5: Application                                      │
│  ────────────────────                                      │
│  • CSRF protection (SameSite cookies)                      │
│  • Security headers                                        │
│  • Environment variable protection                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 9.2 Password Security
- Hashing: bcrypt with cost factor 10
- Minimum length: 8 characters

### 9.3 Token Security
- Invitation tokens: nanoid (21 chars), 7-day expiration
- Session tokens: JWT, 7-day expiration with daily refresh

---

## 10. Deployment Architecture

### 10.1 Recommended Stack

```
┌────────────────────────────────────────────────────────────┐
│                 PRODUCTION DEPLOYMENT                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                    Vercel                             │ │
│  │  • Automatic deployments from GitHub                  │ │
│  │  • Edge network CDN                                   │ │
│  │  • Serverless functions                               │ │
│  │  • Preview deployments                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                          │                                 │
│                          ▼                                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │               Managed PostgreSQL                      │ │
│  │  Options: Neon, Supabase, Railway, AWS RDS           │ │
│  └──────────────────────────────────────────────────────┘ │
│                          │                                 │
│                          ▼                                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              External Services                        │ │
│  │  • Stripe (Payments)                                  │ │
│  │  • Resend (Email)                                     │ │
│  │  • Posthog (Analytics)                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 10.2 Environment Variables

```env
# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=StartFast Pro

# Database
DATABASE_URL=postgresql://...

# Authentication
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://yourdomain.com

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Services
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
RESEND_API_KEY=...
EMAIL_FROM=...
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...
```

---

## 11. Performance Considerations

### 11.1 Optimization Strategies

| Area | Strategy |
|------|----------|
| **Rendering** | Server Components by default, Client Components for interactivity |
| **Data Fetching** | Parallel data fetching, React Suspense |
| **Images** | next/image with automatic optimization |
| **Code Splitting** | Automatic per-route splitting |
| **Caching** | Static generation where possible, ISR for blog |
| **Database** | Connection pooling, indexed queries |

### 11.2 Performance Targets

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| TTFB (Time to First Byte) | < 200ms |

---

## 12. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-16 | Initial architecture documentation |
