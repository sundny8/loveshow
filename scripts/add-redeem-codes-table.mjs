import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function main() {
  console.log('Creating redeem_codes table if not exists...');
  await sql`
    CREATE TABLE IF NOT EXISTS redeem_codes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      plan_type TEXT NOT NULL,
      points INTEGER NOT NULL,
      is_used BOOLEAN NOT NULL DEFAULT FALSE,
      used_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_redeem_codes_is_used ON redeem_codes (is_used);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_redeem_codes_plan_type ON redeem_codes (plan_type);`;
  console.log('Done.');
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
