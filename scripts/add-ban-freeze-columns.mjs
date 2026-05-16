import postgres from 'postgres';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env.local manually
dotenv.config();
try {
  const envLocal = readFileSync(resolve('.env.local'), 'utf-8');
  for (const line of envLocal.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex !== -1) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
} catch (e) {
  console.log('.env.local not found, using .env');
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function main() {
  console.log('Adding is_banned and is_frozen columns to users table...');
  
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false`;
    console.log('✅ Added is_banned column');
    
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT false`;
    console.log('✅ Added is_frozen column');
    
    console.log('🎉 Done!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

main();
