'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUNO_MODELS, MUSIC_STYLES, MOOD_TYPES, VOCAL_OPTIONS, DURATION_OPTIONS, type SunoModel, type VocalOption, type DurationOption } from '@/lib/music/constants';
import { COST_PER_MUSIC } from '@/lib/music/constants';
import { Music, Loader2, Play, Pause, Download, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

interface MusicTask {
  id: string;
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

export function MusicStudio() {
  const t = useTranslations('musicStudio');
  const { data: session } = useSession();
  const [customMode, setCustomMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [instrumental, setInstrumental] = useState(false);
  const [model, setModel] = useState<SunoModel>('V4_5ALL');
  const [vocalStyle, setVocalStyle] = useState<VocalOption>('');
  const [mood, setMood] = useState<string>('');
  const [duration, setDuration] = useState<DurationOption>('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<SunoAudioItem[] | null>(null);
  const [tosUrls, setTosUrls] = useState<string[] | null>(null);
  const [timestampedLyrics, setTimestampedLyrics] = useState<any>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [userPoints, setUserPoints] = useState<number | null>(null);

  // 获取用户积分
  const fetchPoints = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/user/points');
      if (res.ok) {
        const data = await res.json();
        setUserPoints(typeof data.points === 'number' ? data.points : null);
      }
    } catch (err) {
      console.error('Failed to fetch points:', err);
    }
  };

  useEffect(() => {
    fetchPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // 轮询任务状态
  useEffect(() => {
    if (!currentTaskId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/music/task?taskId=${currentTaskId}`);
        const data = await res.json();
        const task: MusicTask = data.task;

        if (!task) return;

        setTaskStatus(task.status);

        if (task.status === 'SUCCESS' && task.resultData?.sunoData) {
          setAudioData(task.resultData.sunoData);
          setTosUrls(task.tosAudioUrls || null);
          setTimestampedLyrics(task.resultData.timestampedLyrics || null);
          setGenerating(false);
          fetchPoints(); // 生成成功后刷新积分
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } else if (task.status === 'FAILED') {
          setError(task.errorMessage || t('errors.generateFailed'));
          setGenerating(false);
          fetchPoints(); // 失败也刷新（防止已扣积分）
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch (e) {
        console.error('poll error', e);
      }
    };

    // 初次立即查询
    poll();
    // 每 10 秒轮询
    pollRef.current = setInterval(poll, 10_000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [currentTaskId]);

  const handleGenerate = async () => {
    setError(null);
    setAudioData(null);
    setTosUrls(null);
    setCurrentTaskId(null);
    setTaskStatus(null);
    setTimestampedLyrics(null);
    setCurrentTime(0);
    setAudioDuration(0);
    setCurrentLineIdx(-1);

    if (!prompt.trim()) {
      setError(t('errors.promptRequired'));
      return;
    }

    const maxLen = customMode ? 5000 : 500;
    if (prompt.trim().length > maxLen) {
      setError(t('errors.promptTooLong', { max: maxLen }));
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle || undefined,
          title: customMode ? title : undefined,
          customMode,
          instrumental,
          model,
          mood: mood || undefined,
          vocalStyle: vocalStyle || undefined,
          duration: duration || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('errors.requestFailed'));
      }

      setCurrentTaskId(data.taskId);
    } catch (err: any) {
      setError(err.message || t('errors.generationFailed'));
      setGenerating(false);
    }
  };

  const handlePlay = (audio: SunoAudioItem, index: number) => {
    const el = audioRef.current;
    if (!el) return;

    // 同一首歌正在播放 → 暂停；否则切换并播放
    if (playingId === audio.id && !el.paused) {
      el.pause();
      setPlayingId(null);
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    el.src = getBestAudioUrl(audio, index);
    setPlayingId(audio.id);
    el.play()
      .then(() => {
        console.log('[music-studio] play() resolved, readyState=', el.readyState);
        setIsPlaying(true);
      })
      .catch((err) => {
        console.error('[music-studio] play() rejected:', err.message, 'error=', el.error);
        setPlayingId(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setAudioDuration(0);
      });
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // 优先使用 TOS URL，回退到 Suno 原始 URL
  const getBestAudioUrl = (audio: SunoAudioItem, index: number) => {
    if (tosUrls && tosUrls[index]) {
      return tosUrls[index];
    }
    return audio.streamAudioUrl || audio.audioUrl;
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: t('status.pending'),
      GENERATING: t('status.generating'),
      SUCCESS: t('status.success'),
      FAILED: t('status.failed'),
    };
    return map[status] || status;
  };

  // 将 Suno 时间轴单词转换为歌词行
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
        // 没有换行 — 拼到当前行
        if (!current) lineStart = w.startS;
        current += raw;
      } else {
        // 有 \n — 前半部分结束当前行，后半部分开始下一行
        const beforeBreak = raw.slice(0, newlineIdx);
        const afterBreak = raw.slice(newlineIdx + 1);

        if (!current) lineStart = w.startS;
        current += beforeBreak;

        // 推出行
        lines.push({ text: current.trim(), startS: lineStart, endS: w.startS });

        // 后半部分作为新行开头
        current = afterBreak;
        lineStart = w.startS;
      }
    }
    if (current.trim()) {
      lines.push({ text: current.trim(), startS: lineStart, endS: words[words.length - 1]?.endS || 0 });
    }
    // 过滤掉 hint 行（以 [ 开头的提示信息，如 [Duet:...] [Mood:...] [Length:...]）
    const filtered = lines.filter(l => !l.text.trim().startsWith('['));
    return filtered.length > 0 ? filtered : null;
  }, [timestampedLyrics]);

  // 当前播放的歌词行索引追踪
  const [currentLineIdx, setCurrentLineIdx] = useState(-1);
  const lyricsRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // 播放时统一 raf 循环：进度条 + 逐行歌词高亮 + 自动滚动
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

      const container = lyricsRef.current;
      const lines = lyricLines;
      if (lines && lines.length > 0) {
        let active = -1;
        for (let i = lines.length - 1; i >= 0; i--) {
          if (t >= lines[i].startS) { active = i; break; }
        }
        if (active !== prevActive) {
          prevActive = active;
          setCurrentLineIdx(active);
          // 高亮行滚动到容器顶部可见位置
          if (container && active >= 0) {
            const lineEl = container.children[active] as HTMLElement | undefined;
            if (lineEl) {
              // 用 getBoundingClientRect 确保相对于滚动容器的精确位置
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

  // 当前播放歌曲的纯文本歌词（无时间轴时回退），过滤掉 hint 行 [...]
  const currentLyrics = (() => {
    if (!audioData || audioData.length === 0) return null;
    const audio = audioData[0];
    if (instrumental) return null;
    const raw = audio.prompt || null;
    if (!raw) return null;
    const filtered = raw.split('\n').filter(l => !l.trim().startsWith('[')).join('\n').trim();
    return filtered || null;
  })();

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* 生成表单 */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100 dark:border-emerald-900/30 mb-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Music className="h-6 w-6 text-emerald-500" />
          {t('title')}
        </h2>

        {/* 模式切换 */}
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setCustomMode(false)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              !customMode
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg scale-105'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}
          >
            {t('mode.simple')}
          </button>
          <button
            type="button"
            onClick={() => setCustomMode(true)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              customMode
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg scale-105'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}
          >
            {t('mode.custom')}
          </button>
        </div>

        {/* 情感类型选择 */}
        <div className="mb-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <Label className="mb-3 block font-semibold text-amber-900 dark:text-amber-100">{t('mood.label')}</Label>
          <div className="flex flex-wrap gap-2">
            {MOOD_TYPES.map((m) => {
              const isActive = mood === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(isActive ? '' : m)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                      : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {t(`moodLabels.${m}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 曲风选择芯片 */}
        <div className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
          <Label className="mb-3 block font-semibold text-emerald-900 dark:text-emerald-100">{t('style.label')}</Label>
          <div className="flex flex-wrap gap-2">
            {MUSIC_STYLES.map((s) => {
              const isActive = selectedStyle === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedStyle(isActive ? '' : s)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                      : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {t(`styleLabels.${s}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 提示词 */}
        <div className="mb-4">
          <Label>
            {customMode ? t('prompt.labelCustom') : t('prompt.labelSimple')}
            <span className="text-slate-400 ml-1">
              {t('prompt.lengthHint', { max: customMode ? '5000' : '500' })}
            </span>
          </Label>
          <Textarea
            placeholder={
              customMode
                ? t('prompt.placeholderCustom')
                : t('prompt.placeholderSimple')
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={customMode ? 6 : 4}
            className="mt-1"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">
            {prompt.length}/{customMode ? 5000 : 500}
          </p>
        </div>

        {/* 自定义模式额外参数 */}
        {customMode && (
          <div className="mb-4">
            <Label>{t('titleField.label')}</Label>
            <Input
              placeholder={t('titleField.placeholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
        )}

        {/* 人声选择 — 芯片式 */}
        <div className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <Label className="mb-3 block font-semibold text-purple-900 dark:text-purple-100">{t('vocal.label')}</Label>
          <div className="flex flex-wrap gap-2">
            {VOCAL_OPTIONS.map((v) => {
              const isActive = vocalStyle === v.value;
              return (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVocalStyle(isActive ? '' : v.value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                      : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/30 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {t(`vocalLabels.${v.label}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 歌曲时长 — 芯片式 */}
        <div className="mb-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800">
          <Label className="mb-3 block font-semibold text-cyan-900 dark:text-cyan-100">{t('duration.label')}</Label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((d) => {
              const isActive = duration === d.value;
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(isActive ? '' : d.value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/30 scale-105'
                      : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-cyan-100 hover:text-cyan-700 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {t(`durationLabels.${d.label}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 模型 & 纯器乐 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>{t('model.label')}</Label>
            <Select value={model} onValueChange={(value: string) => setModel(value as SunoModel)}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder={t('model.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {SUNO_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {t(`modelLabels.${m.label}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={instrumental}
                onChange={(e) => setInstrumental(e.target.checked)}
                className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">{t('instrumental.label')}</span>
            </label>
          </div>
        </div>

        {/* 消耗提示 & 生成按钮 */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 shadow-xl border border-emerald-400">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-emerald-100">
              {t('cost.label')} <span className="font-bold text-white text-base">{COST_PER_MUSIC}</span> {t('cost.points')}
            </p>
            {userPoints !== null && (
              <p className="text-sm text-emerald-100">
                {t('cost.balance')}：<span className={`font-bold text-base ${userPoints < COST_PER_MUSIC ? 'text-rose-200' : 'text-white'}`}>{userPoints}</span> {t('cost.points')}
              </p>
            )}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-white hover:bg-emerald-50 text-emerald-600 border-0 h-12 font-bold shadow-lg hover:shadow-xl transition-all text-base"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {taskStatus === 'GENERATING' || taskStatus === 'PENDING' ? t('actions.generating') : t('actions.submitting')}
              </>
            ) : (
              <>
                <Music className="h-5 w-5 mr-2" />
                {t('actions.startGenerate')}
              </>
            )}
          </Button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-6 bg-rose-50 dark:bg-rose-900/30 border-2 border-rose-200 dark:border-rose-800 rounded-xl p-4 text-sm flex items-start gap-2 shadow-lg">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-rose-600" />
            <span className="text-rose-600 dark:text-rose-400 font-medium">{error}</span>
          </div>
        )}

        {/* 生成进度 */}
        {generating && taskStatus && (
          <div className="mt-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
            <div className="flex items-center gap-3 text-base text-blue-700 dark:text-blue-300 font-semibold">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{statusLabel(taskStatus)}</span>
            </div>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
              {t('progress.waitHint')}
            </p>
          </div>
        )}

        {/* 生成结果 — 仅展示第一首 */}
        {audioData && audioData.length > 0 && (() => {
          const first = audioData[0];
          return (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {t('result.title')}
              </h3>
              {/* 占位 audio 元素（可视但极小，避免浏览器阻止事件） */}
              <audio
                ref={audioRef}
                onError={(e) => console.error('[music-studio] audio error:', (e.target as HTMLAudioElement).error)}
                onLoadedMetadata={() => console.log('[music-studio] audio loadedMetadata')}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => { setIsPlaying(false); setPlayingId(null); }}
                className="absolute w-0 h-0 opacity-0 pointer-events-none"
              />

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* 封面 + 标题行 */}
                <div className="flex items-start gap-3 p-4">
                  {/* 封面图 — 点击播放/暂停，播放中显示进度条 */}
                  <div className="relative group shrink-0">
                    {first.imageUrl ? (
                      <img
                        src={first.imageUrl}
                        alt={first.title}
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center">
                        <Music className="h-8 w-8 text-emerald-400" />
                      </div>
                    )}
                    {/* 点击播放/暂停 */}
                    <button
                      onClick={() => handlePlay(first, 0)}
                      className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/30 hover:bg-black/45 transition-all duration-200 overflow-hidden"
                    >
                      {/* 播放/暂停图标 */}
                      <span className="text-white drop-shadow-lg">
                        {playingId === first.id && isPlaying ? (
                          <Pause className="h-8 w-8" />
                        ) : (
                          <Play className="h-8 w-8" />
                        )}
                      </span>

                      {/* 进度条：播放时显示在底部 */}
                      {playingId === first.id && isPlaying && audioDuration > 0 && (
                        <>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div
                              className="h-full bg-emerald-400 transition-[width] duration-150 ease-linear"
                              style={{ width: `${(currentTime / audioDuration) * 100}%` }}
                            />
                          </div>
                          <span className="absolute bottom-2 left-2 right-2 text-[10px] text-white/80 text-center drop-shadow">
                            {formatDuration(currentTime)}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base truncate">{first.title || t('result.untitled')}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{first.modelName} · {formatDuration(first.duration)}</span>
                      <a
                        href={getBestAudioUrl(first, 0)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                        title={t('result.download')}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t('result.download')}
                      </a>
                    </p>
                  </div>
                </div>

                {/* 歌词展示区 — 带时间轴逐行高亮 */}
                {!instrumental && (lyricLines || currentLyrics) && (
                  <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3">
                    {/* 播放进度条 — 歌词区上方，可点击/拖拽快进快退 */}
                    {playingId === first.id && audioDuration > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                          <span className="w-9 text-right tabular-nums">{formatDuration(currentTime)}</span>
                          <div
                            className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer group"
                            onClick={(e) => {
                              const el = audioRef.current;
                              if (!el || !audioDuration) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                              el.currentTime = pct * audioDuration;
                              setCurrentTime(el.currentTime);
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const el = audioRef.current;
                              if (!el || !audioDuration) return;
                              const bar = e.currentTarget;
                              const seek = (ev: MouseEvent) => {
                                const rect = bar.getBoundingClientRect();
                                const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                                el.currentTime = pct * audioDuration;
                                setCurrentTime(el.currentTime);
                              };
                              const up = () => {
                                document.removeEventListener('mousemove', seek);
                                document.removeEventListener('mouseup', up);
                              };
                              document.addEventListener('mousemove', seek);
                              document.addEventListener('mouseup', up);
                            }}
                          >
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${(currentTime / audioDuration) * 100}%` }}
                            />
                            {/* 拖拽小圆点 */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full shadow-md border-2 border-white dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ left: `calc(${(currentTime / audioDuration) * 100}% - 6px)` }}
                            />
                          </div>
                          <span className="w-9 tabular-nums">{formatDuration(audioDuration)}</span>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      {t('result.lyrics')} {lyricLines && isPlaying && playingId === first.id && (
                        <span className="inline-flex items-center gap-1 text-emerald-500">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          {t('result.syncing')}
                        </span>
                      )}
                    </p>
                    {lyricLines ? (
                      <div
                        ref={lyricsRef}
                        className="text-sm leading-loose max-h-60 overflow-y-auto scrollbar-hide bg-white/60 dark:bg-slate-900/40 rounded-lg p-3 scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {lyricLines.map((line, i) => (
                          <p
                            key={i}
                            className={`py-1 px-2 rounded text-center transition-all duration-300 ${
                              isPlaying && playingId === first.id && i === currentLineIdx
                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold text-base scale-105'
                                : i < currentLineIdx && isPlaying && playingId === first.id
                                  ? 'text-slate-400 dark:text-slate-500'
                                  : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {line.text || '\u00A0'}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto bg-white/60 dark:bg-slate-900/40 rounded-lg p-3">
                        {currentLyrics}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>


    </div>
  );
}
