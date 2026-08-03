import 'server-only';

import { WaffoPancake, WaffoPancakeError } from '@waffo/pancake-ts';

export type WaffoEnvironment = 'test' | 'prod';

let client: WaffoPancake | null = null;

export function getWaffoEnvironment(): WaffoEnvironment {
  const value = process.env.WAFFO_ENVIRONMENT?.trim().toLowerCase() || 'test';

  if (value !== 'test' && value !== 'prod') {
    throw new Error('WAFFO_ENVIRONMENT must be either "test" or "prod"');
  }

  return value;
}

export function getWaffoClient(): WaffoPancake {
  if (client) return client;

  const merchantId = process.env.WAFFO_MERCHANT_ID?.trim();
  const privateKey = process.env.WAFFO_PRIVATE_KEY?.trim();

  if (!merchantId || !privateKey) {
    throw new Error('WAFFO_MERCHANT_ID and WAFFO_PRIVATE_KEY are required');
  }

  client = new WaffoPancake({
    merchantId,
    privateKey,
    baseUrl: process.env.WAFFO_API_BASE?.trim() || undefined,
  });

  return client;
}

export function getWaffoErrorMessage(error: unknown): string {
  if (error instanceof WaffoPancakeError) {
    return error.errors.map((item) => item.message).join('; ') || error.message;
  }

  return error instanceof Error ? error.message : 'Unknown Waffo error';
}
