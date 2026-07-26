/**
 * Reset an admin account's password hash using Better-Auth's exact scrypt params.
 * Usage: NEW_PASSWORD='...' [ADMIN_EMAIL='admin@123.com'] node scripts/reset-admin-password.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { scrypt, randomBytes } from 'node:crypto';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
const m = env.match(/^DATABASE_URL=(.+)$/m);
const sql = postgres(m[1].trim());

const PASSWORD = process.env.NEW_PASSWORD || '*Asdf9527';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@123.com';

function generateKey(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });
}

const salt = randomBytes(16).toString('hex');
const key = await generateKey(PASSWORD, salt);
const hashed = `${salt}:${key.toString('hex')}`;

const result = await sql`
  update accounts set password = ${hashed}, updated_at = now()
  where account_id = ${EMAIL} and provider_id = 'credential'
  returning account_id`;

console.log(result.length ? `✅ Password reset for ${result[0].account_id}` : `❌ No credential account found for ${EMAIL}`);
await sql.end();
