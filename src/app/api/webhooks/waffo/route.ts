import { NextResponse } from 'next/server';
import {
  verifyWebhook,
  WebhookEventType,
  type WebhookEventData,
} from '@waffo/pancake-ts';
import { fulfillWaffoRecharge } from '@/lib/services/billing';
import {
  isRechargePlanKey,
  RECHARGE_PLANS,
} from '@/lib/billing/recharge-plans';
import { getWaffoEnvironment } from '@/lib/waffo';

export const runtime = 'nodejs';

function displayAmountToCents(amount: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) return null;
  const [whole, fraction = ''] = amount.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-waffo-signature');

  let event;
  try {
    event = verifyWebhook<WebhookEventData>(rawBody, signature, {
      environment: getWaffoEnvironment(),
    });
  } catch (error) {
    console.error('Waffo webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const environment = getWaffoEnvironment();
  const storeId = process.env.WAFFO_STORE_ID?.trim();
  if (!storeId) {
    console.error('Waffo webhook rejected: WAFFO_STORE_ID is not configured');
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });
  }
  if (event.mode !== environment || event.storeId !== storeId) {
    console.error('Waffo webhook rejected: environment or store mismatch', {
      eventId: event.id,
      mode: event.mode,
      storeId: event.storeId,
    });
    return NextResponse.json({ error: 'Webhook target mismatch' }, { status: 400 });
  }

  if (event.eventType !== WebhookEventType.OrderCompleted) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const data = event.data;
    const metadata = data.orderMetadata;
    const internalOrderId = data.orderMerchantExternalId;
    const userId = data.merchantProvidedBuyerIdentity;
    const planKey = metadata?.planKey;

    if (
      !internalOrderId ||
      !userId ||
      !metadata ||
      metadata.orderId !== internalOrderId ||
      metadata.userId !== userId ||
      !isRechargePlanKey(planKey)
    ) {
      throw new Error('Missing or inconsistent signed order metadata');
    }

    const plan = RECHARGE_PLANS[planKey];
    const subtotalCents = displayAmountToCents(data.subtotal || data.amount);
    if (
      data.currency !== 'USD' ||
      subtotalCents !== plan.amountCents ||
      metadata.points !== String(plan.points) ||
      (data.paymentStatus && data.paymentStatus !== 'succeeded')
    ) {
      throw new Error('Paid order does not match the configured recharge plan');
    }

    const result = await fulfillWaffoRecharge({
      orderId: internalOrderId,
      userId,
      waffoOrderId: data.orderId,
      paymentMethod: data.paymentMethod,
    });

    return NextResponse.json({ received: true, fulfilled: result.fulfilled });
  } catch (error) {
    console.error('Waffo webhook fulfillment failed:', {
      deliveryId: event.id,
      eventId: event.eventId,
      error,
    });
    // Non-2xx makes Waffo retry transient database/fulfillment failures.
    return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 });
  }
}
