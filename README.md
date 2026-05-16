# StartFast Pro

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-Personal%20Use-blue?style=flat-square" alt="License" />
</p>

<p align="center">
  <strong>Premium Next.js SaaS Boilerplate with Advanced Features</strong>
</p>

<p align="center">
  Ship your SaaS 10x faster with authentication, payments, i18n, role-based access, analytics, and more.
</p>

---

## ✨ Features

### Everything in Free
- **Authentication** - Secure auth with Better-Auth (email/password, OAuth, magic links)
- **Payments** - Stripe integration for subscriptions and one-time payments
- **Email** - Transactional emails with Resend
- **Database** - Type-safe operations with Drizzle ORM and PostgreSQL
- **Dark Mode** - Beautiful dark mode with system preference detection
- **SEO** - Built-in meta tags, Open Graph, and JSON-LD

### Pro Exclusive Features

#### 🌍 Internationalization (i18n)
- 7 languages supported out of the box (English, Chinese, Japanese, Korean, Spanish, French, German)
- Easy to add new locales
- SEO-friendly URL structure
- Language switcher component

#### 👥 Role-Based Access Control
- Granular permissions (Owner, Admin, Member, Viewer)
- Organization/Team management
- Team invitation system
- Permission-based UI rendering

#### 📊 Analytics Ready (Posthog)
- Pre-configured analytics hooks
- User identification and tracking
- Custom event tracking
- Page view analytics

#### 📝 Advanced Blog System
- MDX-powered blog
- Reading time calculation
- Category and tag support
- SEO optimization

#### 🧪 E2E Testing
- Playwright tests pre-configured
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile responsive tests
- CI/CD workflow ready

#### 🎨 Pro UI Kit
- DataTable (sortable, searchable, paginated)
- Modal dialogs
- Tabs component
- Toast notifications
- Dropdown menus
- Avatar component
- Badge variants

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Harries/startfast-pro.git
   cd startfast-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure your `.env.local`**
   ```env
   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME=StartFast Pro

   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/startfast_pro

   # Authentication
   BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters
   BETTER_AUTH_URL=http://localhost:3000

   # Email (Resend)
   RESEND_API_KEY=re_xxxxx
   EMAIL_FROM=onboarding@yourdomain.com

   # Stripe
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

   # OAuth (Optional)
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=

   # Analytics (Posthog)
   NEXT_PUBLIC_POSTHOG_KEY=
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

5. **Set up the database**
   ```bash
   npm run db:push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open [http://localhost:3000](http://localhost:3000)**

---

## 📁 Project Structure

```
startfast-pro/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── blog/              # Blog pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/
│   │   ├── layout/            # Header, Footer
│   │   ├── sections/          # Landing page sections
│   │   └── ui/                # Reusable UI components
│   ├── db/
│   │   ├── index.ts           # Database connection
│   │   └── schema.ts          # Drizzle schema
│   ├── i18n/
│   │   ├── messages/          # Translation files
│   │   ├── request.ts         # i18n request config
│   │   └── routing.ts         # Locale routing
│   └── lib/
│       ├── analytics.ts       # Posthog analytics
│       ├── auth.ts            # Better-Auth config
│       ├── auth-client.ts     # Auth client hooks
│       ├── permissions.ts     # RBAC permissions
│       └── utils.ts           # Utility functions
├── tests/                      # Playwright tests
├── .github/workflows/          # CI/CD workflows
├── drizzle.config.ts          # Drizzle config
├── next.config.ts             # Next.js config
├── playwright.config.ts       # Playwright config
├── tailwind.config.ts         # Tailwind config
└── tsconfig.json              # TypeScript config
```

---

## 🔧 Available Scripts

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

## 🌍 Internationalization

### Supported Locales

| Locale | Language |
|--------|----------|
| `en` | English (default) |
| `zh` | 中文 (Chinese) |
| `ja` | 日本語 (Japanese) |
| `ko` | 한국어 (Korean) |
| `es` | Español (Spanish) |
| `fr` | Français (French) |
| `de` | Deutsch (German) |

### Adding a New Locale

1. Add the locale to `src/i18n/routing.ts`:
   ```typescript
   export const locales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt'] as const;
   ```

2. Create a translation file `src/i18n/messages/pt.json`

3. Translate all keys from `en.json`

---

## 👥 Role-Based Access Control

### Permission Levels

| Role | Description | Admin Panel Access |
|------|-------------|--------------------|
| **Owner** | Full access, can transfer ownership | ✅ Yes |
| **Admin** | Manage members and settings | ✅ Yes |
| **Member** | Create and edit content | ❌ No |
| **Viewer** | Read-only access | ❌ No |

### Setting Up an Admin User

#### Method 1: Using Drizzle Studio (Recommended)

```bash
npm run db:studio
```

Then in the web interface:
1. Go to the `users` table
2. Find the user you want to make admin
3. Change the `role` field from `member` to `admin` or `owner`
4. Save changes

#### Method 2: Direct SQL Query

Connect to your PostgreSQL database and run:

```sql
-- Set user as admin
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

-- Or set as owner (highest permission)
UPDATE users SET role = 'owner' WHERE email = 'your-email@example.com';
```

#### Method 3: Create a Script

Create `scripts/set-admin.ts`:

```typescript
import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function setAdmin(email: string, role: 'admin' | 'owner' = 'admin') {
  await db.update(users).set({ role }).where(eq(users.email, email));
  console.log(`User ${email} is now ${role}`);
  process.exit(0);
}

// Replace with your email
setAdmin('your-email@example.com', 'admin');
```

Run:
```bash
npx tsx scripts/set-admin.ts
```

### Usage Example

```typescript
import { hasPermission } from '@/lib/permissions';

// Check if user can invite members
if (hasPermission(user.role, 'member:invite')) {
  // Show invite button
}
```

---

## 📊 Analytics

### Tracking Events

```typescript
import { analytics } from '@/lib/analytics';

// Track sign up
analytics.signUp('email');

// Track custom event
analytics.track('button_clicked', { 
  button: 'cta', 
  location: 'hero' 
});

// Track feature usage
analytics.featureUsed('export_data', { format: 'csv' });
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run specific test file
npx playwright test tests/app.spec.ts
```

### Test Coverage

- Homepage rendering
- Navigation
- Dark mode toggle
- Authentication pages
- Internationalization
- Responsive design
- Pricing section

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

StartFast Pro works with any platform supporting Next.js:
- Railway
- Render
- AWS Amplify
- Docker

---

## 📚 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15, React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| Database | PostgreSQL, Drizzle ORM |
| Authentication | Better-Auth |
| Payments | Stripe |
| Email | Resend |
| i18n | next-intl |
| Analytics | Posthog |
| Testing | Playwright |

---

## 🤝 Support

- **Documentation**: [www.startfast.dev/docs](https://www.startfast.dev/docs)
- **GitHub Issues**: [Report bugs](https://github.com/Harries/startfast-pro/issues)
- **Twitter**: [@HarriesBLOG](https://x.com/HarriesBLOG)

---

## 📄 License

Personal Use License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Harries">Harries</a>
</p>
