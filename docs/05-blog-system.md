# Blog System Requirements

> **Document Version:** 1.0  
> **Last Updated:** 2024-03-16  
> **Status:** Implemented

---

## 1. Overview

### 1.1 Purpose
Provide a full-featured blog system with MDX support, categories, SEO optimization, and admin management capabilities.

### 1.2 Features
- MDX-powered content
- Reading time calculation
- Category and tag support
- SEO optimization (meta tags, Open Graph, JSON-LD)
- Responsive design
- Dark mode support

---

## 2. User-Facing Pages

### 2.1 Blog List Page (`/blog`)

#### Features
- [x] Post list with cards
- [x] Featured image display
- [x] Post title and excerpt
- [x] Author information
- [x] Publication date
- [x] Reading time
- [x] Category badges
- [x] Pagination
- [ ] Category filtering
- [ ] Search functionality

#### Post Card Layout
```
┌─────────────────────────────────────────┐
│          Featured Image                  │
├─────────────────────────────────────────┤
│  [Category Badge]                        │
│                                         │
│  Post Title                             │
│                                         │
│  Post excerpt text goes here with a     │
│  brief description of the content...    │
│                                         │
│  ┌─────┐                                │
│  │ Ava │  Author Name  •  Mar 15, 2024 │
│  └─────┘               •  5 min read   │
└─────────────────────────────────────────┘
```

#### Pagination
- Posts per page: 9 (3x3 grid)
- Previous/Next navigation
- Page numbers display

---

### 2.2 Blog Post Page (`/blog/[slug]`)

#### Features
- [x] Post title
- [x] Author information with avatar
- [x] Publication date
- [x] Reading time
- [x] Category display
- [x] Featured image
- [x] MDX content rendering
- [x] Code syntax highlighting
- [x] Responsive images
- [x] Table of contents
- [x] Social sharing buttons
- [x] Related posts section
- [ ] Comments section (planned)

#### Page Layout
```
┌──────────────────────────────────────────────────────────┐
│                      Header                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Category]                                              │
│                                                          │
│  Post Title                                              │
│  ═══════════════════════════════════════════════════    │
│                                                          │
│  ┌─────┐                                                │
│  │ Ava │  Author Name  •  Mar 15, 2024  •  5 min       │
│  └─────┘                                                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │               Featured Image                      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────┐  ┌────────────────────────────┐   │
│  │ Table of        │  │                            │   │
│  │ Contents        │  │    Article Content         │   │
│  │                 │  │                            │   │
│  │ 1. Introduction │  │    Markdown/MDX rendered   │   │
│  │ 2. Main Topic   │  │    content goes here...    │   │
│  │ 3. Conclusion   │  │                            │   │
│  └─────────────────┘  └────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Share: [Twitter] [LinkedIn] [Facebook] [Copy]   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ══════════════════════════════════════════════════     │
│  Related Posts                                           │
│  ┌────────┐ ┌────────┐ ┌────────┐                      │
│  │ Post 1 │ │ Post 2 │ │ Post 3 │                      │
│  └────────┘ └────────┘ └────────┘                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Admin Management

### 3.1 Blog Posts Management (`/admin/content`)

#### Features
- [x] Posts list table
- [x] Create new post
- [x] Edit existing post
- [x] Delete post
- [x] Publish/Unpublish toggle
- [ ] Draft preview
- [ ] Scheduled publishing

#### Post Form Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Title | Text | Yes | Post title (max 200 chars) |
| Slug | Text | Yes | URL-friendly identifier |
| Excerpt | Textarea | No | Brief summary (max 300 chars) |
| Content | MDX Editor | Yes | Full post content |
| Featured Image | File/URL | No | Header image |
| Category | Select | No | Post category |
| Tags | Multi-select | No | Post tags |
| Status | Select | Yes | Draft/Published |
| Publish Date | DateTime | No | Schedule publication |

---

## 4. Data Model

### 4.1 Blog Post Schema
```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;           // Unique, URL-safe
  excerpt?: string;
  content: string;        // MDX content
  featuredImage?: string;
  category?: string;
  tags?: string[];
  authorId: string;
  status: 'draft' | 'published';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  readingTime?: number;   // Calculated minutes
}
```

### 4.2 Category Schema
```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
}
```

---

## 5. API Endpoints

### 5.1 Public APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blog/posts` | List published posts |
| GET | `/api/blog/posts/:slug` | Get single post |
| GET | `/api/blog/categories` | List categories |

### 5.2 Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/posts` | List all posts |
| POST | `/api/admin/posts` | Create post |
| GET | `/api/admin/posts/:id` | Get post for editing |
| PUT | `/api/admin/posts/:id` | Update post |
| DELETE | `/api/admin/posts/:id` | Delete post |

---

## 6. SEO Requirements

### 6.1 Meta Tags
```html
<title>{postTitle} | {siteName}</title>
<meta name="description" content="{excerpt}" />
<meta name="author" content="{authorName}" />
<meta name="keywords" content="{tags}" />
```

### 6.2 Open Graph
```html
<meta property="og:title" content="{postTitle}" />
<meta property="og:description" content="{excerpt}" />
<meta property="og:image" content="{featuredImage}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="{postUrl}" />
<meta property="article:published_time" content="{publishedAt}" />
<meta property="article:author" content="{authorName}" />
```

### 6.3 JSON-LD Structured Data
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{postTitle}",
  "description": "{excerpt}",
  "image": "{featuredImage}",
  "datePublished": "{publishedAt}",
  "dateModified": "{updatedAt}",
  "author": {
    "@type": "Person",
    "name": "{authorName}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "{siteName}",
    "logo": "{siteLogo}"
  }
}
```

---

## 7. MDX Features

### 7.1 Supported Elements
- Headings (h1-h6)
- Paragraphs
- Lists (ordered, unordered)
- Links
- Images (with lazy loading)
- Code blocks (with syntax highlighting)
- Blockquotes
- Tables
- Horizontal rules

### 7.2 Custom Components
- `<Callout>` - Info/warning/error boxes
- `<CodeBlock>` - Enhanced code display
- `<Image>` - Optimized images
- `<Video>` - Embedded videos
- `<Tweet>` - Embedded tweets

### 7.3 Syntax Highlighting
- Languages: JavaScript, TypeScript, Python, Go, Rust, SQL, Bash, JSON, YAML, HTML, CSS

---

## 8. Reading Time Calculation

### 8.1 Algorithm
```typescript
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes);
}
```

---

## 9. Performance Requirements

### 9.1 Targets
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

### 9.2 Optimizations
- Static generation for blog pages
- Image optimization with next/image
- Code splitting
- Lazy loading for images
- CDN caching

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-16 | Initial documentation |
