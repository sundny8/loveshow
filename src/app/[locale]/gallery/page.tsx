'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Download, ZoomIn, Loader2, ImageIcon, Calendar, Tag, LayoutGrid, Play, Pause, Music, Heart, FileText, Sparkles, BookHeart, Smile, Copy, Check, Share2 } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { PHOTO_SPECS } from '@/lib/photo/specs';
import { PORTRAIT_STYLES } from '@/lib/photo/portrait-styles';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from '@/lib/auth-client';
import { ImageModal } from '@/components/ui/image-modal';
import { renderMemoirToHtml } from '@/lib/love-column/memoir-render';

/** 通过 fetch 下载图片（解决跨域资源无法直接 download 的问题） */
async function downloadImage(url: string, filename = 'photo.jpg') {
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
  } catch {
    window.open(url, '_blank');
  }
}

interface ImageRow {
  id: string;
  taskId: string;
  url: string;
  createdAt: string | number | Date;
}

interface TaskRow {
  id: string;
  specId: string | null;
  status: string;
  createdAt: string | number | Date;
}

interface MusicTask {
  id: string;
  userId?: string;
  status: string;
  prompt: string;
  style: string | null;
  title: string | null;
  instrumental: boolean;
  model: string;
  customMode: boolean;
  lyrics: string | null;
  resultData: any;
  tosAudioUrls: string[] | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface LoveColumnItem {
  id: string;
  type: 'copy' | 'couple-photo' | 'couple-avatar' | 'analysis' | 'memoir' | 'music';
  userId: string;
  userName: string;
  creditsUsed: number;
  createdAt: string;
  imageUrls: string[];
  input: Record<string, any>;
  output: Record<string, any>;
}

type TimeRange = 'all' | 'today' | 'week' | 'month';
type TabId = 'idPhoto' | 'portrait' | 'music' | 'loveColumn';

const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'today', label: 'today' },
  { value: 'week', label: 'week' },
  { value: 'month', label: 'month' },
];

function isInRange(date: Date, range: TimeRange): boolean {
  if (range === 'all') return true;
  const now = new Date();
  if (range === 'today') {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }
  if (range === 'week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return date >= startOfWeek;
  }
  if (range === 'month') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  return true;
}

const LOVE_COLUMN_TYPE_META: Record<LoveColumnItem['type'], { icon: any; color: string }> = {
  copy: { icon: FileText, color: 'rose' },
  'couple-photo': { icon: ImageIcon, color: 'pink' },
  'couple-avatar': { icon: Smile, color: 'fuchsia' },
  analysis: { icon: Sparkles, color: 'purple' },
  memoir: { icon: BookHeart, color: 'rose' },
  music: { icon: Music, color: 'pink' },
};

export default function GalleryPage() {
  const t = useTranslations('gallery');
  const tSpecs = useTranslations('photoSpecs');
  const locale = useLocale();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [images, setImages] = useState<ImageRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [musicTasks, setMusicTasks] = useState<MusicTask[]>([]);
  const [portraitTasks, setPortraitTasks] = useState<any[]>([]);
  const [loveItems, setLoveItems] = useState<LoveColumnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [specFilter, setSpecFilter] = useState<string>('all');
  const [preview, setPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('loveColumn');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/signin?callbackUrl=/gallery');
    }
  }, [isPending, session, router]);

  const sessionUserId = session?.user?.id;

  // Build query string for admin user filter
  const buildUserQuery = (): string => {
    if (!isAdmin) return '';
    if (userFilter === 'all') return 'userId=all';
    return `userId=${encodeURIComponent(userFilter)}`;
  };

  // Fetch ID photo tasks (current user only — workspace is per-user)
  useEffect(() => {
    if (!sessionUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/photo/tasks', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setImages(data.images ?? []);
        setTasks(data.tasks ?? []);
      } catch (e) {
        console.error('[gallery] fetch photos failed:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  // Fetch music tasks (admin can filter by user)
  useEffect(() => {
    if (!sessionUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const qs = buildUserQuery();
        const res = await fetch(`/api/music/history${qs ? '?' + qs : ''}`, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setMusicTasks(data.tasks ?? []);
        if (data.isAdmin) setIsAdmin(true);
      } catch (e) {
        console.error('[gallery] fetch music failed:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId, userFilter, isAdmin]);

  // Fetch portrait tasks (admin can filter by user)
  useEffect(() => {
    if (!sessionUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const qs = buildUserQuery();
        const res = await fetch(`/api/tasks/history${qs ? '?' + qs : ''}`, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.isAdmin) setIsAdmin(true);
        const portraitItems = (data.history ?? []).filter((it: any) => it.platform === 'portrait');
        setPortraitTasks(portraitItems);
      } catch (e) {
        console.error('[gallery] fetch portrait failed:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId, userFilter, isAdmin]);

  // Fetch 520 column records (admin can filter by user)
  useEffect(() => {
    if (!sessionUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const qs = buildUserQuery();
        const res = await fetch(`/api/love-column/history${qs ? '?' + qs : ''}`, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setLoveItems(data.items ?? []);
        if (data.isAdmin) setIsAdmin(true);
      } catch (e) {
        console.error('[gallery] fetch love-column failed:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId, userFilter, isAdmin]);

  // Fetch admin user list
  useEffect(() => {
    if (!sessionUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/gallery/users', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setAvailableUsers(data.users ?? []);
        setIsAdmin(true);
      } catch {
        // Not admin, ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  // Filter music tasks (only SUCCESS status with sunoData)
  const filteredMusicTasks = useMemo(() => {
    return musicTasks
      .filter((task) => task.status === 'SUCCESS' && task.resultData?.sunoData)
      .map((task) => ({ ...task, sunoData: task.resultData.sunoData[0] }));
  }, [musicTasks]);

  // Filter love-column items by time range
  const filteredLoveItems = useMemo(() => {
    return loveItems.filter((item) => {
      const date = new Date(item.createdAt);
      return isInRange(date, timeRange);
    });
  }, [loveItems, timeRange]);

  // Audio playback
  const handlePlayAudio = (task: any) => {
    const el = audioRef.current;
    if (!el) return;
    const audioUrl = task.tosAudioUrls?.[0] || task.sunoData?.streamAudioUrl || task.sunoData?.audioUrl;
    if (!audioUrl) return;
    if (playingAudioId === task.id && !el.paused) {
      el.pause();
      setPlayingAudioId(null);
      return;
    }
    el.src = audioUrl;
    setPlayingAudioId(task.id);
    el.play().catch(() => setPlayingAudioId(null));
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date
      .toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .replace(/\//g, '-');
  };

  const downloadAudio = async (url: string, filename: string) => {
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
    } catch {
      window.open(url, '_blank');
    }
  };

  function specLabel(specId: string | null | undefined) {
    if (!specId) return t('general');
    // Use the localized spec label; fall back to the raw id for unknown specs.
    const spec = PHOTO_SPECS.find((s) => s.id === specId);
    return spec ? tSpecs(`${spec.id}.label`) : specId;
  }

  const usedSpecIds = useMemo(() => {
    const ids = new Set<string>();
    images.forEach((img) => {
      const specId = taskMap.get(img.taskId)?.specId;
      if (specId) ids.add(specId);
    });
    return Array.from(ids);
  }, [images, taskMap]);

  const filtered = useMemo(() => {
    return images.filter((img) => {
      const task = taskMap.get(img.taskId);
      const date = new Date(img.createdAt);
      if (!isInRange(date, timeRange)) return false;
      if (specFilter !== 'all' && task?.specId !== specFilter) return false;
      return true;
    });
  }, [images, taskMap, timeRange, specFilter]);

  // Total stats: depends on active tab
  const totalCount = useMemo(() => {
    if (activeTab === 'loveColumn') return loveItems.length;
    if (activeTab === 'music') return filteredMusicTasks.length;
    if (activeTab === 'portrait') return portraitTasks.length;
    return images.length;
  }, [activeTab, loveItems.length, filteredMusicTasks.length, portraitTasks.length, images.length]);

  const filteredCount = useMemo(() => {
    if (activeTab === 'loveColumn') return filteredLoveItems.length;
    if (activeTab === 'music') return filteredMusicTasks.length;
    if (activeTab === 'portrait') return portraitTasks.length;
    return filtered.length;
  }, [activeTab, filteredLoveItems.length, filteredMusicTasks.length, portraitTasks.length, filtered.length]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {t('stats', { total: totalCount, filtered: filteredCount })}
          </p>
        </div>
        <Link href="/">
          <Button className="btn-gradient text-white border-0">{t('backToHome')}</Button>
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 w-fit">
          {([
            { id: 'loveColumn' as const, label: t('loveColumn.tab') },
            { id: 'idPhoto' as const, label: t('tabs.idPhoto') },
            { id: 'portrait' as const, label: t('tabs.portrait') },
            { id: 'music' as const, label: t('tabs.music') },
          ]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                activeTab === id
                  ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Admin user filter */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('filters.byUser')}</span>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">{t('filters.allUsers')}</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Time filter (shared by tabs that support it) */}
      {(activeTab === 'idPhoto' || activeTab === 'loveColumn') && (
        <div className="flex flex-wrap gap-4 mb-8 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 mr-1">{t('filters.time')}</span>
            <div className="flex gap-1">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeRange(opt.value as TimeRange)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                    timeRange === opt.value
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-violet-300 hover:text-violet-600'
                  )}
                >
                  {t(`filters.timeOptions.${opt.value}`)}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'idPhoto' && usedSpecIds.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 mr-1">{t('filters.category')}</span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSpecFilter('all')}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                    specFilter === 'all'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-violet-300 hover:text-violet-600'
                  )}
                >
                  {t('filters.allSpecs')}
                </button>
                {usedSpecIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => setSpecFilter(id)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                      specFilter === id
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-violet-300 hover:text-violet-600'
                    )}
                  >
                    {specLabel(id)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === 520 Column Tab === */}
      {activeTab === 'loveColumn' && (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
              <p className="text-slate-500">{t('loading')}</p>
            </div>
          ) : filteredLoveItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLoveItems.map((item) => {
                const meta = LOVE_COLUMN_TYPE_META[item.type];
                const typeLabel = t(`loveColumn.types.${item.type}`);
                const Icon = meta.icon;
                const expanded = expandedItem === item.id;
                const firstImage = item.imageUrls?.[0] || (item.output?.imageUrl as string) || (item.output?.photos as string[])?.[0];
                const text =
                  (item.output?.text as string) ||
                  (item.output?.report as string) ||
                  (item.output?.memoir as string) ||
                  '';

                const handleCopyText = async () => {
                  if (!text) return;
                  try {
                    await navigator.clipboard.writeText(text);
                    setCopiedItemId(item.id);
                    setTimeout(() => setCopiedItemId(null), 1500);
                  } catch (e) {
                    console.error('copy failed:', e);
                  }
                };

                const handleDownloadText = () => {
                  if (!text) return;
                  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `520-copy-${item.id.slice(0, 8)}-${Date.now()}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                };

                return (
                  <div
                    key={item.id}
                    className="surface-card overflow-hidden p-0 flex flex-col"
                  >
                    {/* Header */}
                    <div className={cn(
                      'px-4 py-3 flex items-center justify-between gap-2 border-b',
                      `bg-${meta.color}-50 border-${meta.color}-100 dark:bg-${meta.color}-900/10 dark:border-${meta.color}-500/20`
                    )}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`h-4 w-4 text-${meta.color}-500 flex-shrink-0`} />
                        <span className="text-sm font-semibold truncate">{typeLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.type === 'copy' && text && (
                          <>
                            <button
                              type="button"
                              onClick={handleCopyText}
                              title={copiedItemId === item.id ? t('loveColumn.copied') : t('loveColumn.copyText')}
                              className={cn(
                                'p-1.5 rounded-md transition-colors',
                                copiedItemId === item.id
                                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                                  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                              )}
                            >
                              {copiedItemId === item.id ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={handleDownloadText}
                              title={t('loveColumn.downloadTxt')}
                              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {item.type === 'memoir' && text && (
                          <>
                            <button
                              type="button"
                              onClick={handleCopyText}
                              title={copiedItemId === item.id ? t('loveColumn.copied') : t('loveColumn.copyFull')}
                              className={cn(
                                'p-1.5 rounded-md transition-colors',
                                copiedItemId === item.id
                                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                                  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                              )}
                            >
                              {copiedItemId === item.id ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const url = `${window.location.origin}/m/${item.id}`;
                                try {
                                  await navigator.clipboard.writeText(url);
                                  setCopiedItemId(item.id);
                                  setTimeout(() => setCopiedItemId(null), 1500);
                                } catch {
                                  window.prompt(t('loveColumn.sharePrompt'), url);
                                }
                              }}
                              title={t('loveColumn.copyShareLink')}
                              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                            <a
                              href={`/m/${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={t('loveColumn.openSharePage')}
                              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                            >
                              <BookHeart className="h-3.5 w-3.5" />
                            </a>
                          </>
                        )}
                        <span className="text-[11px] text-slate-500">{formatDate(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-4 space-y-3">
                      {firstImage && (
                        <div className="relative group rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={firstImage}
                            alt={typeLabel}
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreview(firstImage)}
                              className="h-9 w-9 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow"
                              title={t('preview')}
                            >
                              <ZoomIn className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadImage(firstImage, `${item.type}_${item.id}.jpg`)}
                              className="h-9 w-9 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow"
                              title={t('download')}
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {text && item.type === 'memoir' ? (
                        <div
                          className={cn(
                            'gallery-memoir text-sm leading-relaxed text-slate-700 dark:text-slate-200',
                            !expanded && 'max-h-64 overflow-hidden relative'
                          )}
                          dangerouslySetInnerHTML={{ __html: renderMemoirToHtml(text) }}
                        />
                      ) : text ? (
                        <div className={cn(
                          'text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed',
                          !expanded && 'line-clamp-4'
                        )}>
                          {text}
                        </div>
                      ) : null}

                      {!firstImage && !text && (
                        <p className="text-xs text-slate-400 italic">
                          {t('loveColumn.legacyNotPersisted')}
                        </p>
                      )}

                      {text && text.length > 200 && (
                        <button
                          onClick={() => setExpandedItem(expanded ? null : item.id)}
                          className="text-xs font-medium text-rose-600 hover:underline"
                        >
                          {expanded ? t('loveColumn.collapse') : t('loveColumn.expand')}
                        </button>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-rose-500" />
                        {t('loveColumn.creditsUsed', { count: item.creditsUsed })}
                      </span>
                      {isAdmin && (
                        <span className="truncate ml-2">{t('loveColumn.userLabel', { name: item.userName })}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-900/20">
                <Heart className="h-10 w-10 text-rose-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold">{t('loveColumn.emptyTitle')}</p>
                <p className="text-sm text-slate-500 mt-1">{t('loveColumn.emptyDesc')}</p>
              </div>
              <Link href="/love-column">
                <Button className="btn-gradient text-white border-0 mt-2">{t('loveColumn.goToColumn')}</Button>
              </Link>
            </div>
          )}
        </>
      )}

      {/* === Music Tab === */}
      {activeTab === 'music' && (
        <>
          <audio
            ref={audioRef}
            onEnded={() => setPlayingAudioId(null)}
            onPause={() => setPlayingAudioId(null)}
            className="hidden"
          />
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
              <p className="text-slate-500">{t('loading')}</p>
            </div>
          ) : filteredMusicTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredMusicTasks.map((task) => {
                const audioUrl = task.tosAudioUrls?.[0] || task.sunoData?.streamAudioUrl || task.sunoData?.audioUrl;
                const imageUrl = task.sunoData?.imageUrl;
                const title = task.title || task.sunoData?.title || t('music.untitled');
                const duration = task.sunoData?.duration || 0;

                return (
                  <div key={task.id} className="surface-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="relative group shrink-0">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt={title} className="w-20 h-20 rounded-lg object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center">
                          <Music className="h-8 w-8 text-emerald-400" />
                        </div>
                      )}
                      {audioUrl && (
                        <button
                          onClick={() => handlePlayAudio(task)}
                          className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {playingAudioId === task.id ? (
                            <Pause className="h-8 w-8 text-white" />
                          ) : (
                            <Play className="h-8 w-8 text-white" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base truncate mb-1">{title}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(task.createdAt)}
                        </span>
                        <span>{formatDuration(duration)}</span>
                      </div>
                    </div>
                    {audioUrl && (
                      <button
                        onClick={() => downloadAudio(audioUrl, `${title}.mp3`)}
                        className="shrink-0 px-4 py-2 rounded-lg bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/30 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <Download className="h-4 w-4" />
                        {t('music.downloadShort')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                <Music className="h-10 w-10 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold">{t('empty.title')}</p>
                <p className="text-sm text-slate-500 mt-1">{t('music.emptyDesc')}</p>
              </div>
              <Link href="/music">
                <Button className="btn-gradient text-white border-0 mt-2">{t('music.goToStudio')}</Button>
              </Link>
            </div>
          )}
        </>
      )}

      {/* === Portrait Tab === */}
      {activeTab === 'portrait' && (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
              <p className="text-slate-500">{t('loading')}</p>
            </div>
          ) : portraitTasks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {portraitTasks.map((task) => {
                const styleId = task.promptPayload?.styleId;
                const style = PORTRAIT_STYLES.find((s) => s.id === styleId);
                const styleName =
                  (locale === 'zh' ? style?.name : style?.nameEn) || t('tabs.portrait');
                const dateStr = new Date(task.createdAt).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div key={task.id} className="group surface-card overflow-hidden p-0">
                    <div className="aspect-[3/4] relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={task.imageUrl}
                        alt={styleName}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title={t('preview')}
                          onClick={() => setPreview(task.imageUrl)}
                          className="h-10 w-10 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title={t('download')}
                          onClick={() => downloadImage(task.imageUrl, `portrait_${task.id}.jpg`)}
                          className="h-10 w-10 rounded-full bg-white/90 text-violet-700 flex items-center justify-center shadow"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <span className="chip bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200 dark:border-orange-800 text-[11px] px-2 py-0.5">
                        {styleName}
                      </span>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateStr}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                <LayoutGrid className="h-10 w-10 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold">{t('empty.title')}</p>
                <p className="text-sm text-slate-500 mt-1">{t('portrait.emptyDesc')}</p>
              </div>
              <Link href="/portrait">
                <Button className="btn-gradient text-white border-0 mt-2">{t('portrait.goToStudio')}</Button>
              </Link>
            </div>
          )}
        </>
      )}

      {/* === ID Photo Tab === */}
      {activeTab === 'idPhoto' && (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
              <p className="text-slate-500">{t('loading')}</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((img) => {
                const task = taskMap.get(img.taskId);
                const date = new Date(img.createdAt);
                return (
                  <div key={img.id} className="group surface-card overflow-hidden p-0">
                    <div className="aspect-[3/4] relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={specLabel(task?.specId)}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title={t('preview')}
                          onClick={() => setPreview(img.url)}
                          className="h-10 w-10 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title={t('download')}
                          onClick={() => downloadImage(img.url, `photo_${img.id}.jpg`)}
                          className="h-10 w-10 rounded-full bg-white/90 text-violet-700 flex items-center justify-center shadow"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <span className="chip bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 border-violet-200 dark:border-violet-800 text-[11px] px-2 py-0.5">
                        {specLabel(task?.specId)}
                      </span>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {date.toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                <LayoutGrid className="h-10 w-10 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold">{t('empty.title')}</p>
                <p className="text-sm text-slate-500 mt-1">{t('empty.description')}</p>
              </div>
              <Link href="/workspace">
                <Button className="btn-gradient text-white border-0 mt-2">{t('empty.goToWorkspace')}</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                <ImageIcon className="h-10 w-10 text-slate-400" />
              </div>
              <p className="font-semibold">{t('noResults.title')}</p>
              <p className="text-sm text-slate-500">{t('noResults.description')}</p>
              <button
                onClick={() => {
                  setTimeRange('all');
                  setSpecFilter('all');
                }}
                className="text-sm text-violet-600 hover:underline font-medium"
              >
                {t('noResults.clearFilters')}
              </button>
            </div>
          )}
        </>
      )}

      <ImageModal src={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
