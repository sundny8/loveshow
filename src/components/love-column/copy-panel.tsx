'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check, Download, Music as MusicIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const STYLE_IDS = ['sincere', 'literary', 'playful', 'cool', 'cheeky'] as const;
type StyleId = (typeof STYLE_IDS)[number];

interface Props {
  cost: number;
  balance: number | null;
  onSendToMusic: (theme: string, lyrics: string) => void;
  onCreditsChanged: () => void;
}

export function CopyPanel({ cost, balance, onSendToMusic, onCreditsChanged }: Props) {
  const t = useTranslations('column520.copy');
  const tc = useTranslations('column520.common');
  const tErr = useTranslations('column520.common.errors');
  const toast = useToast();

  const [keyword, setKeyword] = useState('');
  const [scenario, setScenario] = useState('');
  const [style, setStyle] = useState<StyleId>('sincere');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      toast.warning(tErr('missingField'));
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/love-column/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), scenario: scenario.trim(), style }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) toast.error(tErr('auth'));
        else if (res.status === 402) toast.error(tErr('balance'));
        else toast.error(tErr('server'), data?.message);
        return;
      }
      setResult(data.text);
      onCreditsChanged();
    } catch (err: any) {
      toast.error(tErr('server'), err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `520-copy-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Form */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h2 className="text-xl font-bold mb-1">{t('title')}</h2>
          <p className="text-sm text-slate-500">{t('description')}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">{t('keywordLabel')}</label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t('keywordPlaceholder')}
              maxLength={120}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{t('scenarioLabel')}</label>
            <Input
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder={t('scenarioPlaceholder')}
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t('styleLabel')}</label>
            <div className="grid grid-cols-5 gap-2">
              {STYLE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStyle(id)}
                  className={cn(
                    'rounded-xl border px-2 py-2 text-xs font-medium transition',
                    style === id
                      ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-rose-300'
                  )}
                >
                  {t(`styles.${id}`)}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tc('generating')}
              </span>
            ) : (
              tc('generate')
            )}
          </Button>
          <p className="text-xs text-slate-500 text-center">
            {tc('cost', { n: cost })}
            {balance !== null && (
              <span className="ml-2 text-rose-500">{tc('balanceLeft', { n: balance })}</span>
            )}
          </p>
        </div>
      </div>

      {/* Result */}
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-rose-100 dark:border-rose-500/20 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-500/5 dark:to-pink-500/5 p-5 min-h-[260px] relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-300">
              {tc('result')}
            </span>
            {result && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  title={copied ? tc('copied') : tc('copy')}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  title={tc('downloadTxt')}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {tc('generating')}
            </div>
          ) : result ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-200">
              {result}
            </p>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              💌
            </div>
          )}
        </div>

        {result && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">{t('musicHint')}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendToMusic(keyword, result)}
              className="gap-2 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <MusicIcon className="h-4 w-4" /> {t('musicCta')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
