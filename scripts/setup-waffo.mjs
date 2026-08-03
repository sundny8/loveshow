import { TaxCategory, WaffoPancake, WebhookEventType } from '@waffo/pancake-ts';

const plans = {
  starter: { name: 'Starter', amount: '9.90', points: 140 },
  creator: { name: 'Creator', amount: '29.90', points: 400 },
  enthusiast: { name: 'Enthusiast', amount: '49.90', points: 700 },
  studio: { name: 'Studio', amount: '99.90', points: 1500 },
};

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value || value.includes('...')) {
    throw new Error(`${name} is required before running this setup script`);
  }
  return value;
}

function siteOrigin() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    throw new Error('NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL is required');
  }
  return raw.replace(/\/$/, '');
}

const merchantId = requiredEnv('WAFFO_MERCHANT_ID');
const privateKey = requiredEnv('WAFFO_PRIVATE_KEY');
const storeId = requiredEnv('WAFFO_STORE_ID');
const environment = process.env.WAFFO_ENVIRONMENT?.trim() || 'test';

if (environment !== 'test' && environment !== 'prod') {
  throw new Error('WAFFO_ENVIRONMENT must be "test" or "prod"');
}

const appUrl = siteOrigin();
const client = new WaffoPancake({
  merchantId,
  privateKey,
  baseUrl: process.env.WAFFO_API_BASE?.trim() || undefined,
});

console.log(`Creating Waffo test products for store ${storeId}`);
console.log('Run this once. Re-running may create duplicate products.');

for (const [planKey, plan] of Object.entries(plans)) {
  const { product, warnings } = await client.onetimeProducts.create({
    storeId,
    name: `LoveShow ${plan.name} Credits`,
    description: `${plan.points} LoveShow AI generation credits.`,
    prices: {
      USD: { amount: plan.amount, taxCategory: TaxCategory.DigitalGoods },
    },
    successUrl: `${appUrl}/en/dashboard/billing?payment=success`,
    metadata: {
      planKey,
      points: plan.points,
      app: 'loveshow',
    },
  });

  console.log(`WAFFO_PRODUCT_ID_${planKey.toUpperCase()}=${product.id}`);
  if (warnings?.length) {
    console.warn(`Warnings for ${planKey}:`, warnings);
  }
}

const webhookUrl = `${appUrl}/api/webhooks/waffo`;
const { webhook, warnings } = await client.webhooks.add({
  storeId,
  channel: 'http',
  url: webhookUrl,
  events: [WebhookEventType.OrderCompleted],
  testMode: environment === 'test',
});

console.log(`Webhook created: ${webhook.id}`);
console.log(`Webhook URL: ${webhookUrl}`);
if (warnings?.length) {
  console.warn('Webhook warnings:', warnings);
}
