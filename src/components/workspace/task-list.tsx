'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, ZoomIn, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ImageModal } from '@/components/ui/image-modal';
import { getSpec } from '@/lib/photo/specs';

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

interface TaskRow {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  specId: string | null;
  createdAt: string | number | Date;
  errorMessage: string | null;
}

interface ImageRow {
  id: string;
  taskId: string;
  url: string;
  createdAt: string | number | Date;
}

/** 展平后的展示条目：图片 + 所属任务的 specId */
interface DisplayImage {
  id: string;
  url: string;
  createdAt: string | number | Date;
  specId: string | null;
}

interface Props {
  refreshKey: number;
  batchId?: string | null;
}

export function TaskList({ refreshKey, batchId }: Props) {
  const t = useTranslations('taskList');
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [images, setImages] = useState<Record<string, ImageRow[]>>({});
  const [loading, setLoading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      setLoading(true);
      try {
        const fetchUrl = batchId
          ? `/api/photo/tasks?batchId=${batchId}`
          : '/api/photo/tasks';
        const res = await fetch(fetchUrl, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setTasks(data.tasks ?? []);
        const map: Record<string, ImageRow[]> = {};
        for (const img of data.images ?? []) {
          if (!map[img.taskId]) map[img.taskId] = [];
          map[img.taskId].push(img);
        }
        setImages(map);

        const hasPending = (data.tasks ?? []).some(
          (t: TaskRow) => t.status === 'PENDING' || t.status === 'PROCESSING'
        );
        if (hasPending && !cancelled) {
          timer = setTimeout(poll, 3000);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [refreshKey, batchId]);

  // 删除图片：调 API + 立即从本地状态移除
  const handleDelete = useCallback(async (imgId: string) => {
    try {
      await fetch(`/api/photo/images/${imgId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('[TaskList] delete failed:', err);
    }
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.add(imgId);
      return next;
    });
  }, []);

  // 将所有已完成任务的图片展平为一个列表，3 列并排，排除已删除的
  const displayImages: DisplayImage[] = [];
  for (const task of tasks) {
    if (task.status !== 'COMPLETED') continue;
    const imgs = images[task.id] ?? [];
    for (const img of imgs) {
      if (deletedIds.has(img.id)) continue;
      displayImages.push({
        id: img.id,
        url: img.url,
        createdAt: img.createdAt,
        specId: task.specId,
      });
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="surface-card p-6 text-center text-sm text-slate-500">
        {loading ? t('loading') : t('empty')}
      </div>
    );
  }

  if (displayImages.length === 0) {
    return (
      <div className="surface-card p-6 text-center text-sm text-slate-500">
        {t('empty')}
      </div>
    );
  }

  return (
    <>
      {/* 可滚动区域：所有任务图片在同一网格中并排 */}
      <div
        className="overflow-y-auto custom-scrollbar"
        style={{ maxHeight: 'calc(100vh - 12rem)' }}
      >
        <div className="grid grid-cols-3 gap-3 pr-1">
          {displayImages.map((img) => (
            <PhotoCard
              key={img.id}
              img={img}
              onPreview={setPreviewSrc}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* 全局预览：顶部图层，不被任何元素遮挡 */}
      <ImageModal src={previewSrc} onClose={() => setPreviewSrc(null)} />
    </>
  );
}

function PhotoCard({
  img,
  onPreview,
  onDelete,
}: {
  img: DisplayImage;
  onPreview: (src: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations('taskCard');
  const spec = img.specId ? getSpec(img.specId) : null;

  return (
    <div className="space-y-1.5">
      {/* 图片卡片 */}
      <div className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt={t('resultAlt')}
          className="w-full h-full object-cover"
        />

        {/* 右上角删除按钮 — hover 时显示 */}
        <button
          type="button"
          title={t('delete')}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(img.id);
          }}
          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/40 text-white/80
                     opacity-0 group-hover:opacity-100
                     hover:bg-rose-600 hover:text-white
                     flex items-center justify-center
                     transition-all duration-150"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* 底部 hover 工具栏（放大镜 + 下载） */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity pointer-events-none">
          <button
            type="button"
            title={t('preview')}
            onClick={() => onPreview(img.url)}
            className="pointer-events-auto h-9 w-9 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow hover:scale-110 transition-transform"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={t('download')}
            onClick={() => downloadImage(img.url, `photo_${img.id}.jpg`)}
            className="pointer-events-auto h-9 w-9 rounded-full bg-white/90 text-violet-700 flex items-center justify-center shadow hover:scale-110 transition-transform"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* 尺寸 + 生成时间 */}
      <div className="text-center text-[10px] text-slate-500 leading-tight">
        <span>
          {spec ? `${spec.width}×${spec.height}` : '—'}
        </span>
        <br />
        <span>
          {img.createdAt
            ? new Date(img.createdAt).toLocaleString([], {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </span>
      </div>
    </div>
  );
}
