'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, ReceiptText, RefreshCw, Zap } from 'lucide-react';
import Link from 'next/link';
import { formatPlanPrice, formatUsdAmount, USD_TO_CNY_RATE } from '@/lib/billing/price-display';

type PaidPlanKey = 'creator' | 'enthusiast' | 'studio';

interface PlanItem {
  key: PaidPlanKey | 'trial';
  name: string;
  price: string;
  unit: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

interface BillingOrder {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  planType: string | null;
  planName: string;
  expectedPoints: number | null;
  creditedPoints: number | null;
  externalTransactionId: string | null;
  createdAt: string;
  paidAt: string | null;
  creditedAt: string | null;
}

export default function BillingPage() {
  const { data: session, isPending } = useSession();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const t = useTranslations('dashboard.billing');
  // Reuse homepage pricing copy so the plans stay in sync with the landing page
  const tPricing = useTranslations('pricing');

  const [points, setPoints] = useState<number | null>(null);
  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PaidPlanKey | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    checkoutUrl?: string;
  } | null>(null);

  const paymentReturned = searchParams.get('payment') === 'success';

  const fetchPoints = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/user/points', { cache: 'no-store' });
      const data = res.ok ? await res.json() : null;
      if (data && typeof data.points === 'number') {
        setPoints(data.points);
      }
    } catch {
      // Keep the last known balance visible if a transient refresh fails.
    }
  }, [session]);

  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!session) return;
      if (!silent) setIsOrdersLoading(true);
      setOrdersError(null);

      try {
        const res = await fetch('/api/billing/orders', { cache: 'no-store' });
        const data = res.ok ? await res.json() : null;

        if (!res.ok || !Array.isArray(data?.orders)) {
          throw new Error(data?.error || 'Unable to load billing history');
        }

        setOrders(data.orders);
      } catch (error) {
        setOrdersError(error instanceof Error ? error.message : 'Unable to load billing history');
      } finally {
        if (!silent) setIsOrdersLoading(false);
      }
    },
    [session]
  );

  const refreshBillingData = useCallback(
    async (silent = false) => {
      await Promise.all([fetchPoints(), fetchOrders(silent)]);
    },
    [fetchOrders, fetchPoints]
  );

  useEffect(() => {
    void refreshBillingData();
  }, [refreshBillingData]);

  useEffect(() => {
    if (!session || !paymentReturned) return;

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      void refreshBillingData(true);

      if (attempts >= 30) {
        window.clearInterval(intervalId);
      }
    }, 2000);

    void refreshBillingData(true);

    return () => window.clearInterval(intervalId);
  }, [paymentReturned, refreshBillingData, session]);

  useEffect(() => {
    if (!session) return;

    const refreshOnFocus = () => {
      void refreshBillingData(true);
    };
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') refreshOnFocus();
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisible);

    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, [refreshBillingData, session]);

  const handleCheckout = async (planKey: PaidPlanKey) => {
    setCheckoutPlan(planKey);
    setCheckoutMessage(null);

    try {
      const res = await fetch('/api/billing/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey, locale }),
      });
      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Unable to start checkout');
      }

      const checkoutWindow = window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
      setCheckoutMessage({
        type: 'success',
        text: checkoutWindow
          ? t('checkout.opened')
          : t('checkout.ready'),
        checkoutUrl: checkoutWindow ? undefined : data.checkoutUrl,
      });
      void fetchOrders(true);
    } catch (error) {
      setCheckoutMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('checkout.failed'),
      });
    } finally {
      setCheckoutPlan(null);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  };

  const getPlanName = (order: BillingOrder) => {
    if (!order.planType) return order.planName;
    const pricingPlans = tPricing.raw('plans') as Record<string, { name?: string }>;
    return pricingPlans[order.planType]?.name || order.planName;
  };

  const getStatusVariant = (status: string): 'success' | 'error' | 'secondary' => {
    if (status === 'PAID') return 'success';
    if (status === 'FAILED') return 'error';
    return 'secondary';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'PAID') return t('history.statuses.paid');
    if (status === 'FAILED') return t('history.statuses.failed');
    if (status === 'PENDING') return t('history.statuses.pending');
    return status;
  };

  if (isPending) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">{t('signIn.title')}</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          {t('signIn.description')}
        </p>
        <Link href="/auth/signin">
          <Button>{t('signIn.button')}</Button>
        </Link>
      </div>
    );
  }

  const plans: PlanItem[] = [
    { ...tPricing.raw('plans.trial'), key: 'trial', highlight: false } as PlanItem,
    { ...tPricing.raw('plans.creator'), key: 'creator', highlight: false } as PlanItem,
    { ...tPricing.raw('plans.enthusiast'), key: 'enthusiast', highlight: true } as PlanItem,
    { ...tPricing.raw('plans.studio'), key: 'studio', highlight: false } as PlanItem,
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-slate-600 dark:text-slate-300">
          {t('subtitle')}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('priceNote', { rate: USD_TO_CNY_RATE.toFixed(2) })}
        </p>
      </div>

      {paymentReturned && (
        <div className="mb-8 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          <p className="font-medium">{t('paymentReturn.title')}</p>
          <p className="mt-1">{t('paymentReturn.description')}</p>
        </div>
      )}

      {/* Current Balance */}
      <Card className="mb-8 border-primary-200 dark:border-primary-800">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary-600" />
                {t('balance.title')}
              </CardTitle>
              <CardDescription>{t('balance.description')}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refreshBillingData(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold text-primary-600">{points ?? '—'}</p>
            <p className="text-sm text-slate-500 mb-1">{t('balance.unit')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      <h2 className="text-xl font-bold mb-4">{t('availablePlans')}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 items-stretch">
        {plans.map((plan) => (
          <Card
            key={plan.key}
            className={`relative flex flex-col h-full ${plan.highlight ? 'border-primary-500 dark:border-primary-500 shadow-lg' : ''}`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white border-0 whitespace-nowrap">
                  {tPricing('mostPopular')}
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.unit}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-3xl font-bold mb-4">{formatPlanPrice(plan.price, locale)}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-auto"
                variant={plan.highlight ? 'primary' : 'outline'}
                disabled={plan.key === 'trial' || checkoutPlan !== null}
                onClick={() => plan.key !== 'trial' && handleCheckout(plan.key)}
              >
                {checkoutPlan === plan.key ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('checkout.opening')}
                  </>
                ) : plan.key === 'trial' ? (
                  t('trialIncluded')
                ) : (
                  plan.cta
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {checkoutMessage && (
        <div
          className={`mb-8 rounded-lg border px-4 py-3 text-sm ${
            checkoutMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
          }`}
        >
          <p>{checkoutMessage.text}</p>
          {checkoutMessage.checkoutUrl && (
            <a
              href={checkoutMessage.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex underline underline-offset-4"
            >
              {t('checkout.openLink')}
            </a>
          )}
        </div>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="h-5 w-5" />
                {t('history.title')}
              </CardTitle>
              <CardDescription>{t('history.description')}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchOrders()}
              disabled={isOrdersLoading}
            >
              {isOrdersLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ordersError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {ordersError}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">{t('history.order')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">{t('history.plan')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">{t('history.amount')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">{t('history.credits')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">{t('history.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">{t('history.paidAt')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">{t('history.paymentId')}</th>
                </tr>
              </thead>
              <tbody>
                {isOrdersLoading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-slate-500">
                      <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
                      {t('history.loading')}
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-slate-500">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{t('history.emptyTitle')}</p>
                      <p className="mt-1">{t('history.emptyDesc')}</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium">{order.id.slice(0, 8)}</span>
                        <span className="block text-xs text-slate-500">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-700 dark:text-slate-200">{getPlanName(order)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-700 dark:text-slate-200">
                          {formatUsdAmount(order.amountCents, locale)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-700 dark:text-slate-200">
                          {order.creditedPoints ?? order.expectedPoints ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusVariant(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {formatDate(order.paidAt || order.creditedAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="block max-w-[220px] truncate font-mono text-xs text-slate-500">
                          {order.externalTransactionId || '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
