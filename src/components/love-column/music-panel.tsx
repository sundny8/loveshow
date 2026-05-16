'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Music as MusicIcon, Sparkles, Play, Pause, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

interface Props {
  cost: number;
  balance?: number | null;
  initialPrompt?: string;
  initialLyrics?: string;
  onCreditsChanged: () => void;
}

interface SunoAudioItem {
  id: string;
  audioUrl: string;
  streamAudioUrl: string;
  imageUrl: string;
  prompt: string;
  modelName: string;
  title: string;
  tags: string;
  duration: number;
}

export function MusicPanel({ cost, balance, initialPrompt, initialLyrics, onCreditsChanged }: Props) {
  const t = useTranslations('column520.music');
  const tc = useTranslations('column520.common');
  const tErr = useTranslations('column520.common.errors');
  const toast = useToast();

  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [lyrics, setLyrics] = useState(initialLyrics || '');
  const [instrumental, setInstrumental] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedTaskId, setSubmittedTaskId] = useState<string>('');

  // Player state
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<SunoAudioItem[] | null>(null);
  const [tosUrls, setTosUrls] = useState<string[] | null>(null);
  const [timestampedLyrics, setTimestampedLyrics] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentLineIdx, setCurrentLineIdx] = useState(-1);
  const [hoveringCover, setHoveringCover] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lyricsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (initialLyrics) setLyrics(initialLyrics);
  }, [initialLyrics]);

  // Poll task status
  useEffect(() => {
    if (!submittedTaskId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/music/task?taskId=${submittedTaskId}`);
        const data = await res.json();
        const task = data.task;
        if (!task) return;

        setTaskStatus(task.status);

        if (task.status === 'SUCCESS' && task.resultData?.sunoData) {
          setAudioData(task.resultData.sunoData);
          setTosUrls(task.tosAudioUrls || null);
          setTimestampedLyrics(task.resultData.timestampedLyrics || null);
          setLoading(false);
          onCreditsChanged();
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } else if (task.status === 'FAILED') {
          toast.error(tErr('server'), task.errorMessage || '');
          setLoading(false);
          onCreditsChanged();
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch (e) {
        console.error('poll error', e);
      }
    };

    poll();
    pollRef.current = setInterval(poll, 10_000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [submittedTaskId]);

  // Parse timestamped lyrics into lines
  const lyricLines = useMemo(() => {
    if (!timestampedLyrics?.alignedWords?.length) return null;
    const words = timestampedLyrics.alignedWords;
    const lines: { text: string; startS: number; endS: number }[] = [];
    let current = '';
    let lineStart = 0;
    for (const w of words) {
      const raw = w.word;
      const newlineIdx = raw.indexOf('\n');
      if (newlineIdx === -1) {
        if (!current) lineStart = w.startS;
        current += raw;
      } else {
        const beforeBreak = raw.slice(0, newlineIdx);
        const afterBreak = raw.slice(newlineIdx + 1);
        if (!current) lineStart = w.startS;
        current += beforeBreak;
        lines.push({ text: current.trim(), startS: lineStart, endS: w.startS });
        current = afterBreak;
        lineStart = w.startS;
      }
    }
    if (current.trim()) {
      lines.push({ text: current.trim(), startS: lineStart, endS: words[words.length - 1]?.endS || 0 });
    }
    const filtered = lines.filter(l => !l.text.trim().startsWith('['));
    return filtered.length > 0 ? filtered : null;
  }, [timestampedLyrics]);

  // Fallback plain lyrics
  const plainLyrics = useMemo(() => {
    if (!audioData || audioData.length === 0 || instrumental) return null;
    const raw = audioData[0].prompt || null;
    if (!raw) return null;
    return raw.split('\n').filter(l => !l.trim().startsWith('[')).join('\n').trim() || null;
  }, [audioData, instrumental]);

  // RAF loop for progress + lyrics sync while playing.
  useEffect(() => {
    if (!isPlaying) return;
    const audio = audioRef.current;
    if (!audio) return;

    let raf = 0;
    let prevActive = -1;
    const sync = () => {
      const t = audio.currentTime;
      const dur = audio.duration || 0;
      setCurrentTime(t);
      setAudioDuration(dur);

      if (lyricLines && lyricLines.length > 0) {
        let active = -1;
        for (let i = lyricLines.length - 1; i >= 0; i--) {
          if (t >= lyricLines[i].startS) { active = i; break; }
        }
        if (active !== prevActive) {
          prevActive = active;
          setCurrentLineIdx(active);
          const container = lyricsRef.current;
          if (container && active >= 0) {
            const lineEl = container.children[active] as HTMLElement | undefined;
            if (lineEl) {
              const containerRect = container.getBoundingClientRect();
              const lineRect = lineEl.getBoundingClientRect();
              const offset = lineRect.top - containerRect.top + container.scrollTop;
              container.scrollTo({ top: Math.max(0, offset - 4), behavior: 'smooth' });
            }
          }
        }
      }
      raf = requestAnimationFrame(sync);
    };
    raf = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, lyricLines]);

  const getBestAudioUrl = (audio: SunoAudioItem, index: number) => {
    if (tosUrls && tosUrls[index]) return tosUrls[index];
    return audio.streamAudioUrl || audio.audioUrl;
  };

  const handlePlayPause = () => {
    if (!audioData || audioData.length === 0) return;
    const el = audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      return;
    }

    const first = audioData[0];
    if (!el.src || el.src === '') {
      el.src = getBestAudioUrl(first, 0);
    }
    el.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Sync the active lyric line to currentTime (works whether playing or paused).
  const syncLyricLineTo = (t: number) => {
    if (!lyricLines || lyricLines.length === 0) return;
    let active = -1;
    for (let i = lyricLines.length - 1; i >= 0; i--) {
      if (t >= lyricLines[i].startS) { active = i; break; }
    }
    setCurrentLineIdx(active);
    const container = lyricsRef.current;
    if (container && active >= 0) {
      const lineEl = container.children[active] as HTMLElement | undefined;
      if (lineEl) {
        const containerRect = container.getBoundingClientRect();
        const lineRect = lineEl.getBoundingClientRect();
        const offset = lineRect.top - containerRect.top + container.scrollTop;
        container.scrollTo({ top: Math.max(0, offset - 4), behavior: 'smooth' });
      }
    }
  };

  // Seek by ratio (0..1). Also keeps lyrics + state in sync.
  const seekTo = (ratio: number) => {
    const el = audioRef.current;
    if (!el || !audioDuration) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    const newTime = clamped * audioDuration;
    el.currentTime = newTime;
    setCurrentTime(newTime);
    syncLyricLineTo(newTime);
  };

  // Force a fresh download via blob, so cross-origin TOS URLs are saved as files
  // instead of being opened/played by the browser.
  const handleDownload = async () => {
    if (!audioData || audioData.length === 0) return;
    const first = audioData[0];
    const url = getBestAudioUrl(first, 0);
    if (!url) return;
    const filename = `${(first.title || 'song').replace(/[\\/:*?"<>|]/g, '_')}.mp3`;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error('[music-panel] download failed, falling back to new tab:', err);
      window.open(url, '_blank');
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.warning(tErr('missingField'));
      return;
    }
    setLoading(true);
    setSubmittedTaskId('');
    setAudioData(null);
    setTosUrls(null);
    setTimestampedLyrics(null);
    setTaskStatus(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    setCurrentLineIdx(-1);
    try {
      const body: any = {
        prompt: prompt.trim(),
        instrumental,
        model: 'V4_5ALL',
        customMode: !!lyrics.trim(),
      };
      if (lyrics.trim()) body.prompt = lyrics.trim();
      const res = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) toast.error(tErr('auth'));
        else if (res.status === 402) toast.error(tErr('balance'));
        else toast.error(tErr('server'), data?.error || data?.message);
        setLoading(false);
        return;
      }
      setSubmittedTaskId(data.taskId);
      onCreditsChanged();
      toast.success(t('running'));
    } catch (err: any) {
      toast.error(tErr('server'), err?.message);
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

        {initialPrompt && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-300 inline-flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>{t('fromCopyHint')}</span>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-1 block">{t('promptLabel')}</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('promptPlaceholder')}
            rows={4}
            maxLength={500}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">{t('lyricsLabel')}</label>
          <Textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder={t('lyricsPlaceholder')}
            rows={5}
            maxLength={2000}
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={instrumental}
            onChange={(e) => setInstrumental(e.target.checked)}
            className="h-4 w-4 accent-rose-500"
          />
          {t('instrumentalLabel')}
        </label>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {tc('generating')}
            </span>
          ) : (
            t('submit')
          )}
        </Button>
        <p className="text-xs text-slate-500 text-center">
          {tc('cost', { n: cost })}
          {balance !== null && balance !== undefined && (
            <span className="ml-2 text-rose-500">{tc('balanceLeft', { n: balance })}</span>
          )}
        </p>
      </div>

      {/* Result / Player */}
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-rose-100 dark:border-rose-500/20 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-500/5 dark:to-pink-500/5 p-5 min-h-[420px] flex flex-col">
          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
            onLoadedMetadata={(e) => setAudioDuration((e.target as HTMLAudioElement).duration || 0)}
            onTimeUpdate={(e) => {
              // Keep currentTime + lyric line in sync even when paused (e.g. after seek).
              if (isPlaying) return; // RAF loop handles play state
              const t = (e.target as HTMLAudioElement).currentTime;
              setCurrentTime(t);
              syncLyricLineTo(t);
            }}
            onSeeked={(e) => {
              const t = (e.target as HTMLAudioElement).currentTime;
              setCurrentTime(t);
              syncLyricLineTo(t);
            }}
            className="hidden"
          />

          {loading || (submittedTaskId && !audioData && taskStatus !== 'FAILED') ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
              <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
              <span>{taskStatus === 'GENERATING' ? t('generating') : tc('generating')}</span>
              <span className="text-xs text-slate-400">{t('waitHint')}</span>
            </div>
          ) : audioData && audioData.length > 0 ? (
            (() => {
              const first = audioData[0];
              return (
                <div className="flex flex-col h-full">
                  {/* Cover + Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="relative shrink-0 cursor-pointer"
                      onMouseEnter={() => setHoveringCover(true)}
                      onMouseLeave={() => setHoveringCover(false)}
                      onClick={handlePlayPause}
                    >
                      {first.imageUrl ? (
                        <img
                          src={first.imageUrl}
                          alt={first.title}
                          className="w-28 h-28 rounded-xl object-cover shadow-md"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-rose-200 to-pink-200 dark:from-rose-900/40 dark:to-pink-900/40 flex items-center justify-center shadow-md">
                          <MusicIcon className="h-10 w-10 text-rose-400" />
                        </div>
                      )}
                      {/* Play/Pause overlay on hover */}
                      <div className={`absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 transition-opacity duration-200 ${hoveringCover || isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                        {isPlaying ? (
                          <Pause className="h-10 w-10 text-white drop-shadow-lg" />
                        ) : (
                          <Play className="h-10 w-10 text-white drop-shadow-lg" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-bold text-lg truncate text-slate-800 dark:text-slate-100">
                        {first.title || t('untitled')}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {first.modelName} · {formatDuration(first.duration)}
                      </p>
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 mt-2"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {tc('download')}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {audioDuration > 0 && (() => {
                    const pct = (currentTime / audioDuration) * 100;

                    const seekFromEvent = (clientX: number, bar: HTMLElement) => {
                      const rect = bar.getBoundingClientRect();
                      const ratio = (clientX - rect.left) / rect.width;
                      seekTo(ratio);
                    };

                    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      const bar = e.currentTarget;
                      bar.setPointerCapture(e.pointerId);
                      seekFromEvent(e.clientX, bar);
                      const onMove = (ev: PointerEvent) => seekFromEvent(ev.clientX, bar);
                      const onUp = (ev: PointerEvent) => {
                        try { bar.releasePointerCapture(ev.pointerId); } catch { /* noop */ }
                        bar.removeEventListener('pointermove', onMove);
                        bar.removeEventListener('pointerup', onUp);
                        bar.removeEventListener('pointercancel', onUp);
                      };
                      bar.addEventListener('pointermove', onMove);
                      bar.addEventListener('pointerup', onUp);
                      bar.addEventListener('pointercancel', onUp);
                    };

                    return (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                          <span className="w-9 text-right tabular-nums">{formatDuration(currentTime)}</span>
                          <div
                            className="flex-1 py-2 cursor-pointer touch-none select-none group"
                            onPointerDown={onPointerDown}
                          >
                            <div className="relative h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                              <div
                                className="absolute inset-y-0 left-0 bg-rose-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                              <div
                                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-rose-500 rounded-full shadow-md border-2 border-white dark:border-slate-800 group-hover:w-4 group-hover:h-4 transition-[width,height] pointer-events-none"
                                style={{ left: `calc(${pct}% - 7px)` }}
                              />
                            </div>
                          </div>
                          <span className="w-9 tabular-nums">{formatDuration(audioDuration)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Lyrics */}
                  {!instrumental && (lyricLines || plainLyrics) && (
                    <div className="flex-1 min-h-0">
                      <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        {t('lyricsLabel')}
                        {lyricLines && isPlaying && (
                          <span className="inline-flex items-center gap-1 text-rose-500">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                            </span>
                            {t('syncing')}
                          </span>
                        )}
                      </p>
                      {lyricLines ? (
                        <div
                          ref={lyricsRef}
                          className="text-sm leading-loose max-h-48 overflow-y-auto bg-white/60 dark:bg-slate-900/40 rounded-lg p-3 scroll-smooth"
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          {lyricLines.map((line, i) => (
                            <p
                              key={i}
                              className={`py-1 px-2 rounded text-center transition-all duration-300 ${
                                isPlaying && i === currentLineIdx
                                  ? 'text-rose-600 dark:text-rose-400 font-semibold text-base scale-105'
                                  : i < currentLineIdx && isPlaying
                                    ? 'text-slate-400 dark:text-slate-500'
                                    : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {line.text || '\u00A0'}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-white/60 dark:bg-slate-900/40 rounded-lg p-3">
                          {plainLyrics}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
              <MusicIcon className="h-8 w-8" />
              🎵
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
