'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Zap, Download, Ticket, Loader2, QrCode, Copy, Smartphone, Check as CheckIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PlanItem {
  key: string;
  name: string;
  price: string;
  unit: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const invoices = [
  { id: 'INV-001', date: '2024-03-01', amount: '$29.00', status: 'Paid' },
  { id: 'INV-002', date: '2024-02-01', amount: '$29.00', status: 'Paid' },
  { id: 'INV-003', date: '2024-01-01', amount: '$29.00', status: 'Paid' },
];

export default function BillingPage() {
  const { data: session, isPending } = useSession();
  const t = useTranslations('dashboard.billing');
  // Reuse homepage pricing copy so the plans stay in sync with the landing page
  const tPricing = useTranslations('pricing');

  const [points, setPoints] = useState<number | null>(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const RECHARGE_URL = 'https://m.tb.cn/h.RYAyE4y?tk=X7Ih5IKfXJm';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(RECHARGE_URL);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch (e) {
      console.error('copy failed:', e);
    }
  };

  useEffect(() => {
    if (!session) return;
    fetch('/api/user/points')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && typeof d.points === 'number') setPoints(d.points); })
      .catch(() => {});
  }, [session]);

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setIsRedeeming(true);
    setRedeemMessage(null);
    try {
      const res = await fetch('/api/billing/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPoints(data.newBalance);
        setRedeemCode('');
        setRedeemMessage({ type: 'success', text: `兑换成功！获得 ${data.points} 积分，当前余额 ${data.newBalance} 积分` });
      } else {
        setRedeemMessage({ type: 'error', text: data.error || '兑换失败' });
      }
    } catch {
      setRedeemMessage({ type: 'error', text: '兑换失败，请重试' });
    } finally {
      setIsRedeeming(false);
    }
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
    { ...tPricing.raw('plans.starter'), key: 'starter', highlight: false } as PlanItem,
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
      </div>

      {/* Current Balance */}
      <Card className="mb-8 border-primary-200 dark:border-primary-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary-600" />
                {t('balance.title')}
              </CardTitle>
              <CardDescription>{t('balance.description')}</CardDescription>
            </div>
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 items-stretch">
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
              <p className="text-3xl font-bold mb-4">{plan.price}</p>
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
                disabled={plan.key === 'trial'}
              >
                {plan.key === 'trial' ? t('trialIncluded') : plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QR Code Recharge */}
      <Card className="mb-8 border-rose-200 dark:border-rose-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-rose-600" />
            {t('qrcode.title')}
          </CardTitle>
          <CardDescription>{t('qrcode.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* QR Code Image */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative p-3 bg-white rounded-2xl shadow-md border border-rose-100 dark:border-rose-900/40">
                <Image
                  src="/qrcode/qrcode.jpg"
                  alt="Recharge QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg object-contain"
                  priority
                />
              </div>
              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-400">
                <Smartphone className="h-4 w-4" />
                {t('qrcode.scanHint')}
              </div>
            </div>

            {/* Link Section */}
            <div className="flex-1 w-full space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t('qrcode.linkLabel')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={RECHARGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-700 dark:text-slate-200 hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors break-all"
                >
                  {RECHARGE_URL}
                </a>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="min-w-[120px]"
                >
                  {linkCopied ? (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2 text-emerald-500" />
                      {t('qrcode.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      {t('qrcode.copyLink')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redeem Code */}
      <Card className="mb-8 border-violet-200 dark:border-violet-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-violet-600" />
            {t('redeem.title')}
          </CardTitle>
          <CardDescription>{t('redeem.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder={t('redeem.placeholder')}
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              className="flex-1 font-mono"
              disabled={isRedeeming}
              onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
            />
            <Button
              onClick={handleRedeem}
              disabled={isRedeeming || !redeemCode.trim()}
              className="min-w-[120px]"
            >
              {isRedeeming ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Ticket className="h-4 w-4 mr-2" />
              )}
              {isRedeeming ? t('redeem.redeeming') : t('redeem.button')}
            </Button>
          </div>
          {redeemMessage && (
            <p className={`mt-3 text-sm ${redeemMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {redeemMessage.text}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('paymentMethod.title')}
          </CardTitle>
          <CardDescription>{t('paymentMethod.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-slate-500">{t('paymentMethod.expires', { date: '12/2025' })}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              {t('paymentMethod.update')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('history.title')}
          </CardTitle>
          <CardDescription>{t('history.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">{t('history.invoice')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">{t('history.date')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">{t('history.amount')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">{t('history.status')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">{t('history.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium">{invoice.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{invoice.date}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{invoice.amount}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="success">{invoice.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
