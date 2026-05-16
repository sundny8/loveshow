# Implementation Plan: i18n-fix-and-enhancement

## Overview

本实现计划将修复 workspace、portrait、music 三个功能页面的国际化问题，并优化英文翻译质量。实现将分为五个主要阶段：诊断配置问题、修复路由和中间件、优化翻译内容、验证翻译完整性、以及编写测试。

## Tasks

- [ ] 1. 诊断和修复国际化配置
  - [-] 1.1 审查并修复 middleware 配置
    - 检查 `src/middleware.ts` 的 matcher 模式是否正确匹配目标页面
    - 确保 matcher 排除 API 路由、静态资源和 Next.js 内部路由
    - 验证 middleware 正确应用 next-intl 的 locale 检测逻辑
    - _Requirements: 1.4, 4.3, 4.6_
  
  - [-] 1.2 审查并修复 routing 配置
    - 检查 `src/i18n/routing.ts` 的 `localePrefix` 和 `localeDetection` 设置
    - 根据设计文档建议，评估是否需要将 `localePrefix` 改为 `'always'` 或保持 `'as-needed'`
    - 确保 `localeDetection` 设置为 `true` 以启用自动检测
    - 验证 `locales` 数组包含 `['zh', 'en']` 且 `defaultLocale` 为 `'zh'`
    - _Requirements: 4.1, 4.2, 4.5_
  
  - [-] 1.3 审查并修复 request 配置
    - 检查 `src/i18n/request.ts` 的 locale 验证逻辑
    - 确保无效 locale 正确回退到 defaultLocale
    - 添加错误处理以防止 JSON 文件加载失败
    - _Requirements: 1.4, 4.6_

- [ ] 2. 验证目标页面组件的翻译使用
  - [~] 2.1 审查 workspace 页面的翻译实现
    - 检查 `src/app/[locale]/workspace/page.tsx` 是否正确使用 `getTranslations()`
    - 确保所有 UI 文本都通过翻译键获取，没有硬编码内容
    - 验证使用的 namespace 正确（如 'workspace', 'photoStudio'）
    - _Requirements: 1.1, 1.2, 3.3_
  
  - [~] 2.2 审查 portrait 页面的翻译实现
    - 检查 `src/app/[locale]/portrait/page.tsx` 是否正确使用 `getTranslations()`
    - 确保所有 UI 文本都通过翻译键获取，没有硬编码内容
    - 验证使用的 namespace 正确（如 'portraitStudio'）
    - _Requirements: 1.1, 1.2, 3.3_
  
  - [~] 2.3 审查 music 页面的翻译实现
    - 检查 `src/app/[locale]/music/page.tsx` 是否正确使用 `getTranslations()`
    - 确保所有 UI 文本都通过翻译键获取，没有硬编码内容
    - 验证使用的 namespace 正确（如 'musicStudio'）
    - _Requirements: 1.1, 1.2, 3.3_

- [~] 3. Checkpoint - 验证配置修复效果
  - 手动测试访问 `/zh/workspace`, `/en/workspace`, `/zh/portrait`, `/en/portrait`, `/zh/music`, `/en/music`
  - 确认页面语言正确响应 URL locale 参数
  - 确认在目标页面之间导航时 locale 保持不变
  - 确认刷新页面后 locale 保持不变
  - 如有问题，返回步骤 1-2 进行调整

- [ ] 4. 审查并优化英文翻译
  - [~] 4.1 提取并审查 workspace 相关的英文翻译
    - 从 `src/i18n/messages/en.json` 提取 `workspace.*`, `photoStudio.*`, `specPicker.*`, `dropzone.*`, `taskList.*`, `taskCard.*` 相关翻译键
    - 识别机器翻译痕迹（如 "one key" 改为 "one-click", "work table" 改为 "workspace", "most X" 改为 "up to X"）
    - 重写不自然的表达，使其符合英语母语者习惯
    - 确保按钮文本使用祈使句，错误信息使用完整句子
    - _Requirements: 2.2, 2.3, 2.4, 2.6_
  
  - [~] 4.2 提取并审查 portrait 相关的英文翻译
    - 从 `src/i18n/messages/en.json` 提取 `portraitStudio.*` 相关翻译键
    - 识别并修复机器翻译痕迹
    - 确保术语与 workspace 页面保持一致
    - 优化用户界面文本的自然度和友好性
    - _Requirements: 2.2, 2.3, 2.4, 2.6_
  
  - [~] 4.3 提取并审查 music 相关的英文翻译
    - 从 `src/i18n/messages/en.json` 提取 `musicStudio.*` 相关翻译键
    - 识别并修复机器翻译痕迹
    - 确保术语与其他页面保持一致
    - 优化用户界面文本的自然度和友好性
    - _Requirements: 2.2, 2.3, 2.4, 2.6_
  
  - [~] 4.4 更新 en.json 文件
    - 将优化后的翻译写入 `src/i18n/messages/en.json`
    - 确保 JSON 格式正确，没有语法错误
    - 保持文件结构与 zh.json 一致
    - _Requirements: 2.1, 2.6, 3.2_

- [ ] 5. 验证翻译文件完整性
  - [~] 5.1 创建翻译验证脚本
    - 创建 `scripts/validate-translations.ts` 文件
    - 实现 `getAllKeys()` 函数递归提取所有翻译键
    - 实现 `validateTranslations()` 函数比较 zh.json 和 en.json 的键结构
    - 实现中文字符检测逻辑，确保 en.json 不包含中文字符
    - 脚本应在发现不一致时返回非零退出码
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [~] 5.2 运行验证脚本并修复问题
    - 执行 `npx tsx scripts/validate-translations.ts`
    - 如果发现缺失的翻译键，添加到对应的 JSON 文件
    - 如果发现结构不一致，调整文件结构使其匹配
    - 如果发现 en.json 包含中文字符，替换为正确的英文翻译
    - 重新运行验证直到通过
    - _Requirements: 2.5, 3.1, 3.2, 3.3, 3.5_
  
  - [~] 5.3 在 package.json 添加验证脚本命令
    - 在 `package.json` 的 `scripts` 部分添加 `"validate:translations": "tsx scripts/validate-translations.ts"`
    - 测试命令是否正常工作
    - _Requirements: 3.5_

- [~] 6. Checkpoint - 验证翻译优化效果
  - 手动访问三个目标页面的英文版本
  - 检查所有文本是否自然流畅
  - 确认没有显示翻译键名称（如 `workspace.title`）
  - 确认没有中文字符出现在英文界面
  - 如有问题，返回步骤 4-5 进行调整

- [ ] 7. 编写单元测试
  - [ ]* 7.1 编写翻译键一致性测试
    - 创建 `__tests__/i18n/translation-keys.test.ts` 文件
    - 实现测试验证 zh.json 和 en.json 包含相同的键
    - 实现测试验证目标页面的必需翻译键存在
    - 实现测试验证 en.json 不包含中文字符
    - _Requirements: 3.1, 3.2, 2.5_
  
  - [ ]* 7.2 编写 routing 配置测试
    - 创建 `__tests__/i18n/routing.test.ts` 文件
    - 实现测试验证 routing.locales 包含 ['zh', 'en']
    - 实现测试验证 routing.defaultLocale 为 'zh'
    - 实现测试验证 localePrefix 策略有效
    - _Requirements: 4.1, 4.2, 4.5_

- [ ] 8. 编写集成测试
  - [ ]* 8.1 编写 workspace 页面渲染测试
    - 创建 `__tests__/pages/workspace.test.tsx` 文件
    - 实现测试验证页面在中文 locale 下正确渲染
    - 实现测试验证页面在英文 locale 下正确渲染
    - 实现测试验证页面不显示原始翻译键
    - _Requirements: 5.1, 5.2, 3.4, 5.8_
  
  - [ ]* 8.2 编写 portrait 页面渲染测试
    - 创建 `__tests__/pages/portrait.test.tsx` 文件
    - 实现测试验证页面在中文 locale 下正确渲染
    - 实现测试验证页面在英文 locale 下正确渲染
    - 实现测试验证页面不显示原始翻译键
    - _Requirements: 5.3, 5.4, 3.4, 5.8_
  
  - [ ]* 8.3 编写 music 页面渲染测试
    - 创建 `__tests__/pages/music.test.tsx` 文件
    - 实现测试验证页面在中文 locale 下正确渲染
    - 实现测试验证页面在英文 locale 下正确渲染
    - 实现测试验证页面不显示原始翻译键
    - _Requirements: 5.5, 5.6, 3.4, 5.8_

- [ ] 9. 编写端到端测试
  - [ ]* 9.1 编写 locale 导航测试
    - 创建或更新 `e2e/i18n-navigation.spec.ts` 文件
    - 实现测试验证访问 `/zh/workspace` 显示中文界面
    - 实现测试验证访问 `/en/workspace` 显示英文界面
    - 实现测试验证在目标页面之间导航时 locale 保持不变
    - 实现测试验证访问不带 locale 的 URL 重定向到默认 locale
    - 实现测试验证刷新页面后 locale 保持不变
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_
  
  - [ ]* 9.2 编写所有目标页面的 E2E 测试
    - 在 `e2e/i18n-navigation.spec.ts` 添加测试覆盖所有三个目标页面
    - 对每个页面验证中文和英文版本正确显示
    - 验证页面标题、按钮、提示信息使用正确语言
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 9.3 编写回归测试
    - 创建 `e2e/regression.spec.ts` 文件
    - 实现测试验证非目标页面（首页、gallery、pricing 等）的国际化功能正常
    - 实现测试验证 API 路由不受影响
    - 实现测试验证静态资源访问正常
    - _Requirements: 6.1, 6.3, 6.4_

- [ ] 10. 最终验证和文档更新
  - [~] 10.1 运行所有测试套件
    - 运行单元测试: `npm run test`
    - 运行 E2E 测试: `npm run test:e2e`
    - 确保所有测试通过
    - 修复任何失败的测试
    - _Requirements: 5.7, 5.8_
  
  - [~] 10.2 手动 QA 测试
    - 在本地开发环境测试所有三个目标页面
    - 测试语言切换功能
    - 测试页面导航和刷新
    - 验证翻译质量和完整性
    - 记录任何发现的问题并修复
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 2.2, 2.5, 3.4_
  
  - [~] 10.3 更新文档
    - 如果修改了配置，更新相关技术文档
    - 如果创建了新的脚本或测试，添加使用说明
    - 记录翻译优化的原则和示例
    - _Requirements: 3.5_

- [~] 11. Final Checkpoint - 确保所有功能正常
  - 确认所有测试通过
  - 确认三个目标页面的国际化功能正常
  - 确认英文翻译质量符合要求
  - 确认翻译文件完整且一致
  - 确认其他页面的国际化功能不受影响
  - 如有任何问题，返回相应步骤进行修复

## Notes

- 任务标记 `*` 的为可选测试任务，可根据项目时间安排跳过
- 每个任务都明确引用了对应的需求编号，确保需求覆盖完整
- Checkpoint 任务用于阶段性验证，确保问题及早发现
- 翻译优化需要关注自然度、一致性和准确性
- 验证脚本应该在 CI/CD 中运行，确保翻译文件始终保持一致
- 测试应覆盖所有三个目标页面以及回归测试确保其他页面不受影响

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 3, "tasks": ["4.4", "5.1"] },
    { "id": 4, "tasks": ["5.2"] },
    { "id": 5, "tasks": ["5.3", "7.1", "7.2"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 8, "tasks": ["10.1"] },
    { "id": 9, "tasks": ["10.2", "10.3"] }
  ]
}
```
