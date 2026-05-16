'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Heart, Copy, Check } from 'lucide-react';
import { DropzoneUploader } from '@/components/workspace/dropzone-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

interface Props {
  cost: number;
  balance?: number | null;
  onCreditsChanged: () => void;
}

/** Minimal markdown renderer for `# H1`, `## H2`, `### H3`, `> quote`, `- list`, paragraphs. */
function MiniMarkdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="mb-3 leading-relaxed text-slate-700 dark:text-slate-200">
          {para.join(' ')}
        </p>
      );
      para = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      continue;
    }
    if (line.startsWith('### ')) {
      flushPara();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="text-base font-semibold mt-4 mb-2 text-rose-600 dark:text-rose-300">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      flushPara();
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className="text-lg font-bold mt-5 mb-2 text-rose-600 dark:text-rose-300">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      flushPara();
      blocks.push(
        <h1 key={`h1-${blocks.length}`} className="text-xl font-extrabold mt-6 mb-3 text-rose-600 dark:text-rose-300">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('> ')) {
      flushPara();
      blocks.push(
        <blockquote
          key={`q-${blocks.length}`}
          className="border-l-4 border-rose-300 pl-3 py-1 my-3 italic text-slate-600 dark:text-slate-300 bg-rose-50/50 dark:bg-rose-500/10 rounded-r"
        >
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.startsWith('- ')) {
      flushPara();
      blocks.push(
        <li key={`li-${blocks.length}`} className="ml-5 list-disc text-slate-700 dark:text-slate-200">
          {line.slice(2)}
        </li>
      );
    } else {
      para.push(line);
    }
  }
  flushPara();
  return <div>{blocks}</div>;
}

export function AnalysisPanel({ cost, balance, onCreditsChanged }: Props) {
  const t = useTranslations('column520.analysis');
  const tc = useTranslations('column520.common');
  const tErr = useTranslations('column520.common.errors');
  const toast = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState('');
  const [metAt, setMetAt] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!file) {
      toast.warning(tErr('missingFile'));
      return;
    }
    if (!duration.trim() || !metAt.trim()) {
      toast.warning(tErr('missingField'));
      return;
    }
    setLoading(true);
    setReport('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('durationMonths', String(parseInt(duration, 10) || 0));
      fd.append('metAt', metAt.trim());
      if (note.trim()) fd.append('note', note.trim());

      const res = await fetch('/api/love-column/analysis', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) toast.error(tErr('auth'));
        else if (res.status === 402) toast.error(tErr('balance'));
        else toast.error(tErr('server'), data?.message);
        return;
      }
      setReport(data.report);
      onCreditsChanged();
    } catch (err: any) {
      toast.error(tErr('server'), err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Form */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h2 className="text-xl font-bold mb-1">{t('title')}</h2>
          <p className="text-sm text-slate-500">{t('description')}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-2">{tc('uploadHint')}</p>
          <DropzoneUploader multiple={false} maxFiles={1} onChange={(fs) => setFile(fs[0] || null)} />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">{t('durationLabel')}</label>
          <Input
            type="number"
            min={0}
            max={1200}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder={t('durationPlaceholder')}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">{t('metAtLabel')}</label>
          <Input
            value={metAt}
            onChange={(e) => setMetAt(e.target.value)}
            placeholder={t('metAtPlaceholder')}
            maxLength={120}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">{t('noteLabel')}</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
            maxLength={400}
            rows={3}
          />
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
          {balance !== null && balance !== undefined && (
            <span className="ml-2 text-rose-500">{tc('balanceLeft', { n: balance })}</span>
          )}
        </p>
      </div>

      {/* Result */}
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-rose-100 dark:border-rose-500/20 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-500/5 dark:to-pink-500/5 p-5 min-h-[460px]">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-300">
              <Heart className="h-3 w-3" /> {tc('result')}
            </span>
            {report && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600"
              >
                {copied ? <><Check className="h-3 w-3" /> {tc('copied')}</> : <><Copy className="h-3 w-3" /> {tc('copy')}</>}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-72 text-slate-500 text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {tc('generating')}
            </div>
          ) : report ? (
            <MiniMarkdown text={report} />
          ) : (
            <div className="flex items-center justify-center h-72 text-slate-400 text-sm">
              💞
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
