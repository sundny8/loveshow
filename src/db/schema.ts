import { pgTable, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  phone: text('phone').unique(),
  wechatId: text('wechat_id').unique(),
  pointsBalance: integer('points_balance').notNull().default(20),
  role: text('role').notNull().default('USER'),
  isBanned: boolean('is_banned').notNull().default(false),
  isFrozen: boolean('is_frozen').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`),
});

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  stripeCurrentPeriodEnd: timestamp('stripe_current_period_end'),
  status: text('status').notNull().default('inactive'),
  plan: text('plan').notNull().default('free'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const pointTransactions = pgTable('point_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  type: text('type').notNull(), // RECHARGE, GENERATE_COST, REFUND
  description: text('description'),
  relatedOrderId: text('related_order_id'),
  relatedTaskId: text('related_task_id'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('PENDING'), // PENDING, PAID, FAILED
  amountCents: integer('amount_cents').notNull(),
  paymentMethod: text('payment_method'),
  planType: text('plan_type'),
  externalTransactionId: text('external_transaction_id'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  paidAt: timestamp('paid_at'),
});

export const imageTasks = pgTable('image_tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('PENDING'), // PENDING, PROCESSING, COMPLETED, FAILED
  platform: text('platform').notNull().default('photo'),
  promptPayload: jsonb('prompt_payload'),
  originalImageUrl: text('original_image_url'),
  costPoints: integer('cost_points').notNull().default(10),
  aiProvider: text('ai_provider'),
  errorMessage: text('error_message'),
  // LoveShow AI 证件照扩展字段
  specId: text('spec_id'),
  gender: text('gender'),
  ageBucket: text('age_bucket'),
  skinTone: text('skin_tone'),
  batchId: text('batch_id'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  completedAt: timestamp('completed_at'),
});

export const generatedImages = pgTable('generated_images', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => imageTasks.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  width: integer('width'),
  height: integer('height'),
  isFavorited: boolean('is_favorited').notNull().default(false),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
});

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const organizationMembers = pgTable('organization_members', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // owner, admin, member
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const invitations = pgTable('invitations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('pending'), // pending, accepted, declined
  expiresAt: timestamp('expires_at').notNull(),
  invitedBy: text('invited_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const blogPosts = pgTable('blog_posts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull().default(''),
  coverImage: text('cover_image'),
  published: boolean('published').notNull().default(false),
  publishedAt: timestamp('published_at'),
  locale: text('locale').notNull().default('en'),
  category: text('category'),
  tags: jsonb('tags').$type<string[]>(),
  readingTime: text('reading_time'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const musicTasks = pgTable('music_tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('PENDING'), // PENDING, GENERATING, SUCCESS, FAILED
  sunoTaskId: text('suno_task_id'),
  prompt: text('prompt').notNull(),
  style: text('style'),
  title: text('title'),
  instrumental: boolean('instrumental').notNull().default(false),
  model: text('model').notNull().default('V4_5ALL'),
  customMode: boolean('custom_mode').notNull().default(false),
  lyrics: text('lyrics'),
  resultData: jsonb('result_data'),
  tosAudioUrls: jsonb('tos_audio_urls').$type<string[]>(),
  costPoints: integer('cost_points').notNull().default(30),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  completedAt: timestamp('completed_at'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type ImageTask = typeof imageTasks.$inferSelect;
export type GeneratedImage = typeof generatedImages.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type MusicTask = typeof musicTasks.$inferSelect;
export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export const loveColumnRecords = pgTable('love_column_records', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // copy | couple-photo | couple-avatar | analysis | memoir
  payload: jsonb('payload').notNull(), // input + output
  imageUrls: jsonb('image_urls').$type<string[]>(),
  creditsUsed: integer('credits_used').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
});

export type LoveColumnRecord = typeof loveColumnRecords.$inferSelect;

export const redeemCodes = pgTable('redeem_codes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  planType: text('plan_type').notNull(), // creator | enthusiast | studio
  points: integer('points').notNull(),
  isUsed: boolean('is_used').notNull().default(false),
  usedBy: text('used_by').references(() => users.id, { onDelete: 'set null' }),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
});

export type RedeemCode = typeof redeemCodes.$inferSelect;
