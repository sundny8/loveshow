/**
 * Initialize PostgreSQL tables based on schema.ts
 * Usage: node scripts/init-db.mjs
 */
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
function loadEnvLocal() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (e) {
    console.warn('Could not read .env.local:', e.message);
  }
}
loadEnvLocal();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

console.log('🔌 Connecting to:', DATABASE_URL.replace(/:([^:@]+)@/, ':***@'));

const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 15 });

async function initTables() {
  try {
    await sql`SELECT 1`;
    console.log('✅ DB connection OK\n');

    // Create tables in order (respecting foreign key dependencies)
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        email_verified BOOLEAN NOT NULL DEFAULT false,
        image TEXT,
        phone TEXT UNIQUE,
        wechat_id TEXT UNIQUE,
        points_balance INTEGER NOT NULL DEFAULT 0,
        role TEXT NOT NULL DEFAULT 'USER',
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        expires_at TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        ip_address TEXT,
        user_agent TEXT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
      )`,

      `CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        access_token TEXT,
        refresh_token TEXT,
        id_token TEXT,
        access_token_expires_at TIMESTAMP,
        refresh_token_expires_at TIMESTAMP,
        scope TEXT,
        password TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE IF NOT EXISTS verifications (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )`,

      `CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stripe_customer_id TEXT UNIQUE,
        stripe_subscription_id TEXT UNIQUE,
        stripe_price_id TEXT,
        stripe_current_period_end TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'inactive',
        plan TEXT NOT NULL DEFAULT 'free',
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE IF NOT EXISTS point_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        related_order_id TEXT,
        related_task_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'PENDING',
        amount_cents INTEGER NOT NULL,
        payment_method TEXT,
        plan_type TEXT,
        external_transaction_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        paid_at TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS image_tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'PENDING',
        platform TEXT NOT NULL DEFAULT 'photo',
        prompt_payload JSONB,
        original_image_url TEXT,
        cost_points INTEGER NOT NULL DEFAULT 10,
        ai_provider TEXT,
        error_message TEXT,
        spec_id TEXT,
        gender TEXT,
        age_bucket TEXT,
        skin_tone TEXT,
        batch_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        completed_at TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS generated_images (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES image_tasks(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        is_favorited BOOLEAN NOT NULL DEFAULT false,
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )`,
    ];

    const tableNames = [
      'users', 'sessions', 'accounts', 'verifications',
      'subscriptions', 'point_transactions', 'orders',
      'image_tasks', 'generated_images'
    ];

    for (let i = 0; i < tables.length; i++) {
      await sql.unsafe(tables[i]);
      console.log(`✅ Created table: ${tableNames[i]}`);
    }

    // Verify all tables exist
    const result = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    const existingTables = result.map(r => r.table_name);
    console.log('\n📋 Tables in database:', existingTables.join(', '));
    console.log('\n🎉 Database initialization complete!');

  } catch (err) {
    console.error('❌ Init failed:', err.message || err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

initTables();
