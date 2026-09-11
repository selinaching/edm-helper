import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ExternalLink } from 'lucide-react';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  category?: string;
  referenceUrl?: string;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  category,
  referenceUrl,
}) => {
  const [scale, setScale] = useState(1);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.5));
  const handleReset = () => setScale(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/80 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            {category && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                {category}
              </span>
            )}
            <h3 className="text-sm font-semibold truncate text-slate-200">{title}</h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                title="缩小"
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded hover:bg-slate-700 transition"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-2 text-slate-300">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={scale >= 3}
                title="放大"
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded hover:bg-slate-700 transition"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleReset}
                title="重置比例"
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {referenceUrl && (
              <a
                href={referenceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 transition"
              >
                <span>原参考链接</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/50 min-h-[400px]">
          <img
            src={imageUrl}
            alt={title}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
            className="max-w-full max-h-[75vh] object-contain rounded shadow-lg select-none cursor-zoom-in"
            onClick={handleZoomIn}
          />
        </div>
      </div>
    </div>
  );
};
