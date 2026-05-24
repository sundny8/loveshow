'use client';

import { useMemo, useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { SpecPicker, SpecDetails } from './spec-picker';
import { DropzoneUploader } from './dropzone-uploader';
import { PHOTO_SPECS, getSpec, COST_PER_PHOTO } from '@/lib/photo/specs';
import {
  Loader2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Download,
  Search,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSession } from '@/lib/auth-client';
import { ImageModal } from '@/components/ui/image-modal';

type SuitHint = 'male' | 'female' | 'student' | 'none';

interface GeneratedResult {
  id: string;
  imageUrl: string;
  specId: string;
  createdAt: string;
}

export function PhotoStudio() {
  const t = useTranslations('photoStudio');
  const { data: session } = useSession();
  const [specId, setSpecId] = useState<string>('two_inch');
  const [bgColor, setBgColor] = useState<string>('');
  const [suit, setSuit] = useState<SuitHint>('none');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 获取用户积分
  async function fetchPoints() {
    if (!session) return;
    setLoadingPoints(true);
    try {
      const res = await fetch('/api/user/points');
      if (res.ok) {
        const data = await res.json();
        setUserPoints(data.points);
      }
    } catch (err) {
      console.error('Failed to fetch points:', err);
    } finally {
      setLoadingPoints(false);
    }
  }

  useEffect(() => {
    fetchPoints();
  }, [session]);

  const spec = useMemo(() => getSpec(specId), [specId]);
  const effectiveBg = bgColor || spec.bgColor;
  const cost = files.length * COST_PER_PHOTO;

  async function handleGenerate() {
    if (files.length === 0) {
      setError(t('errors.uploadRequired'));
      return;
    }
    setError(null);
    setSubmitting(true);
    setResults([]); // 清空之前的结果
    
    try {
      if (files.length === 1) {
        const fd = new FormData();
        fd.append('image', files[0]);
        fd.append('specId', specId);
        fd.append('bgColor', effectiveBg);
        fd.append('suit', suit);
        const res = await fetch('/api/photo/generate', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) {
          const errMsg = data?.error || t('errors.generateFailed');
          if (errMsg === 'insufficient_points') {
            throw new Error(t('errors.insufficientPoints'));
          }
          throw new Error(errMsg);
        }
        // 添加结果
        if (data.imageUrl) {
          setResults([{
            id: data.taskId || 'single',
            imageUrl: data.imageUrl,
            specId: specId,
            createdAt: new Date().toISOString(),
          }]);
        }
        fetchPoints();
      } else {
        const fd = new FormData();
        for (const f of files) fd.append('images', f);
        fd.append('specId', specId);
        fd.append('bgColor', effectiveBg);
        fd.append('suit', suit);
        const res = await fetch('/api/photo/batch', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) {
          const errMsg = data?.error || t('errors.batchFailed');
          if (errMsg === 'insufficient_points') {
            throw new Error(t('errors.insufficientPoints'));
          }
          throw new Error(errMsg);
        }
        // 批量生成需要轮询获取结果
        if (data.batchId) {
          await pollBatchResults(data.batchId);
        }
        fetchPoints();
      }
    } catch (e: any) {
      setError(e?.message || t('errors.generateFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  // 轮询批量生成结果
  async function pollBatchResults(batchId: string) {
    const maxAttempts = 60; // 最多轮询60次（3分钟）
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      try {
        const res = await fetch(`/api/photo/tasks?batchId=${batchId}`);
        if (!res.ok) break;
        
        const data = await res.json();
        const completedTasks = (data.tasks || []).filter(
          (task: any) => task.status === 'COMPLETED'
        );
        
        // 收集所有已完成的图片
        const newResults: GeneratedResult[] = [];
        for (const task of completedTasks) {
          const images = data.images?.filter((img: any) => img.taskId === task.id) || [];
          for (const img of images) {
            newResults.push({
              id: img.id,
              imageUrl: img.url,
              specId: task.specId || specId,
              createdAt: img.createdAt,
            });
          }
        }
        
        setResults(newResults);
        
        // 检查是否所有任务都完成
        const allDone = (data.tasks || []).every(
          (task: any) => task.status === 'COMPLETED' || task.status === 'FAILED'
        );
        
        if (allDone) break;
      } catch (err) {
        console.error('Poll error:', err);
        break;
      }
      
      attempts++;
    }
  }

  // 删除结果
  const handleDeleteResult = (id: string) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      {/* Left column: upload, spec picker, settings, generate */}
      <aside className="space-y-4 lg:sticky lg:top-20 self-start">
        {/* Upload */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-violet-100 dark:border-violet-900/30">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-violet-500" />
            {t('upload.title')}
          </h3>
          <DropzoneUploader multiple maxFiles={20} onChange={setFiles} />
        </div>

        {/* Spec Picker */}
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-4 shadow-lg border border-violet-100 dark:border-violet-900/30">
          <SpecPicker value={specId} onChange={setSpecId} compact />
          <div className="mt-3">
            <SpecDetails spec={spec} compact />
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-violet-100 dark:border-violet-900/30">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-500" />
            {t('settings.title')}
          </h3>
          
          {/* Background color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block">{t('settings.background')}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={effectiveBg}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-9 w-12 rounded-lg border-2 border-slate-200 dark:border-slate-600 cursor-pointer"
              />
              <input
                type="text"
                value={effectiveBg}
                onChange={(e) => setBgColor(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all"
              />
            </div>
          </div>

          {/* Suit synthesis */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block">{t('settings.suit')}</label>
            <select
              value={suit}
              onChange={(e) => setSuit(e.target.value as SuitHint)}
              className="w-full h-9 px-3 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all"
            >
              <option value="none">{t('settings.suitOptions.none')}</option>
              <option value="male">{t('settings.suitOptions.male')}</option>
              <option value="female">{t('settings.suitOptions.female')}</option>
              <option value="student">{t('settings.suitOptions.student')}</option>
            </select>
          </div>
        </div>

        {/* Cost & Generate */}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 shadow-xl border border-violet-400">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-violet-100">{t('cost.label')}</span>
            <span className="font-bold text-white">
              {files.length} × {COST_PER_PHOTO} = {cost} {t('cost.points')}
            </span>
          </div>
          {userPoints !== null && (
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-violet-100">{t('cost.balanceLabel')}</span>
              <span className="font-bold text-white">
                {userPoints} {t('cost.points')}
              </span>
            </div>
          )}
          <Button
            className="w-full bg-white hover:bg-violet-50 text-violet-600 border-0 h-11 font-bold shadow-lg hover:shadow-xl transition-all"
            size="sm"
            disabled={submitting || files.length === 0}
            onClick={handleGenerate}
            title={
              userPoints !== null && userPoints < cost
                ? t('cost.insufficientTooltip', { cost })
                : undefined
            }
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('actions.generating')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {files.length > 1 ? t('actions.batchGenerate') : t('actions.startGenerate')}
              </>
            )}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/30 border-2 border-rose-200 dark:border-rose-800 rounded-2xl p-3 text-xs flex items-start gap-2 shadow-lg">
            <X className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" />
            <div className="flex-1">
              <span className="text-rose-600 dark:text-rose-400 font-medium">{error}</span>
              {error === t('errors.insufficientPoints') && (
                <div className="mt-2">
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 underline"
                  >
                    {t('errors.goRecharge')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Right column: results */}
      <section>
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-violet-100 dark:border-violet-900/30">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Download className="h-5 w-5 text-violet-500" />
            {t('results.title')}
            {results.length > 0 && (
              <span className="text-xs font-normal text-slate-500 ml-auto bg-violet-100 dark:bg-violet-900/30 px-3 py-1 rounded-full">
                {t('results.count', { count: results.length })}
              </span>
            )}
          </h3>

        {/* Loading state */}
        {submitting && results.length === 0 ? (
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-16 text-center border-2 border-dashed border-violet-300 dark:border-violet-700">
            <Loader2 className="h-16 w-16 animate-spin text-violet-500 mx-auto mb-6" />
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
              {t('results.generatingHint')}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('results.generatingWait')}
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 relative group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                onClick={() => setPreviewImage(result.imageUrl)}
              >
                {/* Image container */}
                <div className="relative aspect-[3/4]">
                  <img
                    src={result.imageUrl}
                    alt={t('results.photoAlt')}
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* Center icons: zoom and download */}
                    <div className="absolute inset-0 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(result.imageUrl);
                        }}
                        className="h-12 w-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
                        title={t('results.preview')}
                      >
                        <Search className="h-5 w-5 text-slate-700" />
                      </button>
                      <a
                        href={result.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="h-12 w-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
                        title={t('results.download')}
                      >
                        <Download className="h-5 w-5 text-slate-700" />
                      </a>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteResult(result.id);
                      }}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 hover:bg-rose-600 flex items-center justify-center transition-colors"
                      title={t('results.delete')}
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl p-20 text-center border-2 border-dashed border-slate-300 dark:border-slate-700">
            <ImageIcon className="h-20 w-20 mx-auto mb-6 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
              {t('results.empty')}
            </p>
            <p className="text-sm text-slate-400">
              {t('results.emptyDesc')}
            </p>
          </div>
        )}
        </div>
      </section>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <ImageModal
          src={previewImage}
          alt={t('results.previewAlt')}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
