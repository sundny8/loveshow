'use client';

import { useEffect, useCallback } from 'react';

interface Props {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

/**
 * 全屏图片预览 Modal。
 * - 点击图片 / 按 ESC / 点击背景 关闭
 * - 最高 z-index 确保不被任何内容覆盖
 */
export function ImageModal({ src, alt = 'Preview', onClose }: Props) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!src) return;
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [src, handleKey]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-zoom-out"
      style={{ zIndex: 999999 }}
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-zoom-out"
        style={{ zIndex: 1000000 }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
    </div>
  );
}
