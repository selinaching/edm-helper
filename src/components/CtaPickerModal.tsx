import React, { useState } from 'react';
import { X, Search, MousePointerClick, Plus, ExternalLink } from 'lucide-react';
import { CtaCopy } from '../types';

interface CtaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ctaCopies: CtaCopy[];
  onSelectCta: (cta: { text: string; link?: string; category?: string }) => void;
  onOpenCtaLibrary?: () => void;
}

export const CtaPickerModal: React.FC<CtaPickerModalProps> = ({
  isOpen,
  onClose,
  ctaCopies,
  onSelectCta,
  onOpenCtaLibrary,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [customText, setCustomText] = useState('');

  if (!isOpen) return null;

  const categories = Array.from(
    new Set(['通用型', '转化类', '促销类', ...ctaCopies.map((c) => c.category).filter(Boolean)])
  );

  const filtered = ctaCopies.filter((c) => {
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesSearch =
      !search.trim() ||
      c.text.toLowerCase().includes(search.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    onSelectCta({ text: customText.trim(), category: '自定义' });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold">从 CTA 文案库选择按钮</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Pills */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索 CTA 文案..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              全部 ({ctaCopies.length})
            </button>
            {categories.map((cat) => {
              const count = ctaCopies.filter((c) => c.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA Buttons List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              未找到匹配的 CTA 文案。你可以在下方直接输入自定义按钮。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCta({ text: c.text, link: c.link, category: c.category });
                    onClose();
                  }}
                  className="p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                      {c.category}
                    </span>
                    {c.link && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-mono truncate max-w-[120px]">
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        {c.link}
                      </span>
                    )}
                  </div>

                  <div className="text-center my-1">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded shadow-2xs group-hover:bg-indigo-600 transition tracking-wider">
                      {c.text}
                    </span>
                  </div>

                  {c.notes && (
                    <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      {c.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Quick Custom Entry */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <form onSubmit={handleCustomSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="或者直接输入自定义 CTA..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
            />
            <button
              type="submit"
              disabled={!customText.trim()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition"
            >
              插入
            </button>
          </form>

          {onOpenCtaLibrary && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCtaLibrary();
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
            >
              文案库管理 ➔
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
