'use client';

import { PHOTO_SPECS, type PhotoSpec } from '@/lib/photo/specs';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface Props {
  value: string;
  onChange: (id: string) => void;
  compact?: boolean;
}

export function SpecPicker({ value, onChange, compact = false }: Props) {
  const t = useTranslations('specPicker');
  const tSpecs = useTranslations('photoSpecs');
  
  return (
    <div className={cn('space-y-2', compact && 'space-y-1')}>
      <div className={cn(
        'text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3',
        compact && 'text-xs mb-1'
      )}>
        {t('title')}
      </div>
      <div className={cn('grid grid-cols-2 gap-2', compact && 'gap-1.5')}>
        {PHOTO_SPECS.map((spec) => {
          const active = spec.id === value;
          const label = tSpecs(`${spec.id}.label`);
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => onChange(spec.id)}
              className={cn(
                'group relative rounded-xl border transition-all',
                compact ? 'py-1.5 px-2 flex items-center justify-center gap-1.5' : 'p-3 text-left',
                active
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-violet-300'
              )}
            >
              {compact ? (
                <>
                  <span
                    className="h-3 w-2.5 rounded-sm border border-slate-300 dark:border-slate-600 flex-shrink-0"
                    style={{ backgroundColor: spec.bgColor }}
                  />
                  <span className="text-xs font-semibold leading-none truncate">
                    {label}
                  </span>
                </>
              ) : (
                <div className="flex items-start gap-2">
                  <div
                    className="rounded-sm border border-slate-300 dark:border-slate-600 flex-shrink-0 h-8 w-6 mt-0.5"
                    style={{ backgroundColor: spec.bgColor }}
                  />
                  <div className="min-w-0">
                    <div className="font-semibold truncate text-sm">
                      {label}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {spec.width}×{spec.height}
                    </div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SpecDetails({ spec, compact = false }: { spec: PhotoSpec; compact?: boolean }) {
  const t = useTranslations('specDetails');
  const tSpecs = useTranslations('photoSpecs');
  const description = tSpecs(`${spec.id}.description`);
  
  return (
    <div className={cn(
      'surface-card space-y-1.5 text-xs',
      compact ? 'p-2 space-y-1' : 'p-2.5 space-y-1.5'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-slate-500">{t('size')}</span>
        <span className="font-medium">
          {spec.width} × {spec.height} px
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-500">{t('dpi')}</span>
        <span className="font-medium">{spec.dpi} DPI</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-500">{t('bgColor')}</span>
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'rounded border border-slate-300',
              compact ? 'h-2 w-2' : 'h-2.5 w-2.5'
            )}
            style={{ backgroundColor: spec.bgColor }}
          />
          <span className="font-mono text-[10px]">{spec.bgColor}</span>
        </span>
      </div>
      <p className={cn(
        'text-slate-500 dark:text-slate-400 leading-relaxed',
        compact ? 'text-[9px] pt-1' : 'text-[10px] pt-1.5'
      )}>
        {description}
      </p>
    </div>
  );
}
