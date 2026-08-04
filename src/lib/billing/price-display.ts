const configuredUsdToCnyRate = Number(process.env.NEXT_PUBLIC_USD_TO_CNY_RATE);

// Keep checkout/accounting in USD. This rate is only for localized display.
export const USD_TO_CNY_RATE =
  Number.isFinite(configuredUsdToCnyRate) && configuredUsdToCnyRate > 0
    ? configuredUsdToCnyRate
    : 7.2;

export function parseUsdPrice(price: string): number {
  const amount = Number(price.replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

export function formatPlanPrice(price: string, locale: string): string {
  const amountUsd = parseUsdPrice(price);
  const isChinese = locale.startsWith('zh');

  return new Intl.NumberFormat(isChinese ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: isChinese ? 'CNY' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isChinese ? amountUsd * USD_TO_CNY_RATE : amountUsd);
}

export function formatUsdAmount(amountCents: number, locale: string): string {
  const amountUsd = amountCents / 100;
  const isChinese = locale.startsWith('zh');

  return new Intl.NumberFormat(isChinese ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: isChinese ? 'CNY' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isChinese ? amountUsd * USD_TO_CNY_RATE : amountUsd);
}
