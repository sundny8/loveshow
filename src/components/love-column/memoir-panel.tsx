'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, BookHeart, Copy, Check, Share2 } from 'lucide-react';
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

/** Renderer that supports H1/H2/H3, blockquote, list, image lines, paragraphs. */
function MemoirRenderer({ text }: { text: string }) {
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
    const imgMatch = line.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushPara();
      blocks.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`img-${blocks.length}`}
          src={imgMatch[1]}
          alt="memoir"
          className="my-4 mx-auto max-h-[420px] rounded-2xl shadow-md object-cover"
        />
      );
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
        <h1 key={`h1-${blocks.length}`} className="text-2xl font-extrabold mt-6 mb-3 text-center text-rose-600 dark:text-rose-300">
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

export function MemoirPanel({ cost, balance, onCreditsChanged }: Props) {
  const t = useTranslations('column520.memoir');
  const tc = useTranslations('column520.common');
  const tErr = useTranslations('column520.common.errors');
  const toast = useToast();

  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [timeline, setTimeline] = useState('');
  const [chat, setChat] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [memoir, setMemoir] = useState('');
  const [recordId, setRecordId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!files.length) {
      toast.warning(tErr('missingFile'));
      return;
    }
    if (!timeline.trim() || !chat.trim()) {
      toast.warning(tErr('missingField'));
      return;
    }
    setLoading(true);
    setMemoir('');
    setRecordId(null);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      fd.append('timeline', timeline.trim());
      fd.append('chat', chat.trim());
      if (title.trim()) fd.append('title', title.trim());
      if (note.trim()) fd.append('note', note.trim());

      const res = await fetch('/api/love-column/memoir', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) toast.error(tErr('auth'));
        else if (res.status === 402) toast.error(tErr('balance'));
        else toast.error(tErr('server'), data?.message);
        return;
      }
      setMemoir(data.memoir);
      setRecordId(data.recordId || null);
      onCreditsChanged();
    } catch (err: any) {
      toast.error(tErr('server'), err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!memoir) return;
    try {
      await navigator.clipboard.writeText(memoir);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('copy failed:', e);
    }
  };

  const handleShare = async () => {
    if (!recordId) return;
    const url = `${window.location.origin}/m/${recordId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(tc('shareCopied'), url);
    } catch {
      // 无法访问剪贴板时降级提示
      window.prompt(tc('shareCopyManual'), url);
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
          <label className="text-sm font-medium mb-1 block">{t('titleLabel')}</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            maxLength={60}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">{t('photosLabel')}</label>
          <p className="text-xs text-slate-500 mb-2">{tc('uploadMulti', { n: 6 })}</p>
          <DropzoneUploader multiple maxFiles={6} onChange={setFiles} />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">{t('timelineLabel')}</label>
          <Textarea
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            placeholder={t('timelinePlaceholder')}
            rows={4}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">{t('chatLabel')}</label>
          <Textarea
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            placeholder={t('chatPlaceholder')}
            rows={4}
            maxLength={2000}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">{t('noteLabel')}</label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
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
        <div className="rounded-2xl border border-rose-100 dark:border-rose-500/20 bg-white dark:bg-slate-900 p-6 min-h-[500px]">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-300">
              <BookHeart className="h-3 w-3" /> {tc('result')}
            </span>
            {memoir && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  title={copied ? tc('copied') : tc('copy')}
                  className={`p-1.5 rounded-md transition-colors ${
                    copied
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                  }`}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                {recordId && (
                  <button
                    type="button"
                    onClick={handleShare}
                    title={tc('share')}
                    className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-72 text-slate-500 text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {tc('generating')}
            </div>
          ) : memoir ? (
            <MemoirRenderer text={memoir} />
          ) : (
            <div className="flex items-center justify-center h-72 text-slate-400 text-sm">
              📖
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
