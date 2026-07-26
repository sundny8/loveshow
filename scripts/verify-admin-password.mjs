/** One-off: verify the stored scrypt hash actually matches the expected password. */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { scrypt } from 'node:crypto';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
const m = env.match(/^DATABASE_URL=(.+)$/m);
const sql = postgres(m[1].trim());

const PASSWORD = process.env.CHECK_PASSWORD || '*Asdf9527';

// Same params as @better-auth/utils password.node
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

const rows = await sql`
  select a.account_id, a.password
  from accounts a
  where a.account_id in ('admin@123.com', 'test@126.com') and a.provider_id = 'credential'`;

for (const row of rows) {
  const [salt, storedKey] = row.password.split(':');
  const key = await generateKey(PASSWORD, salt);
  const matches = key.toString('hex') === storedKey;
  console.log(`${row.account_id}: salt_len=${salt.length}, key_len=${storedKey?.length}, matches "${PASSWORD}": ${matches}`);
}

await sql.end();
