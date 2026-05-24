'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { DropzoneUploader } from './dropzone-uploader';
import { ImageModal } from '@/components/ui/image-modal';
import {
  PORTRAIT_STYLES,
  COST_PER_PORTRAIT,
} from '@/lib/photo/portrait-styles';
import {
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Download,
  Users,
  AlertCircle,
  CheckCircle2,
  Search,
} from 'lucide-react';

type Gender = 'auto' | 'male' | 'female';

interface GeneratedResult {
  imageUrl: string;
  styleId: string;
  styleName: string;
  provider: string;
}

export function PortraitStudio() {
  const t = useTranslations('portraitStudio');
  const locale = useLocale();
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([
    PORTRAIT_STYLES[0].id,
  ]);
  const [gender, setGender] = useState<Gender>('auto');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number>(-1);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchPoints = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/user/points');
      if (res.ok) {
        const data = await res.json();
        setUserPoints(data.points);
      }
    } catch (err) {
      console.error('Failed to fetch points:', err);
    }
  }, [session]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const handleFileChange = (files: File[]) => {
    setFile(files[0] ?? null);
    setResults([]);
    setError(null);
  };

  const toggleStyle = (styleId: string) => {
    setSelectedStyleIds((prev) => {
      if (prev.includes(styleId)) {
        // 至少保留一个选中的风格
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== styleId);
      }
      return [...prev, styleId];
    });
  };

  const getLocalizedStyleName = useCallback(
    (styleId: string) => {
      const style = PORTRAIT_STYLES.find((s) => s.id === styleId);
      return locale === 'en' ? (style?.nameEn ?? styleId) : (style?.name ?? styleId);
    },
    [locale],
  );

  const handleGenerate = async () => {
    if (!file) {
      setError(t('errors.uploadRequired'));
      return;
    }
    if (selectedStyleIds.length === 0) {
      setError(t('errors.styleRequired'));
      return;
    }

    const totalCost = selectedStyleIds.length * COST_PER_PORTRAIT;
    if (userPoints !== null && userPoints < totalCost) {
      setError(t('errors.insufficientPoints', { cost: totalCost }));
      return;
    }

    setError(null);
    setResults([]);
    setSubmitting(true);

    try {
      // 依次生成每个风格
      for (let i = 0; i < selectedStyleIds.length; i++) {
        const styleId = selectedStyleIds[i];
        setCurrentGeneratingIndex(i);

        const fd = new FormData();
        fd.append('image', file);
        fd.append('styleId', styleId);
        fd.append('gender', gender);

        const res = await fetch('/api/portrait/generate', {
          method: 'POST',
          body: fd,
        });
        const data = await res.json();

        if (!res.ok) {
          const errMsg = data?.error || 'generation_failed';
          if (errMsg === 'insufficient_points') {
            throw new Error('insufficient_points');
          }
          // 其他错误统一提示
          throw new Error('generation_failed');
        }

        setResults((prev) => [
          ...prev,
          {
            imageUrl: data.imageUrl,
            styleId: data.styleId,
            styleName: data.styleName,
            provider: data.provider,
          },
        ]);
      }

      fetchPoints();
    } catch (e: any) {
      const errorMsg = e?.message || 'generation_failed';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
      setCurrentGeneratingIndex(-1);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
      {/* Left column: upload, gender, styles, generate */}
      <aside className="space-y-4 lg:sticky lg:top-24 self-start">
        {/* Upload */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-orange-100 dark:border-orange-900/30">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-orange-500" />
            {t('upload.title')}
          </h3>
          <DropzoneUploader
            multiple={false}
            maxFiles={1}
            onChange={handleFileChange}
          />
        </div>

        {/* Gender selection */}
        <div className="bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-2xl p-4 shadow-lg border border-orange-100 dark:border-orange-900/30">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-500" />
            {t('gender.title')}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(['auto', 'male', 'female'] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  gender === g
                    ? 'bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-2 border-slate-200 dark:border-slate-700'
                }`}
              >
                {t(`gender.${g}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Portrait styles */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-orange-100 dark:border-orange-900/30">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            {t('styles.title')}
            <span className="text-xs font-normal text-slate-500 ml-auto bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
              {t('styles.count', { count: selectedStyleIds.length })}
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {PORTRAIT_STYLES.map((style) => {
              const isActive = selectedStyleIds.includes(style.id);
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => toggleStyle(style.id)}
                  className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" />
                    )}
                    <span
                      className={`text-xs font-bold leading-tight ${
                        isActive
                          ? 'text-orange-700 dark:text-orange-300'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {locale === 'en' ? style.nameEn : style.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cost & Generate */}
        <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl p-4 shadow-xl border border-orange-400">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-orange-100">{t('cost.label')}</span>
            <span className="font-bold text-white">
              {selectedStyleIds.length} × {COST_PER_PORTRAIT} = {selectedStyleIds.length * COST_PER_PORTRAIT} {t('cost.points')}
            </span>
          </div>
          {userPoints !== null && (
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-orange-100">{t('cost.balance')}</span>
              <span className="font-bold text-white">
                {userPoints} {t('cost.points')}
              </span>
            </div>
          )}
          <Button
            className="w-full bg-white hover:bg-orange-50 text-orange-600 border-0 h-12 font-bold shadow-lg hover:shadow-xl transition-all text-base"
            size="lg"
            disabled={submitting || !file || selectedStyleIds.length === 0}
            onClick={handleGenerate}
            title={
              userPoints !== null && userPoints < selectedStyleIds.length * COST_PER_PORTRAIT
                ? t('errors.insufficientPoints', { cost: selectedStyleIds.length * COST_PER_PORTRAIT })
                : undefined
            }
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {currentGeneratingIndex >= 0
                  ? t('actions.generatingProgress', { current: currentGeneratingIndex + 1, total: selectedStyleIds.length })
                  : t('actions.generating')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {selectedStyleIds.length > 1
                  ? t('actions.startGenerate', { count: selectedStyleIds.length })
                  : t('actions.startGenerateSingle')}
              </>
            )}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/30 border-2 border-rose-200 dark:border-rose-800 rounded-2xl p-3 text-sm flex items-start gap-2 shadow-lg">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-rose-600" />
            <div className="flex-1">
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {error === 'insufficient_points'
                  ? t('errors.insufficientPoints', { cost: selectedStyleIds.length * COST_PER_PORTRAIT })
                  : t('errors.generationFailed')}
              </span>
              {error === 'insufficient_points' && (
                <div className="mt-2">
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 underline"
                  >
                    {t('errors.goRecharge')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Right column: large result area */}
      <section>
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 dark:border-orange-900/30">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Download className="h-6 w-6 text-orange-500" />
            {t('results.title')}
            {results.length > 0 && (
              <span className="text-sm font-normal text-slate-500 ml-auto bg-orange-100 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
                {t('results.count', { count: results.length })}
              </span>
            )}
          </h2>

        {/* Loading state - only show when no results yet */}
        {submitting && results.length === 0 ? (
          <div className="bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-xl p-16 text-center border-2 border-dashed border-orange-300 dark:border-orange-700">
            <Loader2 className="h-16 w-16 animate-spin text-orange-500 mx-auto mb-6" />
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
              {t('results.generatingHint')}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {currentGeneratingIndex >= 0
                ? t('results.generatingStatus', { current: currentGeneratingIndex + 1, total: selectedStyleIds.length })
                : t('results.generatingWait')}
            </p>
          </div>
        ) : results.length > 0 ? (
          <div>
            {/* Results grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => (
              <div
                key={result.styleId}
                className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 relative group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                onClick={() => setPreviewImage(result.imageUrl)}
              >
                {/* Image container */}
                <div className="relative aspect-[2/3]">
                  <img
                    src={result.imageUrl}
                    alt={getLocalizedStyleName(result.styleId)}
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

                    {/* Bottom style name */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white text-sm font-semibold text-center">
                        {getLocalizedStyleName(result.styleId)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show loading indicator while generating more */}
          {submitting && (
            <div className="mt-6 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-xl p-8 text-center border-2 border-dashed border-orange-300 dark:border-orange-700">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {t('results.generatingStatus', { current: currentGeneratingIndex + 1, total: selectedStyleIds.length })}
              </p>
            </div>
          )}
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
