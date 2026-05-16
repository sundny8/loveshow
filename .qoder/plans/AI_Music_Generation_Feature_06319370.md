
# AI 音乐制作功能实现计划

## 一、新增数据库表 — `music_tasks`

在 `src/db/schema.ts` 中新增 `music_tasks` 表，记录音乐生成任务：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | text PK | UUID 主键 |
| userId | text FK → users.id | 用户 |
| status | text | PENDING / GENERATING / SUCCESS / FAILED |
| sunoTaskId | text | Suno API 返回的 task_id |
| prompt | text | 用户输入的提示词 |
| style | text | 曲风 |
| title | text | 歌曲标题 |
| instrumental | boolean | 是否纯器乐 |
| model | text | 模型版本 (V4_5ALL 等) |
| customMode | boolean | 是否自定义模式 |
| resultData | jsonb | Suno 返回的完整结果 (audioUrl, streamAudioUrl, imageUrl, duration, tags) |
| costPoints | integer | 消耗积分 |
| errorMessage | text | 错误信息 |
| createdAt | timestamp | 创建时间 |
| completedAt | timestamp | 完成时间 |

同时导出 `MusicTask` 类型。执行 `npx drizzle-kit push` 同步数据库。

## 二、Suno API 客户端 — `src/lib/suno.ts`

基于已有项目 fetch 模式（参考 `lib/analytics.ts`、`lib/stripe.ts`），创建：

```
src/lib/suno.ts
```

**核心函数：**

1. `generateMusic(params)` — 调用 `POST https://api.sunoapi.org/api/v1/generate`
   - 携带 `Authorization: Bearer SUNO_KEY`
   - 参数：`{ prompt, style?, title?, customMode, instrumental, model, callBackUrl? }`
   - 返回：`{ taskId: string }`
   - 超时 60s（参考 FETCH_TIMEOUT_MS 模式）

2. `getTaskStatus(taskId)` — 调用 `GET https://api.sunoapi.org/api/v1/generate/record-info?taskId=xxx`
   - 返回完整状态和结果数据

3. `getCredits()` — 调用 `GET https://api.sunoapi.org/api/v1/generate/credit`
   - 返回剩余积分

## 三、后端 API 路由

### 3.1 `POST /api/music/generate`

**路径**: `src/app/api/music/generate/route.ts`

参考 `src/app/api/photo/generate/route.ts` 的写法：

1. 校验用户登录态
2. 从 `req.json()` 获取 `{ prompt, style, title, instrumental, model, customMode }`
3. 参数校验（prompt 必填，最长 500 字符非自定义模式 / 5000 字符自定义模式）
4. 事务内：
   - 扣减用户积分（音乐生成消耗积分，如 20 点）
   - 创建 `music_tasks` 记录 (status: PENDING)
   - 记录 `point_transactions`
5. 调用 `generateMusic()` 发起 Suno 生成
6. 更新 `music_tasks` 的 `sunoTaskId` 和 `status: GENERATING`
7. 返回 `{ success: true, taskId }`

失败时回滚：退款积分 + 标记 FAILED。

### 3.2 `GET /api/music/task`

**路径**: `src/app/api/music/task/route.ts`

查询参数 `?taskId=xxx`：
1. 校验登录态
2. 查询 `music_tasks` 记录
3. 如果 status 为 GENERATING，主动调用 `getTaskStatus(sunoTaskId)` 同步状态
   - 若 Suno 返回 SUCCESS，更新本地记录 `status: SUCCESS` + `resultData`
   - 若 Suno 返回失败，更新本地记录 `status: FAILED`
4. 返回任务详情

### 3.3 `GET /api/music/history`

**路径**: `src/app/api/music/history/route.ts`

1. 校验登录态
2. 查询当前用户的 `music_tasks` 列表，按时间倒序
3. 返回列表

### 3.4 `POST /api/music/callback` (可选)

**路径**: `src/app/api/music/callback/route.ts`

Suno webhook 回调处理，验证回调数据后更新本地任务状态。本次可先不做，采用前端轮询方式。

## 四、环境变量配置

在 `src/config/env.ts` 中新增 `SUNO_KEY` 的 schema 校验（参考已有 GEMINI_API_KEY 模式）：

```ts
SUNO_KEY: z.string().optional(),
```

## 五、国际化文本 (i18n)

在 `src/i18n/messages/zh.json` 和 `en.json` 的 `engines` 节点下新增 `music` 对象：

```json
"music": {
  "engineLabel": "Engine · 03",
  "title": "AI 音乐制作",
  "status": "已上线",
  "description": "输入一段歌词或描述你想要的曲风，AI 自动生成带人声或纯器乐的完整歌曲。支持流行、摇滚、电子、古典等多种风格。",
  "chips": ["流行", "摇滚", "电子", "说唱", "古典", "民谣", "R&B", "爵士"],
  "cta": "进入音乐工作台"
}
```

同步更新 `en.json` 对应英文版。

## 六、前端 — 首页 AI 音乐卡片

**文件**: `src/components/sections/engines.tsx`

当前布局为 2 列 grid (`md:grid-cols-2`)，需改为 3 列 (`md:grid-cols-3`)，并新增第三个卡片。

**关键改动**：
1. 新增 icon 导入 `Music` from `lucide-react`
2. 新增 `musicChips` 从 i18n 获取
3. Grid 改为 `md:grid-cols-3`
4. 参考 "AI 证件照" 卡片样式复制一个 AI 音乐卡片：
   - 渐变背景 blob：`from-emerald-400/30 via-teal-400/20 to-transparent`（音乐用绿色系）
   - 图标容器：`bg-gradient-to-br from-emerald-400 to-teal-600`
   - 图标：`Music` lucide icon
   - 状态：`已上线` 绿色 chip
   - 标签 chips：音乐曲风列表
   - 按钮：`进入音乐工作台` → 链接到 `/music`
   - 未登录时导向 `/auth/signup`

## 七、前端 — 音乐工作台详情页

**路径**: `src/app/[locale]/music/page.tsx`

参考 `src/app/[locale]/workspace/page.tsx` 的页面结构：

1. **页面布局**：
   - 顶部导航（返回首页链接 + 标题 + 描述）
   - 左侧：音乐生成表单区
   - 右侧：生成历史 / 播放区

2. **音乐生成表单**（作为客户端组件 `src/components/workspace/music-studio.tsx`）：
   - 模式切换：简单模式 (customMode=false) / 自定义模式 (customMode=true)
   - 简单模式：
     - 提示词 textarea（描述想要的音乐，最长 500 字符）
     - 是否纯器乐 toggle
     - 模型选择下拉框
   - 自定义模式：
     - 歌词 prompt textarea（最长 5000 字符）
     - 曲风 style 输入
     - 歌曲标题 title 输入
     - 是否纯器乐 toggle
     - 人声性别选择 (男 / 女)
     - 模型选择下拉框
   - 积分消耗提示
   - 生成按钮

3. **生成结果展示**：
   - 音频播放器（使用 HTML5 `<audio>` 标签）
   - 流式播放和下载链接
   - 封面图片展示
   - 生成状态轮询（每 10 秒查询 `/api/music/task?taskId=xxx`）

4. **历史记录区域**：
   - 调用 `/api/music/history` 获取列表
   - 卡片式展示（曲目标题、曲风标签、时长、状态、播放按钮）

5. **鉴权**：未登录重定向到登录页

## 八、Header 导航更新

在 `src/components/layout/header.tsx` 中可选地添加 "AI 音乐" 导航入口（可选，后续再做）。Footer 页脚也可选更新。

## 九、积分消耗常量

在 `src/lib/photo/specs.ts` 或新建 `src/lib/music/constants.ts` 中定义：

```ts
export const COST_PER_MUSIC = 20; // 每次音乐生成消耗 20 积分
```

## 十、实现顺序

| 序号 | 任务 | 涉及文件 |
|------|------|----------|
| 1 | 数据库新增 music_tasks 表 | `src/db/schema.ts` |
| 2 | 环境变量校验新增 SUNO_KEY | `src/config/env.ts` |
| 3 | Suno API 客户端实现 | `src/lib/suno.ts` (新建) |
| 4 | 积分常量定义 | `src/lib/music/constants.ts` (新建) |
| 5 | API 路由：音乐生成 | `src/app/api/music/generate/route.ts` (新建) |
| 6 | API 路由：任务查询 | `src/app/api/music/task/route.ts` (新建) |
| 7 | API 路由：历史记录 | `src/app/api/music/history/route.ts` (新建) |
| 8 | i18n 翻译新增 | `src/i18n/messages/zh.json`, `en.json` |
| 9 | 首页卡片修改 (2列→3列 + 音乐卡片) | `src/components/sections/engines.tsx` |
| 10 | 音乐工作台详情页 | `src/app/[locale]/music/page.tsx` (新建) |
| 11 | 音乐工作室组件 | `src/components/workspace/music-studio.tsx` (新建) |
