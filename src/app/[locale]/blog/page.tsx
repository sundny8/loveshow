'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useSession } from '@/lib/auth-client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Heart, Sparkles, ImageIcon, BookHeart, Music as MusicIcon, Smile, FileText, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

import { CopyPanel } from '@/components/love-column/copy-panel';
import { ImageGenPanel } from '@/components/love-column/image-gen-panel';
import { AnalysisPanel } from '@/components/love-column/analysis-panel';
import { MemoirPanel } from '@/components/love-column/memoir-panel';
import { MusicPanel } from '@/components/love-column/music-panel';

import {
  COST_COPY,
  COST_PHOTO,
  COST_AVATAR,
  COST_ANALYSIS,
  COST_MEMOIR,
  COST_MUSIC,
} from '@/lib/love-column/costs';
import { PHOTO_SCENES } from '@/lib/love-column/prompts/photo';
import { AVATAR_STYLES } from '@/lib/love-column/prompts/avatar';

type TabId = 'copy' | 'photo' | 'avatar' | 'analysis' | 'music' | 'memoir';

const TAB_ORDER: TabId[] = ['copy', 'photo', 'avatar', 'analysis', 'music', 'memoir'];

const TAB_ICON: Record<TabId, React.ComponentType<{ className?: string }>> = {
  copy: FileText,
  photo: ImageIcon,
  avatar: Smile,
  analysis: Sparkles,
  music: MusicIcon,
  memoir: BookHeart,
};

export default function LoveColumnPage() {
  const t = useTranslations('column520.page');
  const tt = useTranslations('column520.page.tabs');
  const tPhoto = useTranslations('column520.photo');
  const tAvatar = useTranslations('column520.avatar');
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [tab, setTab] = useState<TabId>('copy');
  const [points, setPoints] = useState<number | null>(null);
  const [musicSeed, setMusicSeed] = useState<string>('');
  const [musicLyrics, setMusicLyrics] = useState<string>('');

  const photoOptions = useMemo(
    () => PHOTO_SCENES.map((s) => ({ id: s.id, label: tPhoto(`scenes.${s.id}`) })),
    [tPhoto]
  );
  const avatarOptions = useMemo(
    () => AVATAR_STYLES.map((s) => ({ id: s.id, label: tAvatar(`styles.${s.id}`) })),
    [tAvatar]
  );

  // Auth guard: redirect to signin once session loaded.
  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/auth/signin');
    }
  }, [isPending, session, router]);

  const refreshPoints = async () => {
    try {
      const res = await fetch('/api/user/points');
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points ?? 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (session) refreshPoints();
  }, [session]);

  const handleSendToMusic = (theme: string, lyrics: string) => {
    setMusicSeed(theme);
    setMusicLyrics(lyrics);
    setTab('music');
  };

  if (isPending || !session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-500 text-sm">{t('loginRequired')}</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50/50 via-white to-pink-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-rose-100 dark:border-rose-500/10 bg-gradient-to-r from-rose-100/60 via-pink-50 to-rose-100/60 dark:from-rose-500/10 dark:via-pink-500/5 dark:to-rose-500/10">
          <div className="container mx-auto px-4 py-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-rose-600 dark:text-rose-300 uppercase mb-2">
                  <Heart className="h-3 w-3 fill-current" /> Love Column
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  {t('title')}
                </h1>
                <p className="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                  {t('subtitle')}
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/20 px-4 py-3 shadow-sm hover:shadow-md hover:border-rose-400 transition-all text-slate-700 dark:text-slate-200"
              >
                <Home className="h-5 w-5 text-rose-500" />
                <span className="text-sm font-medium">{t('back')}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="container mx-auto px-4 py-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {TAB_ORDER.map((id) => {
              const Icon = TAB_ICON[id];
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-all',
                    active
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-transparent shadow-md'
                      : 'border-rose-200 dark:border-rose-500/30 text-slate-600 dark:text-slate-300 hover:border-rose-400 hover:text-rose-600'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tt(id)}
                </button>
              );
            })}
          </div>
        </section>

        {/* Active panel */}
        <section className="container mx-auto px-4 pb-16">
          <div className="rounded-3xl border border-rose-100 dark:border-rose-500/15 bg-white dark:bg-slate-900 shadow-sm p-6 md:p-8">
            {tab === 'copy' && (
              <CopyPanel
                cost={COST_COPY}
                balance={points}
                onSendToMusic={handleSendToMusic}
                onCreditsChanged={refreshPoints}
              />
            )}
            {tab === 'photo' && (
              <ImageGenPanel
                ns="column520.photo"
                endpoint="/api/love-column/couple-photo"
                optionField="scene"
                options={photoOptions}
                cost={COST_PHOTO}
                balance={points}
                onCreditsChanged={refreshPoints}
              />
            )}
            {tab === 'avatar' && (
              <ImageGenPanel
                ns="column520.avatar"
                endpoint="/api/love-column/couple-avatar"
                optionField="style"
                options={avatarOptions}
                cost={COST_AVATAR}
                balance={points}
                onCreditsChanged={refreshPoints}
              />
            )}
            {tab === 'analysis' && (
              <AnalysisPanel cost={COST_ANALYSIS} balance={points} onCreditsChanged={refreshPoints} />
            )}
            {tab === 'music' && (
              <MusicPanel
                cost={COST_MUSIC}
                balance={points}
                initialPrompt={musicSeed}
                initialLyrics={musicLyrics}
                onCreditsChanged={refreshPoints}
              />
            )}
            {tab === 'memoir' && (
              <MemoirPanel cost={COST_MEMOIR} balance={points} onCreditsChanged={refreshPoints} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
