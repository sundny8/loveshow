'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface Props {
  multiple?: boolean;
  maxFiles?: number;
  onChange: (files: File[]) => void;
}

export function DropzoneUploader({ multiple = true, maxFiles = 20, onChange }: Props) {
  const t = useTranslations('dropzone');
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const next = (multiple ? [...files.map((f) => f.file), ...accepted] : accepted.slice(0, 1))
        .slice(0, maxFiles)
        .map((file) => ({
          file,
          preview:
            files.find((f) => f.file.name === file.name && f.file.size === file.size)?.preview ??
            URL.createObjectURL(file),
        }));
      setFiles(next);
      onChange(next.map((n) => n.file));
    },
    [files, multiple, maxFiles, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    multiple,
    maxFiles,
  });

  const remove = (i: number) => {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    onChange(next.map((n) => n.file));
  };

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors overflow-hidden',
          isDragActive
            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-violet-400 bg-white dark:bg-slate-900',
          files.length > 0 && !multiple
            ? 'p-0 border-solid border-slate-200 dark:border-slate-700'
            : files.length > 0 && multiple
            ? 'p-3'
            : 'p-5'
        )}
      >
        <input {...getInputProps()} />
        
        {/* Single file mode: show large preview */}
        {files.length === 1 && !multiple ? (
          <div className="relative group h-[150px] p-3 flex items-center justify-center">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={files[0].preview}
                alt={files[0].file.name}
                className="max-w-full max-h-[140px] w-auto h-auto object-contain rounded-lg"
              />
              {/* 删除按钮 - 悬停时显示 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  remove(0);
                }}
                className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="删除参考图"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
            {/* 悬停遮罩层 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center rounded-2xl pointer-events-none">
              <span className="text-slate-700 dark:text-slate-200 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-full shadow-sm">
                点击更换图片
              </span>
            </div>
          </div>
        ) : files.length > 0 && multiple ? (
          // Multiple file mode: show grid of thumbnails
          <div className="space-y-1.5">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {files.map((fileObj, index) => (
                <div key={index} className="relative group aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileObj.preview}
                    alt={fileObj.file.name}
                    className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      remove(index);
                    }}
                    className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="删除图片"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                  {/* File number badge */}
                  <div className="absolute top-1 left-1 h-4.5 w-4.5 rounded-full bg-black/60 text-white flex items-center justify-center text-[9px] font-semibold">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">
              已选择 {files.length} 张图片 {files.length < maxFiles ? `（最多 ${maxFiles} 张）` : ''}
            </p>
          </div>
        ) : (
          // No files: show upload prompt
          <div className="flex flex-col items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 flex items-center justify-center">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-xs">
                {isDragActive ? t('dragActive') : t('dragDefault')}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {t('formats', { maxFiles })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
