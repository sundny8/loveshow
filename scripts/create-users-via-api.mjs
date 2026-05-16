/**
 * Create users using Better-Auth API directly
 * This ensures password hashing is handled correctly by Better-Auth
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const users = [
  {
    name: 'admin',
    email: 'admin@123.com',
    password: '*Asdf9527',
  },
  {
    name: 'test',
    email: 'test@126.com',
    password: '*Asdf9527',
  },
];

async function createUsers() {
  console.log(`📡 Calling Better-Auth at: ${APP_URL}\n`);

  for (const u of users) {
    try {
      const response = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: u.name,
          email: u.email,
          password: u.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Created user: ${u.name} <${u.email}>`);
      } else {
        console.log(`⚠️  User ${u.email}: ${data.message || data.error || 'Already exists or failed'}`);
      }
    } catch (err) {
      console.error(`❌ Failed to create ${u.email}:`, err.message);
    }
  }

  console.log('\n🎉 Done!');
}

createUsers();
