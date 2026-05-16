import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
const m = env.match(/^DATABASE_URL=(.+)$/m);
const sql = postgres(m[1].trim());

const users = await sql`SELECT u.id, u.name, u.email, u.role, u.points_balance, a.password FROM users u LEFT JOIN accounts a ON u.id = a.user_id AND a.provider_id = 'credential'`;
console.log('Users in database:');
for (const u of users) {
  console.log(`  - ${u.name} (${u.email}) [${u.role}] - password: ${u.password?.substring(0, 20)}...`);
}

const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
console.log('\nTables:', tables.map(t => t.table_name).join(', '));

await sql.end();
