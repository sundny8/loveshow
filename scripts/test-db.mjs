import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
const DATABASE_URL = match ? match[1].trim() : '';

console.log('Connecting to:', DATABASE_URL.replace(/:([^:@]+)@/, ':***@'));

const sql = postgres(DATABASE_URL, { connect_timeout: 15 });

try {
  const result = await sql`SELECT 1 AS ok`;
  console.log('✅ DB connection OK:', result);
  await sql.end();
  process.exit(0);
} catch (e) {
  console.error('❌ DB connection failed:', e.message);
  await sql.end();
  process.exit(1);
}
