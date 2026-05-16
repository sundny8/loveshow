import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { genericOAuth } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "wechat",
          clientId: process.env.WECHAT_CLIENT_ID || '',
          clientSecret: process.env.WECHAT_CLIENT_SECRET || '',
          authorizationUrl: process.env.WECHAT_AUTH_URL || '',
          tokenUrl: process.env.WECHAT_TOKEN_URL || '',
          getUserInfo: async (tokens: any) => {
            const url = process.env.WECHAT_USER_INFO_URL || '';
            if (!url) return null as any;
            const res = await fetch(`${url}?access_token=${tokens.accessToken}`);
            return res.ok ? await res.json() : null;
          },
        }
      ]
    })
  ],
});

export type Session = typeof auth.$Infer.Session;
