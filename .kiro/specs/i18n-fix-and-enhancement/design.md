# Design Document: i18n-fix-and-enhancement

## 1. Overview

本设计文档定义了国际化修复与增强功能的技术实现方案。该功能旨在解决 workspace、portrait、music 三个功能页面的语言混乱问题，并优化现有英文翻译质量。

### 1.1 Goals

- 修复三个功能页面（workspace、portrait、music）的语言切换问题
- 确保 URL locale 参数正确控制页面语言显示
- 审查并优化英文翻译质量，使其符合英语母语者表达习惯
- 确保中英文翻译文件的完整性和一致性
- 验证路由配置和中间件的正确性
- 保持其他页面的国际化功能不受影响

### 1.2 Non-Goals

- 不添加新的语言支持（仅处理现有的中文和英文）
- 不重构整个国际化系统架构
- 不修改非目标页面的翻译内容
- 不改变现有的 next-intl 库配置方式

### 1.3 Background

系统当前使用 next-intl 库实现国际化，支持中文（zh）和英文（en）两种语言。技术栈包括：
- Next.js 15 + React 19
- next-intl 库用于国际化
- TypeScript
- 文件路径结构: `src/app/[locale]/...`

当前存在的问题：
1. workspace、portrait、music 三个页面在切换语言时显示混乱
2. 英文翻译存在机器翻译痕迹，不够自然
3. 部分翻译键可能缺失或不完整

## 2. Architecture

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Middleware                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  next-intl Middleware                                │   │
│  │  - Locale Detection                                  │   │
│  │  - URL Rewriting                                     │   │
│  │  - Redirect Handling                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Routing Layer                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  src/i18n/routing.ts                                 │   │
│  │  - defineRouting({ locales, defaultLocale, ... })    │   │
│  │  - createNavigation()                                │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Request Config                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  src/i18n/request.ts                                 │   │
│  │  - getRequestConfig()                                │   │
│  │  - Load messages from JSON                           │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Translation Files                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  src/i18n/messages/zh.json                           │   │
│  │  src/i18n/messages/en.json                           │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Page Components                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  src/app/[locale]/workspace/page.tsx                 │   │
│  │  src/app/[locale]/portrait/page.tsx                  │   │
│  │  src/app/[locale]/music/page.tsx                     │   │
│  │  - getTranslations()                                 │   │
│  │  - Render with translated content                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **Request Phase**:
   - 用户访问 `/zh/workspace` 或 `/en/workspace`
   - Middleware 拦截请求，提取 locale 参数
   - 如果 locale 缺失，重定向到默认 locale（zh）

2. **Routing Phase**:
   - Routing config 验证 locale 是否有效
   - 匹配对应的页面路由

3. **Translation Loading Phase**:
   - Request config 根据 locale 加载对应的 JSON 文件
   - 将翻译数据注入到 React context

4. **Rendering Phase**:
   - Page component 使用 `getTranslations()` 获取翻译函数
   - 组件使用翻译键渲染对应语言的内容

### 2.3 Component Interaction

```typescript
// Middleware Flow
Request → Middleware → Locale Detection → URL Rewrite → Next Handler

// Translation Flow
Page Component → getTranslations(namespace) → Translation Context → JSON File

// Navigation Flow
User Click → Link Component → Routing → Preserve Locale → New Page
```


## 3. Detailed Design

### 3.1 诊断和修复语言混乱的根本原因

#### 3.1.1 问题诊断

当前可能导致语言混乱的原因：

1. **Middleware 配置问题**:
   - Matcher 模式可能未正确匹配目标页面
   - Locale detection 可能被禁用或配置不当

2. **Routing 配置问题**:
   - `localePrefix` 策略可能不一致
   - `localeDetection` 设置可能影响行为

3. **Page Component 问题**:
   - 可能使用了错误的 locale 获取方式
   - 可能存在硬编码的语言内容

4. **Translation Loading 问题**:
   - Request config 可能未正确处理 locale 参数
   - JSON 文件加载可能失败或回退到错误的语言

#### 3.1.2 修复方案

**方案 A: 确保 Middleware 正确配置**

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // 确保匹配所有动态路由，包括 workspace, portrait, music
    '/((?!api|_next|static|.*\\..*|favicon.ico|robots.txt).*)',
  ],
};
```

**关键点**:
- Matcher 必须包含所有需要国际化的路由
- 排除 API 路由、静态资源和 Next.js 内部路由

**方案 B: 验证 Routing 配置**

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'zh',
  localePrefix: 'always', // 改为 'always' 确保 URL 始终包含 locale
  localeDetection: true,  // 启用 locale 检测
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

**关键点**:
- `localePrefix: 'always'` 确保所有 URL 都包含 locale 前缀
- `localeDetection: true` 启用自动 locale 检测
- 如果使用 `'as-needed'`，需要确保默认 locale 的处理逻辑正确

**方案 C: 确保 Request Config 正确处理 locale**

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // 验证 locale 是否有效
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

**关键点**:
- 必须验证 locale 的有效性
- 无效 locale 应回退到 defaultLocale
- 确保 JSON 文件路径正确

**方案 D: 确保 Page Component 正确使用翻译**

```typescript
// src/app/[locale]/workspace/page.tsx
import { getTranslations } from 'next-intl/server';

export default async function WorkspacePage() {
  const t = await getTranslations('workspace');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

**关键点**:
- 使用 `getTranslations()` 而不是直接访问 messages
- 使用正确的 namespace（如 'workspace'）
- 避免硬编码任何语言内容

### 3.2 优化英文翻译的具体方案

#### 3.2.1 翻译审查流程

1. **识别需要优化的翻译键**:
   - workspace 相关: `workspace.*`, `photoStudio.*`, `specPicker.*`, `dropzone.*`, `taskList.*`, `taskCard.*`
   - portrait 相关: `portraitStudio.*`
   - music 相关: `musicStudio.*`

2. **翻译优化原则**:
   - 使用自然的英语表达，避免直译
   - 保持专业术语的准确性
   - 确保语气和风格一致
   - 考虑目标用户的文化背景

3. **具体优化示例**:

```json
// 优化前（机器翻译风格）
{
  "workspace": {
    "title": "AI ID Photo Work Table",
    "description": "Select specification → Upload photo → One key generation. Support batch upload most 20 pieces."
  }
}

// 优化后（自然英语）
{
  "workspace": {
    "title": "AI ID Photo Workspace",
    "description": "Select specs → Upload photos → One-click generation. Supports batch upload up to 20 photos."
  }
}
```

#### 3.2.2 翻译质量检查清单

- [ ] 避免使用 "one key" 这样的直译，改用 "one-click"
- [ ] 避免使用 "work table"，改用 "workspace"
- [ ] 数字表达使用 "up to X" 而不是 "most X"
- [ ] 动词形式保持一致（如 "Upload" vs "Uploading"）
- [ ] 按钮文本使用祈使句（如 "Generate" 而不是 "To Generate"）
- [ ] 错误信息使用完整句子，首字母大写
- [ ] 提示信息使用友好的语气

#### 3.2.3 需要重点优化的区域

**Workspace 页面**:
```typescript
// 需要审查的翻译键
const workspaceKeys = [
  'workspace.title',
  'workspace.description',
  'photoStudio.upload.title',
  'photoStudio.settings.title',
  'photoStudio.settings.background',
  'photoStudio.settings.suit',
  'photoStudio.settings.suitOptions.*',
  'photoStudio.cost.*',
  'photoStudio.actions.*',
  'photoStudio.errors.*',
  'photoStudio.results.*',
];
```

**Portrait 页面**:
```typescript
const portraitKeys = [
  'portraitStudio.page.title',
  'portraitStudio.page.description',
  'portraitStudio.upload.title',
  'portraitStudio.gender.*',
  'portraitStudio.styles.*',
  'portraitStudio.cost.*',
  'portraitStudio.actions.*',
  'portraitStudio.errors.*',
  'portraitStudio.results.*',
];
```

**Music 页面**:
```typescript
const musicKeys = [
  'musicStudio.page.title',
  'musicStudio.page.description',
  'musicStudio.mode.*',
  'musicStudio.mood.*',
  'musicStudio.style.*',
  'musicStudio.prompt.*',
  'musicStudio.vocal.*',
  'musicStudio.actions.*',
  'musicStudio.errors.*',
  'musicStudio.result.*',
];
```

### 3.3 确保翻译文件完整性的检查机制

#### 3.3.1 翻译键完整性验证

**实现方案**:

```typescript
// scripts/validate-translations.ts
import zhTranslations from '../src/i18n/messages/zh.json';
import enTranslations from '../src/i18n/messages/en.json';

interface ValidationResult {
  missingInEn: string[];
  missingInZh: string[];
  structureMismatch: string[];
}

function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

function validateTranslations(): ValidationResult {
  const zhKeys = new Set(getAllKeys(zhTranslations));
  const enKeys = new Set(getAllKeys(enTranslations));
  
  const missingInEn = Array.from(zhKeys).filter(key => !enKeys.has(key));
  const missingInZh = Array.from(enKeys).filter(key => !zhKeys.has(key));
  
  return {
    missingInEn,
    missingInZh,
    structureMismatch: [...missingInEn, ...missingInZh],
  };
}

// 运行验证
const result = validateTranslations();

if (result.structureMismatch.length > 0) {
  console.error('Translation structure mismatch found:');
  console.error('Missing in en.json:', result.missingInEn);
  console.error('Missing in zh.json:', result.missingInZh);
  process.exit(1);
} else {
  console.log('✓ All translation keys are consistent');
}
```

#### 3.3.2 运行时翻译缺失检测

**实现方案**:

```typescript
// src/lib/i18n-validator.ts
export function validateTranslationKey(
  key: string,
  locale: string,
  value: any
): boolean {
  // 检查是否返回了翻译键本身（表示缺失）
  if (typeof value === 'string' && value === key) {
    console.error(`Missing translation: ${key} for locale: ${locale}`);
    return false;
  }
  
  // 检查是否包含中文字符（当 locale 为 en 时）
  if (locale === 'en' && typeof value === 'string') {
    const chineseRegex = /[\u4e00-\u9fa5]/;
    if (chineseRegex.test(value)) {
      console.error(`Chinese characters found in English translation: ${key}`);
      return false;
    }
  }
  
  return true;
}
```

#### 3.3.3 CI/CD 集成

```yaml
# .github/workflows/validate-translations.yml
name: Validate Translations

on:
  pull_request:
    paths:
      - 'src/i18n/messages/**'
      - 'src/app/[locale]/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run validate:translations
```

### 3.4 路由配置的调整方案

#### 3.4.1 当前配置分析

```typescript
// 当前配置 (src/i18n/routing.ts)
export const routing = defineRouting({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'as-needed',  // 可能导致问题
  localeDetection: false,      // 可能导致问题
});
```

**潜在问题**:
1. `localePrefix: 'as-needed'` 可能导致默认 locale 的 URL 不包含前缀，造成混淆
2. `localeDetection: false` 禁用了自动检测，可能导致 locale 不正确

#### 3.4.2 推荐配置

**选项 A: 使用 'always' 策略（推荐）**

```typescript
export const routing = defineRouting({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'always',     // 所有 URL 都包含 locale
  localeDetection: true,      // 启用自动检测
});
```

**优点**:
- URL 结构清晰一致
- 避免默认 locale 的歧义
- 更容易调试和测试

**缺点**:
- 默认语言的 URL 会变长（如 `/zh/workspace` 而不是 `/workspace`）

**选项 B: 保持 'as-needed' 但修复检测**

```typescript
export const routing = defineRouting({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'as-needed',
  localeDetection: true,      // 启用自动检测
});
```

**优点**:
- 默认语言的 URL 更简洁
- 保持现有 URL 结构

**缺点**:
- 需要更仔细地处理默认 locale 的逻辑
- 可能需要额外的重定向规则

#### 3.4.3 Middleware 配置优化

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware({
  ...routing,
  // 可选：自定义 locale 检测逻辑
  localeDetection: true,
  // 可选：自定义默认 locale
  defaultLocale: 'zh',
});

export const config = {
  matcher: [
    // 匹配所有路径，除了：
    // - API 路由 (/api/*)
    // - Next.js 内部路由 (/_next/*)
    // - 静态文件 (/static/*)
    // - 文件扩展名 (*.*)
    // - 特定文件 (favicon.ico, robots.txt)
    '/((?!api|_next|static|.*\\..*|favicon.ico|robots.txt).*)',
  ],
};
```

**关键点**:
- Matcher 必须正确匹配目标页面
- 排除不需要国际化的路由
- 确保 locale 检测逻辑正确


### 3.5 测试策略

#### 3.5.1 单元测试

**翻译键验证测试**:

```typescript
// __tests__/i18n/translation-keys.test.ts
import { describe, it, expect } from 'vitest';
import zhTranslations from '@/i18n/messages/zh.json';
import enTranslations from '@/i18n/messages/en.json';

describe('Translation Keys Consistency', () => {
  it('should have the same keys in zh.json and en.json', () => {
    const zhKeys = getAllKeys(zhTranslations);
    const enKeys = getAllKeys(enTranslations);
    
    expect(zhKeys.sort()).toEqual(enKeys.sort());
  });
  
  it('should have all workspace keys', () => {
    const requiredKeys = [
      'workspace.title',
      'workspace.description',
      'workspace.backToHome',
    ];
    
    requiredKeys.forEach(key => {
      expect(getNestedValue(zhTranslations, key)).toBeDefined();
      expect(getNestedValue(enTranslations, key)).toBeDefined();
    });
  });
  
  it('should not have Chinese characters in English translations', () => {
    const chineseRegex = /[\u4e00-\u9fa5]/;
    const allEnValues = getAllValues(enTranslations);
    
    allEnValues.forEach(value => {
      expect(chineseRegex.test(value)).toBe(false);
    });
  });
});
```

**Routing 配置测试**:

```typescript
// __tests__/i18n/routing.test.ts
import { describe, it, expect } from 'vitest';
import { routing, locales } from '@/i18n/routing';

describe('Routing Configuration', () => {
  it('should have correct locales', () => {
    expect(routing.locales).toEqual(['zh', 'en']);
  });
  
  it('should have correct default locale', () => {
    expect(routing.defaultLocale).toBe('zh');
  });
  
  it('should have valid locale prefix strategy', () => {
    expect(['always', 'as-needed', 'never']).toContain(routing.localePrefix);
  });
});
```

#### 3.5.2 集成测试

**Page 渲染测试**:

```typescript
// __tests__/pages/workspace.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import WorkspacePage from '@/app/[locale]/workspace/page';
import zhMessages from '@/i18n/messages/zh.json';
import enMessages from '@/i18n/messages/en.json';

describe('Workspace Page', () => {
  it('should render in Chinese', async () => {
    render(
      <NextIntlClientProvider locale="zh" messages={zhMessages}>
        <WorkspacePage />
      </NextIntlClientProvider>
    );
    
    expect(screen.getByText('AI 证件照工作台')).toBeInTheDocument();
  });
  
  it('should render in English', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <WorkspacePage />
      </NextIntlClientProvider>
    );
    
    expect(screen.getByText('AI ID Photo Workspace')).toBeInTheDocument();
  });
  
  it('should not show translation keys', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <WorkspacePage />
      </NextIntlClientProvider>
    );
    
    const keyPattern = /workspace\.\w+/;
    const allText = screen.getByRole('main').textContent || '';
    expect(keyPattern.test(allText)).toBe(false);
  });
});
```

#### 3.5.3 端到端测试

**Playwright 测试**:

```typescript
// e2e/i18n-navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('I18n Navigation', () => {
  test('should display Chinese when accessing /zh/workspace', async ({ page }) => {
    await page.goto('/zh/workspace');
    
    await expect(page.locator('h1')).toContainText('AI 证件照工作台');
    await expect(page).toHaveURL(/\/zh\/workspace/);
  });
  
  test('should display English when accessing /en/workspace', async ({ page }) => {
    await page.goto('/en/workspace');
    
    await expect(page.locator('h1')).toContainText('AI ID Photo Workspace');
    await expect(page).toHaveURL(/\/en\/workspace/);
  });
  
  test('should preserve locale when navigating between pages', async ({ page }) => {
    await page.goto('/en/workspace');
    
    // 导航到 portrait 页面
    await page.click('a[href*="portrait"]');
    await expect(page).toHaveURL(/\/en\/portrait/);
    
    // 导航到 music 页面
    await page.click('a[href*="music"]');
    await expect(page).toHaveURL(/\/en\/music/);
  });
  
  test('should redirect to default locale when locale is missing', async ({ page }) => {
    await page.goto('/workspace');
    
    // 应该重定向到 /zh/workspace
    await expect(page).toHaveURL(/\/zh\/workspace/);
  });
  
  test('should maintain locale after page refresh', async ({ page }) => {
    await page.goto('/en/workspace');
    await page.reload();
    
    await expect(page).toHaveURL(/\/en\/workspace/);
    await expect(page.locator('h1')).toContainText('AI ID Photo Workspace');
  });
});

test.describe('All Three Target Pages', () => {
  const pages = [
    { path: 'workspace', zhTitle: 'AI 证件照工作台', enTitle: 'AI ID Photo Workspace' },
    { path: 'portrait', zhTitle: 'AI 肖像照', enTitle: 'AI Portrait' },
    { path: 'music', zhTitle: 'AI 音乐制作', enTitle: 'AI Music Production' },
  ];
  
  for (const { path, zhTitle, enTitle } of pages) {
    test(`should display ${path} page in Chinese`, async ({ page }) => {
      await page.goto(`/zh/${path}`);
      await expect(page.locator('h1')).toContainText(zhTitle);
    });
    
    test(`should display ${path} page in English`, async ({ page }) => {
      await page.goto(`/en/${path}`);
      await expect(page.locator('h1')).toContainText(enTitle);
    });
  }
});
```

#### 3.5.4 回归测试

**确保其他页面不受影响**:

```typescript
// e2e/regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Regression Tests', () => {
  const otherPages = [
    { path: '/', zhText: '让每一次创作', enText: 'Make Every Creation' },
    { path: '/gallery', zhText: '您的作品', enText: 'Your Works' },
    { path: '/pricing', zhText: '积分', enText: 'Credits' },
  ];
  
  for (const { path, zhText, enText } of otherPages) {
    test(`should display ${path} in Chinese`, async ({ page }) => {
      await page.goto(`/zh${path}`);
      await expect(page.locator('body')).toContainText(zhText);
    });
    
    test(`should display ${path} in English`, async ({ page }) => {
      await page.goto(`/en${path}`);
      await expect(page.locator('body')).toContainText(enText);
    });
  }
  
  test('should not affect API routes', async ({ request }) => {
    const response = await request.get('/api/admin/stats');
    expect(response.status()).toBeLessThan(500);
  });
  
  test('should not affect static resources', async ({ page }) => {
    const response = await page.goto('/favicon.ico');
    expect(response?.status()).toBe(200);
  });
});
```

## 4. Data Models

### 4.1 Translation File Structure

```typescript
// Translation file type definition
interface TranslationMessages {
  common: {
    appName: string;
    loading: string;
    error: string;
    success: string;
    // ... other common keys
  };
  workspace: {
    backToHome: string;
    title: string;
    description: string;
  };
  photoStudio: {
    errors: {
      uploadRequired: string;
      generateFailed: string;
      insufficientPoints: string;
      // ... other error keys
    };
    upload: {
      title: string;
    };
    results: {
      title: string;
      count: string;
      empty: string;
      // ... other result keys
    };
    settings: {
      title: string;
      background: string;
      suit: string;
      suitOptions: {
        none: string;
        male: string;
        female: string;
        student: string;
      };
      // ... other setting keys
    };
    cost: {
      label: string;
      prefix: string;
      points: string;
      // ... other cost keys
    };
    actions: {
      generating: string;
      batchGenerate: string;
      startGenerate: string;
    };
  };
  portraitStudio: {
    page: {
      backToHome: string;
      title: string;
      description: string;
    };
    upload: {
      title: string;
    };
    gender: {
      title: string;
      auto: string;
      male: string;
      female: string;
    };
    styles: {
      title: string;
      count: string;
    };
    cost: {
      label: string;
      suffix: string;
      balance: string;
      points: string;
    };
    actions: {
      generating: string;
      generatingProgress: string;
      startGenerate: string;
      startGenerateSingle: string;
    };
    errors: {
      uploadRequired: string;
      styleRequired: string;
      insufficientPoints: string;
      generationFailed: string;
      goRecharge: string;
    };
    results: {
      title: string;
      count: string;
      generatingHint: string;
      generatingStatus: string;
      generatingWait: string;
      empty: string;
      emptyDesc: string;
      preview: string;
      download: string;
      previewAlt: string;
    };
  };
  musicStudio: {
    page: {
      backToHome: string;
      title: string;
      description: string;
    };
    title: string;
    mode: {
      simple: string;
      custom: string;
    };
    mood: {
      label: string;
    };
    style: {
      label: string;
    };
    prompt: {
      labelSimple: string;
      labelCustom: string;
      lengthHint: string;
      placeholderSimple: string;
      placeholderCustom: string;
    };
    titleField: {
      label: string;
      placeholder: string;
    };
    vocal: {
      label: string;
    };
    duration: {
      label: string;
    };
    model: {
      label: string;
      placeholder: string;
    };
    instrumental: {
      label: string;
    };
    cost: {
      label: string;
      points: string;
      balance: string;
    };
    actions: {
      generating: string;
      submitting: string;
      startGenerate: string;
    };
    status: {
      pending: string;
      generating: string;
      success: string;
      failed: string;
    };
    errors: {
      promptRequired: string;
      promptTooLong: string;
      requestFailed: string;
      generationFailed: string;
      generateFailed: string;
    };
    progress: {
      waitHint: string;
    };
    result: {
      title: string;
      untitled: string;
      download: string;
      lyrics: string;
      syncing: string;
    };
    styleLabels: Record<string, string>;
    moodLabels: Record<string, string>;
    vocalLabels: Record<string, string>;
    durationLabels: Record<string, string>;
    modelLabels: Record<string, string>;
  };
  // ... other namespaces
}
```

### 4.2 Routing Configuration

```typescript
// Routing configuration type
interface RoutingConfig {
  locales: readonly ['zh', 'en'];
  defaultLocale: 'zh';
  localePrefix: 'always' | 'as-needed' | 'never';
  localeDetection: boolean;
}
```

### 4.3 Locale Type

```typescript
// Locale type definition
export type Locale = 'zh' | 'en';

// Locale validation function
export function isValidLocale(locale: string): locale is Locale {
  return locale === 'zh' || locale === 'en';
}
```

## 5. Interface Definitions

### 5.1 Translation Hook

```typescript
// Usage in components
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('workspace');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### 5.2 Server-side Translation

```typescript
// Usage in server components
import { getTranslations } from 'next-intl/server';

async function MyServerComponent() {
  const t = await getTranslations('workspace');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### 5.3 Navigation Components

```typescript
// Usage of locale-aware navigation
import { Link, useRouter, usePathname } from '@/i18n/routing';

function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <nav>
      <Link href="/workspace">Workspace</Link>
      <Link href="/portrait">Portrait</Link>
      <Link href="/music">Music</Link>
      
      <button onClick={() => router.push('/workspace')}>
        Go to Workspace
      </button>
    </nav>
  );
}
```

## 6. Error Handling

### 6.1 Missing Translation Keys

```typescript
// Handle missing translation keys
function handleMissingTranslation(key: string, locale: string): string {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`Missing translation: ${key} for locale: ${locale}`);
  }
  
  // Return key as fallback
  return key;
}
```

### 6.2 Invalid Locale

```typescript
// Handle invalid locale in request config
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate and fallback to default
  if (!locale || !routing.locales.includes(locale as Locale)) {
    console.warn(`Invalid locale: ${locale}, falling back to ${routing.defaultLocale}`);
    locale = routing.defaultLocale;
  }

  try {
    return {
      locale,
      messages: (await import(`./messages/${locale}.json`)).default,
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    // Fallback to default locale
    return {
      locale: routing.defaultLocale,
      messages: (await import(`./messages/${routing.defaultLocale}.json`)).default,
    };
  }
});
```

### 6.3 Middleware Errors

```typescript
// Handle middleware errors gracefully
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  try {
    return intlMiddleware(request);
  } catch (error) {
    console.error('Middleware error:', error);
    // Fallback to default behavior
    return NextResponse.next();
  }
}
```


## 7. Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all testable criteria from the prework analysis, I identified the following redundancies:

1. **Locale Display Properties (1.1, 1.2, 5.1-5.6)**: Requirements 5.1-5.6 are specific examples of the general properties 1.1 and 1.2. The general properties subsume the specific examples.

2. **Translation Key Completeness (2.1, 2.6, 3.1, 3.3)**: These all test that translation keys exist for UI elements. They can be combined into a single comprehensive property.

3. **Translation Key Display (3.4, 5.8)**: Both test that raw translation keys are not displayed. These are redundant and can be combined.

4. **Locale Persistence (1.3, 1.6)**: Both test locale persistence, one for navigation and one for refresh. These can be combined into a single property about locale stability.

After consolidation, the following unique properties remain:

### Property 1: Locale-based UI Language Display

*For any* target page (workspace, portrait, music) and any valid locale (zh, en), when accessed with that locale parameter, the system SHALL display all UI elements in the corresponding language.

**Validates: Requirements 1.1, 1.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 2: Locale Persistence Across Interactions

*For any* sequence of user interactions (navigation, refresh) on target pages, the locale parameter SHALL remain unchanged throughout the session.

**Validates: Requirements 1.3, 1.6**

### Property 3: Locale Fallback for Missing Parameters

*For any* target page request without a locale parameter, the middleware SHALL redirect to the same path with the default locale (zh) prepended.

**Validates: Requirements 1.4, 4.4, 4.6**

### Property 4: Translation Key Completeness

*For any* translation key referenced in target page components, both zh.json and en.json SHALL contain that key with a non-empty string value.

**Validates: Requirements 2.1, 2.6, 3.1, 3.3**

### Property 5: Translation File Structure Consistency

*For any* key path that exists in zh.json, the same key path SHALL exist in en.json with the same structure (object vs string).

**Validates: Requirements 3.2**

### Property 6: No Chinese Characters in English Translations

*For any* translation value in en.json for target pages, the value SHALL NOT contain Chinese characters (Unicode range U+4E00 to U+9FFF).

**Validates: Requirements 2.5**

### Property 7: No Raw Translation Keys in Rendered Output

*For any* target page rendered with any valid locale, the HTML output SHALL NOT contain raw translation key patterns (e.g., "workspace.title", "photoStudio.errors.uploadRequired").

**Validates: Requirements 3.4, 5.8**

### Property 8: Terminology Consistency Across Pages

*For any* common UI concept (e.g., "generate", "upload", "download") used across multiple target pages, the translation keys SHALL use consistent terminology in both zh.json and en.json.

**Validates: Requirements 2.4**

## 8. Implementation Plan

### Phase 1: Diagnosis and Configuration Fix (Week 1)

**Tasks**:
1. Audit current middleware configuration
2. Verify routing configuration
3. Test locale detection behavior
4. Identify root cause of language混乱
5. Implement configuration fixes

**Deliverables**:
- Updated `src/middleware.ts` with correct matcher
- Updated `src/i18n/routing.ts` with optimal configuration
- Documentation of identified issues and fixes

### Phase 2: Translation Audit and Optimization (Week 1-2)

**Tasks**:
1. Extract all translation keys used in target pages
2. Audit English translations for naturalness
3. Identify machine translation patterns
4. Rewrite problematic translations
5. Ensure terminology consistency

**Deliverables**:
- Updated `src/i18n/messages/en.json` with improved translations
- Translation style guide document
- List of optimized translation keys

### Phase 3: Translation Completeness Validation (Week 2)

**Tasks**:
1. Implement translation validation script
2. Run validation on zh.json and en.json
3. Add missing translation keys
4. Verify structure consistency
5. Set up CI/CD validation

**Deliverables**:
- `scripts/validate-translations.ts` script
- Complete and consistent translation files
- CI/CD workflow for translation validation

### Phase 4: Testing and Verification (Week 2-3)

**Tasks**:
1. Write unit tests for translation keys
2. Write integration tests for page rendering
3. Write E2E tests for locale navigation
4. Run regression tests on other pages
5. Fix any issues found

**Deliverables**:
- Unit test suite for translations
- Integration test suite for pages
- E2E test suite for navigation
- Test coverage report

### Phase 5: Documentation and Deployment (Week 3)

**Tasks**:
1. Update developer documentation
2. Create translation contribution guide
3. Deploy to staging environment
4. Perform manual QA
5. Deploy to production

**Deliverables**:
- Updated documentation
- Translation contribution guide
- Deployed and verified fixes

## 9. Security Considerations

### 9.1 XSS Prevention

- All translation values are treated as plain text by next-intl
- No HTML injection through translation values
- Use `dangerouslySetInnerHTML` only when absolutely necessary and with sanitization

### 9.2 Locale Injection

- Validate locale parameter against whitelist (`['zh', 'en']`)
- Reject any locale not in the whitelist
- Prevent path traversal through locale parameter

```typescript
// Secure locale validation
function validateLocale(locale: string): locale is Locale {
  const validLocales: Locale[] = ['zh', 'en'];
  return validLocales.includes(locale as Locale);
}
```

### 9.3 Translation File Integrity

- Translation files are static JSON, loaded at build time
- No runtime modification of translation files
- Version control all translation changes
- Review all translation PRs for malicious content

## 10. Performance Considerations

### 10.1 Translation Loading

- Translation files are loaded once per locale at build time
- Next.js automatically code-splits by locale
- No runtime translation file fetching

### 10.2 Middleware Performance

- Middleware runs on every request
- Keep middleware logic minimal
- Cache locale detection results when possible

### 10.3 Page Rendering

- Server-side translation resolution (no client-side overhead)
- Static generation for pages when possible
- Incremental Static Regeneration for dynamic content

## 11. Monitoring and Observability

### 11.1 Translation Errors

```typescript
// Log missing translations in production
if (process.env.NODE_ENV === 'production') {
  // Send to error tracking service
  Sentry.captureMessage(`Missing translation: ${key} for locale: ${locale}`);
}
```

### 11.2 Locale Distribution

```typescript
// Track locale usage
analytics.track('page_view', {
  locale: currentLocale,
  page: pathname,
});
```

### 11.3 Translation Quality Metrics

- Track user language preference changes
- Monitor bounce rates by locale
- Collect user feedback on translations

## 12. Future Enhancements

### 12.1 Additional Languages

- Framework supports easy addition of new locales
- Add locale to `routing.locales` array
- Create new translation file (e.g., `ja.json`, `ko.json`)
- Update middleware and routing configuration

### 12.2 Dynamic Translation Loading

- Implement lazy loading for large translation files
- Split translations by page/feature
- Reduce initial bundle size

### 12.3 Translation Management System

- Integrate with translation management platform (e.g., Crowdin, Lokalise)
- Automate translation updates
- Enable community contributions

### 12.4 A/B Testing for Translations

- Test different translation variants
- Measure user engagement by translation
- Optimize translations based on data

## 13. Dependencies

### 13.1 External Libraries

- `next-intl`: ^3.x (internationalization)
- `next`: ^15.x (framework)
- `react`: ^19.x (UI library)

### 13.2 Development Dependencies

- `vitest`: Testing framework
- `@testing-library/react`: React testing utilities
- `@playwright/test`: E2E testing
- `typescript`: Type checking

### 13.3 Configuration Files

- `next.config.ts`: Next.js configuration with next-intl plugin
- `src/i18n/routing.ts`: Routing configuration
- `src/i18n/request.ts`: Request configuration
- `src/middleware.ts`: Middleware configuration

## 14. Rollback Plan

### 14.1 Configuration Rollback

If issues are detected after deployment:

1. Revert `src/i18n/routing.ts` to previous configuration
2. Revert `src/middleware.ts` to previous configuration
3. Redeploy application
4. Verify rollback success

### 14.2 Translation Rollback

If translation issues are detected:

1. Revert `src/i18n/messages/en.json` to previous version
2. Redeploy application
3. Verify translations display correctly

### 14.3 Monitoring During Rollout

- Monitor error rates by locale
- Track user complaints about language issues
- Set up alerts for translation errors
- Prepare hotfix branch for quick fixes

## 15. Success Criteria

### 15.1 Functional Success

- [ ] All three target pages display correct language based on URL locale
- [ ] Locale persists across navigation and page refresh
- [ ] Missing locale redirects to default locale
- [ ] No raw translation keys visible in UI
- [ ] No Chinese characters in English translations
- [ ] All translation keys present in both zh.json and en.json

### 15.2 Quality Success

- [ ] English translations reviewed by native speaker
- [ ] No machine translation patterns in English
- [ ] Terminology consistent across pages
- [ ] Translation validation passes in CI/CD
- [ ] All tests passing (unit, integration, E2E)

### 15.3 Performance Success

- [ ] Page load time unchanged or improved
- [ ] Middleware overhead < 10ms
- [ ] No increase in bundle size

### 15.4 User Success

- [ ] User complaints about language issues resolved
- [ ] Positive feedback on English translation quality
- [ ] No regression in other pages' i18n functionality

