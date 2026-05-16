/**
 * Fix user passwords using exact Better-Auth scrypt params
 * N=16384, r=16, p=1, dkLen=64
 * Format: salt_hex:key_hex  (salt = 16 random bytes hex, key = 64 bytes hex)
 */
import postgres from 'postgres';
import { scrypt, randomBytes } from 'node:crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
function loadEnvLocal() {
  try {
    const content = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* ignore */ }
}
loadEnvLocal();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('❌ DATABASE_URL not set'); process.exit(1); }

console.log('🔌 Connecting to:', DATABASE_URL.replace(/:([^:@]+)@/, ':***@'));
const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 15 });

// Exact same as @better-auth/utils/dist/password.node.mjs
function generateKey(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      64,             // dkLen
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, key) => err ? reject(err) : resolve(key)
    );
  });
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await generateKey(password, salt);
  return `${salt}:${key.toString('hex')}`;
}

async function main() {
  await sql`SELECT 1`;
  console.log('✅ DB connected\n');

  // Clear old records
  await sql`DELETE FROM accounts WHERE account_id IN ('admin@123.com', 'test@126.com')`;
  await sql`DELETE FROM users WHERE email IN ('admin@123.com', 'test@126.com')`;
  console.log('🗑️  Cleared old users\n');

  const users = [
    { name: 'admin', email: 'admin@123.com', role: 'ADMIN',  password: '*Asdf9527' },
    { name: 'test',  email: 'test@126.com',  role: 'USER',   password: '*Asdf9527' },
  ];

  const now = new Date();
  for (const u of users) {
    const userId    = randomBytes(16).toString('hex');
    const accountId = randomBytes(16).toString('hex');
    const hashed    = await hashPassword(u.password);

    // Verify format looks right
    const [salt, key] = hashed.split(':');
    console.log(`  salt  : ${salt}  (${salt.length} chars, expect 32)`);
    console.log(`  key   : ${key.substring(0, 32)}...  (${key.length} chars, expect 128)`);

    await sql`
      INSERT INTO users (id, name, email, email_verified, points_balance, role, created_at, updated_at)
      VALUES (${userId}, ${u.name}, ${u.email}, true, 100, ${u.role}, ${now}, ${now})
    `;
    await sql`
      INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
      VALUES (${accountId}, ${u.email}, 'credential', ${userId}, ${hashed}, ${now}, ${now})
    `;
    console.log(`✅ Created: ${u.name} <${u.email}> [${u.role}]\n`);
  }

  console.log('🎉 Done! Try logging in now.');
  await sql.end();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
