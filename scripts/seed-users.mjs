/**
 * Seed script: create admin + test users in PostgreSQL via Better-Auth schema
 * Usage: node scripts/seed-users.mjs
 */
import postgres from 'postgres';
import { createHash, randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
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

// Simple bcrypt-compatible password hashing using Better-Auth's default
// Better-Auth uses bcrypt with cost=10 by default. We'll use the `bcryptjs` 
// package if available, otherwise fallback to crypto-based SHA256 placeholder.
async function hashPassword(password) {
  try {
    // Try bcryptjs first (pure JS, no native deps)
    const { hash } = await import('bcryptjs');
    return await hash(password, 10);
  } catch {
    try {
      // Try bcrypt (native)
      const bcrypt = await import('bcrypt');
      return await bcrypt.default.hash(password, 10);
    } catch {
      // Fallback: use a SHA256 hex (NOT production-safe, but enough for dev seeding)
      console.warn('⚠️  bcryptjs/bcrypt not found — using SHA256 fallback. Install bcryptjs for proper hashing.');
      return 'sha256:' + createHash('sha256').update(password).digest('hex');
    }
  }
}

function generateId() {
  return randomBytes(16).toString('hex');
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

console.log('🔌 Connecting to:', DATABASE_URL.replace(/:([^:@]+)@/, ':***@'));

const sql = postgres(DATABASE_URL, { max: 1 });

const users = [
  {
    name: 'admin',
    email: 'admin@123.com',
    role: 'ADMIN',
    password: '*Asdf9527',
  },
  {
    name: 'test',
    email: 'test@126.com',
    role: 'USER',
    password: '*Asdf9527',
  },
];

async function seed() {
  try {
    // Verify connection
    await sql`SELECT 1`;
    console.log('✅ DB connection OK\n');

    for (const u of users) {
      const existingUser = await sql`SELECT id FROM users WHERE email = ${u.email} LIMIT 1`;
      if (existingUser.length > 0) {
        console.log(`⏭️  User ${u.email} already exists, skipping.`);
        continue;
      }

      const userId = generateId();
      const accountId = generateId();
      const hashedPassword = await hashPassword(u.password);
      const now = new Date();

      // Insert user
      await sql`
        INSERT INTO users (id, name, email, email_verified, points_balance, role, created_at, updated_at)
        VALUES (${userId}, ${u.name}, ${u.email}, true, 100, ${u.role}, ${now}, ${now})
      `;

      // Insert credential account (Better-Auth credential format)
      await sql`
        INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
        VALUES (${accountId}, ${u.email}, 'credential', ${userId}, ${hashedPassword}, ${now}, ${now})
      `;

      console.log(`✅ Created user: ${u.name} <${u.email}> [${u.role}]`);
    }

    console.log('\n🎉 Seed complete!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message || err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seed();
