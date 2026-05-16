'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Download, ImageIcon } from 'lucide-react';
import { DropzoneUploader } from '@/components/workspace/dropzone-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface OptionItem {
  id: string;
  label: string;
}

interface Props {
  /** Section i18n namespace, e.g. 'column520.photo' or 'column520.avatar'. */
  ns: 'column520.photo' | 'column520.avatar';
  /** Backend endpoint, e.g. '/api/love-column/couple-photo'. */
  endpoint: string;
  /** Field name for the option select sent to the API ('scene' | 'style'). */
  optionField: 'scene' | 'style';
  /** Option list (id + translated label). */
  options: OptionItem[];
  cost: number;
  balance?: number | null;
  onCreditsChanged: () => void;
}

export function ImageGenPanel({
  ns,
  endpoint,
  optionField,
  options,
  cost,
  balance,
  onCreditsChanged,
}: Props) {
  const t = useTranslations(ns);
  const tc = useTranslations('column520.common');
  const tErr = useTranslations('column520.common.errors');
  const toast = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [option, setOption] = useState<string>(options[0]?.id || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>('');

  const handleGenerate = async () => {
    if (!file) {
      toast.warning(tErr('missingFile'));
      return;
    }
    if (!option) {
      toast.warning(tErr('missingField'));
      return;
    }
    setLoading(true);
    setResultUrl('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append(optionField, option);
      if (note.trim()) fd.append('note', note.trim());

      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) toast.error(tErr('auth'));
        else if (res.status === 402) toast.error(tErr('balance'));
        else toast.error(tErr('server'), data?.message);
        return;
      }
      setResultUrl(data.imageUrl);
      onCreditsChanged();
    } catch (err: any) {
      toast.error(tErr('server'), err?.message);
    } finally {
      setLoading(false);
    }
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
          <label className="text-sm font-medium mb-2 block">
            {optionField === 'scene' ? t('sceneLabel') : t('styleLabel')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setOption(opt.id)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-medium transition text-left',
                  option === opt.id
                    ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-rose-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">{t('noteLabel')}</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
            maxLength={200}
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
        <div className="rounded-2xl border border-rose-100 dark:border-rose-500/20 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-500/5 dark:to-pink-500/5 p-5 min-h-[420px] flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-500 text-sm">
              <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
              {tc('generating')}
            </div>
          ) : resultUrl ? (
            <div className="flex flex-col items-center gap-4 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultUrl}
                alt={t('title')}
                className="max-h-[480px] w-auto object-contain rounded-2xl shadow-lg"
              />
              <a
                href={resultUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700"
              >
                <Download className="h-4 w-4" /> {tc('download')}
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400 text-sm">
              <ImageIcon className="h-8 w-8" />
              <span>{tc('result')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
