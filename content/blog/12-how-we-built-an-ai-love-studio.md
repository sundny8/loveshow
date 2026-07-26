---
slug: how-we-built-an-ai-love-studio
title: "How We Built an AI Love Studio: Architecture, Stack, and Lessons"
excerpt: "The technical story behind LoveShow 520 — Next.js 15, Drizzle, async AI pipelines for images and music, R2 storage, and the lessons we'd repeat."
category: Engineering
tags: engineering, nextjs, ai, architecture
locale: en
metaTitle: "How We Built an AI Love Studio (Next.js + AI Pipelines)"
metaDescription: "Architecture deep-dive of an AI love studio: Next.js 15 App Router, Drizzle + PostgreSQL, async task pipelines for AI image and music generation, and R2 storage."
readingTime: 9 min
---
# How We Built an AI Love Studio: Architecture, Stack, and Lessons

LoveShow 520 is an AI love studio that generates love letters, couple portraits and love songs. Under the hood it's **a Next.js 15 App Router monolith with PostgreSQL via Drizzle ORM, async task pipelines wrapping third-party AI models (text, image, and music generation), Cloudflare R2 for media storage, and Cloudflare CDN in front.** This post walks through the architecture, the trade-offs, and what we'd do differently — for developers building any consumer AI-generation product.

## The Stack in One Table

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15 (App Router, RSC) | One codebase for marketing pages + app + API |
| Language | TypeScript end-to-end | Shared types from DB schema to UI |
| Database | PostgreSQL + Drizzle ORM | Typed schema-as-code, painless migrations |
| Auth | Better Auth | Email + OAuth with session cookies, self-hosted |
| AI — text | LLM API | Love letters, lyric drafts, copywriting |
| AI — image | Diffusion model APIs | Couple portraits, art-photo styles |
| AI — music | Suno API | Full songs with vocals from lyric + style prompts |
| Storage | Cloudflare R2 (S3-compatible) | Zero egress fees for user media |
| Payments | Stripe + credit system | Per-generation credits, not seats |
| i18n | next-intl (7 languages) | Locale-prefixed routes, EN default |
| Edge | Cloudflare CDN + nginx origin | TLS termination, caching, bot rules |

## Architecture: The Async Task Pattern

The single most important design decision: **every AI generation is an async task, never a blocking HTTP request.** Image generation takes 10–60 seconds; music takes 1–3 minutes. Holding an HTTP connection that long fails on serverless timeouts, mobile networks, and user patience simultaneously.

Every generation flows through the same lifecycle:

```text
POST /api/tasks        → create task row (status: PENDING), debit credits
                       → call provider API, store provider task ID
GET  /api/tasks/:id    → client polls; server checks provider status
                       → SUCCESS: download result → upload to R2 → return URL
                       → FAILED: refund credits, surface a friendly error
```

A `tasks` table with `status`, `provider_task_id`, and `result_url` columns is the backbone. Three hard-won rules:

1. **Debit credits at creation, refund on failure.** The inverse order (debit on success) invites double-spending races.
2. **Persist provider task IDs immediately.** When a poll times out, you can recover the result later instead of losing a paid generation.
3. **Proxy all media through your own domain.** We copy every AI output to R2 and serve it ourselves — provider URLs expire, and regional availability varies (R2's public `r2.dev` domains, for instance, are unreliable in some regions, so we proxy through the app).

## Music Was the Hardest Pipeline

Text returns in seconds and images in under a minute, but songs stretch to minutes with multi-stage callbacks (lyrics → vocals → mastering). Two lessons stood out:

- **Duration control needs prompt engineering.** The music API offers no explicit duration parameter, so we constrain song length through lyric structure — verse/chorus counts map roughly to output length.
- **Synchronized lyrics are a product feature, not a nice-to-have.** We store timestamped lyrics and render a music-player-style scrolling view; it's the most-shared screen in the product.

## The Web Layer: Marketing and App in One Repo

Server Components let the public marketing pages (landing pages, blog, [520 meaning](/en/520-meaning)) render as pure SSR HTML — crawlable by search engines and AI crawlers — while the logged-in studio stays interactive. Rules we enforce:

- **Public pages never import dashboard-weight components.** Dynamic imports split the studio bundles away from landing pages.
- **Strict client/server module separation.** Server-only code (DB, API keys) lives in modules that client components physically can't import — a build-breaking lint rather than a convention.
- **SEO as code:** per-page `generateMetadata`, `Article`/`FAQPage` JSON-LD builders shared across pages, dynamic OG images via `next/og`, and an IndexNow ping fired automatically whenever a blog post is published (the [IndexNow protocol](https://www.indexnow.org/) gets Bing/Yandex — and therefore ChatGPT Search — to crawl within minutes instead of weeks).

## What We'd Repeat (and What We Wouldn't)

**Repeat:**

1. Credits-per-generation billing — it maps costs to revenue linearly and users understand it instantly.
2. The unified task table across all generation types — one polling endpoint, one refund path, one admin view.
3. Drizzle schema-as-code — `drizzle-kit push` made twelve production schema evolutions uneventful.

**Do differently:**

1. Start with webhooks/callbacks from AI providers instead of polling loops — we retrofitted this and the diff was painful.
2. Budget for content moderation from day one. Consumer AI products need input and output moderation on every endpoint; bolting it on later touched every generation route.
3. Treat i18n keys as an API. With seven languages, renaming a translation key is a breaking change — we learned to audit key coverage per feature before shipping, not after.

## Why Build This at All?

Because the products are genuinely moving: a couple separated by an ocean generating [their first “together” portrait](/en/ai-couple-portrait), a groom playing a [custom first-dance song](/en/ai-love-song) with his vows in the chorus, someone finally sending the [letter they couldn't write alone](/en/ai-love-letter). The engineering exists so that on May 20 — [520 Day](/en/blog/what-does-520-mean) — the site holds up while a lot of people say “I love you” at 5:20 pm sharp.

If you're building something similar and want to compare notes, we're happy to talk shop.

## FAQ

### What stack does an AI generation product need?

A web framework with SSR (Next.js or similar), a relational database with a task/job table, object storage for generated media, a credit-based billing system, and async pipelines around each AI provider. The task lifecycle — create, poll, store, refund on failure — matters more than any specific vendor.

### Why use async tasks instead of waiting for the AI response?

AI generation takes from seconds (text) to minutes (music). Blocking HTTP requests hit serverless timeouts and fail on flaky client networks; a task row with status polling survives both and enables recovery and refunds.

### How do you store AI-generated images and music?

Copy every output from the provider's temporary URL to your own object storage (we use Cloudflare R2 for zero egress fees) and serve it through your own domain — provider URLs expire and vary in regional availability.

### How do you handle payments for AI generation?

A prepaid credit system: each generation type costs a fixed number of credits, debited when the task is created and refunded automatically if it fails. It keeps unit economics visible and prevents abuse.

### Is Next.js good for AI apps?

Yes for this shape of product: Server Components give you crawlable marketing/SEO pages and an interactive app in one codebase, and API routes are sufficient for task orchestration. Heavy inference belongs with providers or dedicated workers, not in the web tier.
