/**
 * Reseed users with scrypt password hash (Better-Auth default)
 */
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scryptAsync = promisify(scrypt);

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

// Better-Auth uses scrypt with these default parameters
async function hashPassword(password) {
  const salt = randomBytes(16);
  const keyLength = 64;
  const N = 16384; // cost parameter
  const r = 8; // block size
  const p = 1; // parallelization
  
  const derivedKey = await scryptAsync(password, salt, keyLength, { N, r, p });
  
  // Format: scrypt:salt:hash (base64 encoded)
  const hash = `${salt.toString('base64')}:${derivedKey.toString('base64')}`;
  return hash;
}

function generateId() {
  return randomBytes(16).toString('hex');
}

async function reseed() {
  try {
    await sql`SELECT 1`;
    console.log('✅ DB connection OK\n');

    // Delete existing accounts for admin and test
    await sql`DELETE FROM accounts WHERE account_id IN ('admin@123.com', 'test@126.com')`;
    await sql`DELETE FROM users WHERE email IN ('admin@123.com', 'test@126.com')`;
    console.log('✅ Cleared existing users\n');

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

    const now = new Date();

    for (const u of users) {
      const userId = generateId();
      const accountId = generateId();
      
      // Use scrypt (Better-Auth default)
      const hashedPassword = await hashPassword(u.password);
      console.log(`Password hash for ${u.email}: ${hashedPassword.substring(0, 50)}...`);

      // Insert user
      await sql`
        INSERT INTO users (id, name, email, email_verified, points_balance, role, created_at, updated_at)
        VALUES (${userId}, ${u.name}, ${u.email}, true, 100, ${u.role}, ${now}, ${now})
      `;

      // Insert credential account
      await sql`
        INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
        VALUES (${accountId}, ${u.email}, 'credential', ${userId}, ${hashedPassword}, ${now}, ${now})
      `;

      console.log(`✅ Created user: ${u.name} <${u.email}> [${u.role}]\n`);
    }

    console.log('🎉 Reseed with scrypt complete!');

  } catch (err) {
    console.error('❌ Reseed failed:', err.message || err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

reseed();
