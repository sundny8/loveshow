# Requirements Document

## Introduction

本文档定义了国际化修复与增强功能的需求。该功能旨在解决三个功能页面（workspace、portrait、music）的语言混乱问题，并审查优化现有英文翻译质量。系统当前使用 next-intl 库实现国际化，支持中文（zh）和英文（en）两种语言，但在特定页面存在配置问题导致语言切换失效或显示混乱。

## Glossary

- **I18n_System**: 国际化系统，基于 next-intl 库实现的多语言支持系统
- **Locale**: 语言区域设置，当前支持 zh（中文）和 en（英文）
- **Translation_File**: 翻译文件，位于 `src/i18n/messages/` 目录下的 JSON 格式语言资源文件
- **Routing_Config**: 路由配置，定义在 `src/i18n/routing.ts` 中的语言路由规则
- **Middleware**: 中间件，位于 `src/middleware.ts` 的请求拦截与语言检测逻辑
- **Workspace_Page**: 证件照工作台页面，路径为 `/[locale]/workspace`
- **Portrait_Page**: AI 肖像页面，路径为 `/[locale]/portrait`
- **Music_Page**: AI 音乐制作页面，路径为 `/[locale]/music`
- **Target_Pages**: 目标页面，指 Workspace_Page、Portrait_Page 和 Music_Page 三个功能页面

## Requirements

### Requirement 1: 修复三个功能页面的语言混乱问题

**User Story:** 作为用户，我希望在访问 workspace、portrait、music 三个功能页面时，页面语言能够正确响应 URL 中的 locale 参数，以便我能够使用我选择的语言浏览这些页面。

#### Acceptance Criteria

1. WHEN 用户访问 `/zh/workspace`、`/zh/portrait` 或 `/zh/music`，THE I18n_System SHALL 显示中文界面
2. WHEN 用户访问 `/en/workspace`、`/en/portrait` 或 `/en/music`，THE I18n_System SHALL 显示英文界面
3. WHEN 用户在 Target_Pages 之间导航，THE I18n_System SHALL 保持当前选择的 Locale 不变
4. IF Middleware 检测到 Target_Pages 的请求缺少 locale 参数，THEN THE Middleware SHALL 重定向到包含默认 Locale 的 URL
5. THE Routing_Config SHALL 正确匹配 Target_Pages 的路由模式
6. WHEN 用户刷新 Target_Pages 的任意页面，THE I18n_System SHALL 保持当前 Locale 不变

### Requirement 2: 审查并优化现有英文翻译

**User Story:** 作为英文用户，我希望 workspace、portrait、music 三个功能页面的英文翻译准确、自然且符合英语表达习惯，以便我能够清晰理解页面功能和操作指引。

#### Acceptance Criteria

1. THE Translation_File (`en.json`) SHALL 包含 Target_Pages 所有 UI 元素的英文翻译键值对
2. THE Translation_File (`en.json`) SHALL 使用符合英语母语者习惯的自然表达
3. THE Translation_File (`en.json`) SHALL 避免使用机器翻译的生硬表达
4. THE Translation_File (`en.json`) SHALL 保持术语在 Target_Pages 之间的一致性
5. WHEN Target_Pages 显示英文界面，THE I18n_System SHALL 不显示任何中文字符（除非是用户输入的内容）
6. THE Translation_File (`en.json`) SHALL 为 Target_Pages 的所有按钮、标签、提示信息、错误信息提供准确翻译

### Requirement 3: 确保翻译文件完整性

**User Story:** 作为开发者，我希望中文和英文翻译文件包含所有必需的翻译键，以便系统不会因缺少翻译键而显示错误或回退到默认语言。

#### Acceptance Criteria

1. THE Translation_File (`zh.json`) SHALL 包含 Target_Pages 所有 UI 元素的中文翻译键值对
2. THE Translation_File (`en.json`) SHALL 包含与 `zh.json` 相同的翻译键结构
3. IF Target_Pages 的组件引用了翻译键，THEN THE Translation_File SHALL 包含该翻译键
4. THE I18n_System SHALL 不在 Target_Pages 显示翻译键名称（如 `workspace.title`）而应显示翻译后的文本
5. WHEN 开发者添加新的 UI 元素到 Target_Pages，THE Translation_File SHALL 同时更新中文和英文翻译

### Requirement 4: 验证路由配置正确性

**User Story:** 作为系统管理员，我希望路由配置能够正确处理 locale 参数，以便用户访问任何页面时都能获得正确的语言版本。

#### Acceptance Criteria

1. THE Routing_Config SHALL 定义 `locales` 数组包含 `['zh', 'en']`
2. THE Routing_Config SHALL 设置 `defaultLocale` 为 `'zh'`
3. THE Middleware SHALL 应用于所有非 API、非静态资源的路由
4. WHEN 用户访问根路径 `/`，THE Middleware SHALL 重定向到 `/zh/`
5. THE Routing_Config SHALL 使用 `localePrefix: 'as-needed'` 或 `'always'` 策略
6. THE Middleware SHALL 正确处理 Target_Pages 的 locale 检测和路由匹配

### Requirement 5: 测试三个功能页面的国际化功能

**User Story:** 作为 QA 工程师，我希望能够验证 workspace、portrait、music 三个功能页面的国际化功能正常工作，以便确保用户在使用这些页面时不会遇到语言问题。

#### Acceptance Criteria

1. WHEN 测试人员访问 `/zh/workspace`，THE Workspace_Page SHALL 显示中文标题、按钮和提示信息
2. WHEN 测试人员访问 `/en/workspace`，THE Workspace_Page SHALL 显示英文标题、按钮和提示信息
3. WHEN 测试人员访问 `/zh/portrait`，THE Portrait_Page SHALL 显示中文标题、按钮和提示信息
4. WHEN 测试人员访问 `/en/portrait`，THE Portrait_Page SHALL 显示英文标题、按钮和提示信息
5. WHEN 测试人员访问 `/zh/music`，THE Music_Page SHALL 显示中文标题、按钮和提示信息
6. WHEN 测试人员访问 `/en/music`，THE Music_Page SHALL 显示英文标题、按钮和提示信息
7. WHEN 测试人员在 Target_Pages 之间切换语言，THE I18n_System SHALL 在 200 毫秒内完成语言切换
8. THE I18n_System SHALL 在 Target_Pages 不显示任何翻译键缺失的错误信息

### Requirement 6: 保持其他页面的国际化功能不受影响

**User Story:** 作为产品经理，我希望在修复三个功能页面的国际化问题时，不影响其他页面的正常国际化功能，以便确保整体系统稳定性。

#### Acceptance Criteria

1. WHEN 开发者修改 Routing_Config 或 Middleware，THE I18n_System SHALL 保持非 Target_Pages 的语言切换功能正常
2. THE Translation_File 的修改 SHALL 仅限于 Target_Pages 相关的翻译键
3. WHEN 用户访问首页、登录页、个人中心等其他页面，THE I18n_System SHALL 正确显示对应语言
4. THE Middleware 的修改 SHALL 不影响 API 路由和静态资源的访问
5. WHEN 系统部署更新后，THE I18n_System SHALL 通过回归测试验证所有页面的国际化功能

