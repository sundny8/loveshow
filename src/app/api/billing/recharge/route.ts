import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  attachWaffoCheckoutSession,
  createPendingRechargeOrder,
} from '@/lib/services/billing';
import {
  getWaffoProductId,
  isRechargePlanKey,
  RECHARGE_PLANS,
} from '@/lib/billing/recharge-plans';
import { getWaffoClient, getWaffoErrorMessage } from '@/lib/waffo';

export const runtime = 'nodejs';

const CASHIER_LANGUAGES = {
  en: 'en',
  zh: 'zh-Hans',
  ja: 'ja-JP',
  ko: 'ko-KR',
} as const;

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { planKey?: unknown; locale?: unknown };
    if (!isRechargePlanKey(body.planKey)) {
      return NextResponse.json({ error: 'Invalid recharge plan' }, { status: 400 });
    }

    const planKey = body.planKey;
    const plan = RECHARGE_PLANS[planKey];
    const waffo = getWaffoClient();
    const productId = getWaffoProductId(planKey);
    const orderId = await createPendingRechargeOrder({
      userId: session.user.id,
      planKey,
    });

    const locale =
      typeof body.locale === 'string' && body.locale in CASHIER_LANGUAGES
        ? (body.locale as keyof typeof CASHIER_LANGUAGES)
        : 'en';
    const configuredOrigin =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      new URL(req.url).origin;
    const successUrl = new URL(`/${locale}/dashboard/billing`, configuredOrigin);
    successUrl.searchParams.set('payment', 'success');

    const checkout = await waffo.checkout.authenticated.create({
      productId,
      currency: 'USD',
      buyerIdentity: session.user.id,
      buyerEmail: session.user.email,
      successUrl: successUrl.toString(),
      language: CASHIER_LANGUAGES[locale],
      orderMerchantExternalId: orderId,
      metadata: {
        orderId,
        userId: session.user.id,
        planKey,
        points: String(plan.points),
      },
    });

    await attachWaffoCheckoutSession({
      orderId,
      userId: session.user.id,
      sessionId: checkout.sessionId,
    });

    return NextResponse.json({
      success: true,
      orderId,
      sessionId: checkout.sessionId,
      checkoutUrl: checkout.checkoutUrl,
    });
  } catch (error) {
    console.error('Waffo checkout creation failed:', getWaffoErrorMessage(error));
    const isConfigurationError =
      error instanceof Error &&
      (error.message.startsWith('WAFFO_') || error.message.includes('are required'));
    return NextResponse.json(
      { error: isConfigurationError ? 'Payment service is not configured' : 'Unable to start checkout' },
      { status: isConfigurationError ? 503 : 502 }
    );
  }
}
