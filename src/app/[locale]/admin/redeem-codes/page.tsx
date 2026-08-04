'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Copy,
  RefreshCw,
  Loader2,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const selectClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-900/40';

interface RedeemCode {
  id: string;
  code: string;
  planType: string;
  points: number;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
  usedByName: string | null;
  usedByEmail: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  starter: '旧套餐 / 140 积分',
  creator: 'USD 19.90 / 300 积分',
  enthusiast: '¥49.9 / 700 积分',
  studio: '¥99.9 / 1500 积分',
};

export default function RedeemCodesPage() {
  const t = useTranslations('admin.redeemCodesPage');
  const { toast } = useToast();
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('creator');
  const [batchCount, setBatchCount] = useState(10);
  const [filterPlan, setFilterPlan] = useState('all');

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/redeem-codes');
      if (res.ok) {
        setCodes(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/redeem-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: selectedPlan, count: batchCount }),
      });

      if (res.ok) {
        const newCodes = await res.json();
        toast({
          type: 'success',
          title: t('generateSuccess', { count: newCodes.length }),
        });
        fetchCodes();
      } else {
        toast({ type: 'error', title: t('generateFailed') });
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
      toast({ type: 'error', title: t('generateFailed') });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ type: 'success', title: t('copySuccess') });
  };

  const filteredUnusedCodes = codes.filter(
    (c) => !c.isUsed && (filterPlan === 'all' || c.planType === filterPlan)
  );

  const copyAllFilteredCodes = () => {
    if (filteredUnusedCodes.length === 0) {
      toast({ type: 'info', title: t('noUnusedCodes') });
      return;
    }
    const text = filteredUnusedCodes.map((c) => c.code).join('\n');
    navigator.clipboard.writeText(text);
    toast({ type: 'success', title: t('copiedCount', { count: filteredUnusedCodes.length }) });
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const getPlanLabel = (type: string) => PLAN_LABELS[type] || type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-slate-500">{t('subtitle')}</p>
        </div>
        <Button variant="outline" onClick={fetchCodes} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-violet-600" />
            {t('generate')}
          </CardTitle>
          <CardDescription>{t('generateDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end max-w-3xl">
            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-medium">{t('selectPlan')}</label>
              <select
                className={selectClass}
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <option value="creator">创作者 (USD 19.90 / 300 积分)</option>
                <option value="enthusiast">发烧友 (¥49.9 / 700 积分)</option>
                <option value="studio">工作室 (¥99.9 / 1500 积分)</option>
              </select>
            </div>
            <div className="w-full sm:w-32 space-y-2">
              <label className="text-sm font-medium">{t('count')}</label>
              <select
                className={selectClass}
                value={String(batchCount)}
                onChange={(e) => setBatchCount(Number(e.target.value))}
              >
                <option value="1">1</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full sm:w-auto min-w-[140px]">
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? t('generating') : t('generateBtn')}
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="text-sm font-medium mb-2 block">{t('filterAndCopy')}</label>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <select
                className={`${selectClass} w-full sm:w-auto min-w-[200px]`}
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
              >
                <option value="all">{t('allPlans')}</option>
                <option value="creator">创作者 (USD 19.90)</option>
                <option value="enthusiast">发烧友 (¥49.9)</option>
                <option value="studio">工作室 (¥99.9)</option>
              </select>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 whitespace-nowrap">
                  {t('totalUnused')} <span className="font-bold text-violet-600">{filteredUnusedCodes.length}</span>
                </span>
                <Button variant="outline" onClick={copyAllFilteredCodes} disabled={filteredUnusedCodes.length === 0} className="whitespace-nowrap">
                  <Copy className="h-4 w-4 mr-2" />
                  {t('copyAll')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5 text-violet-600" />
            {t('codeList')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-4 px-4 font-semibold text-sm text-slate-500 uppercase tracking-wider">{t('code')}</th>
                  <th className="text-left py-4 px-4 font-semibold text-sm text-slate-500 uppercase tracking-wider">{t('plan')}</th>
                  <th className="text-left py-4 px-4 font-semibold text-sm text-slate-500 uppercase tracking-wider">{t('status')}</th>
                  <th className="text-left py-4 px-4 font-semibold text-sm text-slate-500 uppercase tracking-wider">{t('redeemedBy')}</th>
                  <th className="text-left py-4 px-4 font-semibold text-sm text-slate-500 uppercase tracking-wider">{t('redeemedAt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && codes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      {t('loading')}
                    </td>
                  </tr>
                ) : codes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-500">
                      {t('empty')}
                    </td>
                  </tr>
                ) : (
                  codes.map((code) => (
                    <tr key={code.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-semibold font-mono tracking-tighter">
                            {code.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
                            title={t('copyTooltip')}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium">
                        <Badge variant="outline" className="font-bold border-violet-200 text-violet-700 dark:border-violet-900 dark:text-violet-400">
                          {getPlanLabel(code.planType)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {code.isUsed ? (
                          <div className="flex items-center gap-1.5 text-red-600 font-medium">
                            <XCircle className="h-4 w-4" />
                            {t('used')}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-green-600 font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            {t('unused')}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {code.isUsed ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{code.usedByName || 'Unknown'}</span>
                            <span className="text-xs text-slate-500">{code.usedByEmail}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-500 whitespace-nowrap font-mono">
                        {code.isUsed && code.usedAt ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(code.usedAt).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
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
