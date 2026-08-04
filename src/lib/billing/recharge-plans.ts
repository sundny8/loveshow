import 'server-only';

export const RECHARGE_PLANS = {
  creator: { name: 'Creator', amount: '1.00', amountCents: 100, points: 300 },
  enthusiast: { name: 'Enthusiast', amount: '49.90', amountCents: 4990, points: 700 },
  studio: { name: 'Studio', amount: '99.90', amountCents: 9990, points: 1500 },
} as const;

export type RechargePlanKey = keyof typeof RECHARGE_PLANS;

export function isRechargePlanKey(value: unknown): value is RechargePlanKey {
  return typeof value === 'string' && value in RECHARGE_PLANS;
}

export function getWaffoProductId(planKey: RechargePlanKey): string {
  const ids: Record<RechargePlanKey, string | undefined> = {
    creator: process.env.WAFFO_PRODUCT_ID_CREATOR,
    enthusiast: process.env.WAFFO_PRODUCT_ID_ENTHUSIAST,
    studio: process.env.WAFFO_PRODUCT_ID_STUDIO,
  };
  const productId = ids[planKey]?.trim();

  if (!productId) {
    throw new Error(`WAFFO_PRODUCT_ID_${planKey.toUpperCase()} is required`);
  }

  return productId;
}
