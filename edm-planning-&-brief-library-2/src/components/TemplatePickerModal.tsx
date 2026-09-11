import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Check,
  Maximize2,
  ExternalLink,
  LayoutTemplate,
  Sparkles,
  Filter,
} from 'lucide-react';
import { Template, DisplayTypeConfig } from '../types';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  positionName: string;
  currentDisplayType?: string;
  templates: Template[];
  displayTypes?: DisplayTypeConfig;
  isHero?: boolean;
  onSelectTemplate: (template: Template) => void;
  onZoomImage: (url: string, title: string, referenceUrl?: string) => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  onClose,
  positionName,
  currentDisplayType,
  templates,
  displayTypes,
  isHero = false,
  onSelectTemplate,
  onZoomImage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Determine categories derived from display types & template library
  const categoryList = useMemo(() => {
    const set = new Set<string>();

    // 1. Prioritize position-specific display types
    if (isHero) {
      (displayTypes?.heroTypes || ['内容', '促销', '新品首发', '场景体验']).forEach((t) =>
        set.add(t)
      );
    } else {
      (
        displayTypes?.bodyTypes || [
          '功能属性',
          '媒体背书',
          '场景体验',
          '用户评价',
          '对比测评',
          '技术解析',
        ]
      ).forEach((t) => set.add(t));
    }

    // 2. Add existing categories from templates
    templates.forEach((tpl) => {
        const cat = tpl.category || tpl.mainCategory;
      if (cat) set.add(cat);
    });

    return Array.from(set);
  }, [displayTypes, isHero, templates]);

  // Initial category filter defaults to current position's display type if present!
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      if (currentDisplayType && currentDisplayType.trim()) {
        // Try to match current display type
        const trimmed = currentDisplayType.trim();
        const found = categoryList.find(
          (c) => c.toLowerCase() === trimmed.toLowerCase() || c.includes(trimmed)
        );
        setSelectedCategory(found || trimmed);
      } else {
        setSelectedCategory('ALL');
      }
      setSearchTerm('');
    }
  }, [isOpen, currentDisplayType, categoryList]);

  // Count templates per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: templates.length };
    categoryList.forEach((cat) => {
      counts[cat] = templates.filter((tpl) => {
        const tCat = (tpl.category || tpl.mainCategory || '').toLowerCase();
        const target = cat.toLowerCase();
        return tCat === target || tCat.includes(target) || target.includes(tCat);
      }).length;
    });
    return counts;
  }, [templates, categoryList]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      // Category match
      if (selectedCategory !== 'ALL') {
        const tCat = (tpl.category || tpl.mainCategory || '').toLowerCase();
        const target = selectedCategory.toLowerCase();
        const matchesCategory = tCat === target || tCat.includes(target) || target.includes(tCat);
        if (!matchesCategory) return false;
      }

      // Keyword search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = tpl.templateName.toLowerCase().includes(query);
        const descMatch = (tpl.description || '').toLowerCase().includes(query);
        const tagMatch = (tpl.tags || []).some((t) => t.toLowerCase().includes(query));
        return nameMatch || descMatch || tagMatch;
      }

      return true;
    });
  }, [templates, selectedCategory, searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  选择参考模板 · 为【{positionName}】指定设计参考
                </h2>
                {currentDisplayType && (
                  <span className="flex items-center gap-1 text-[11px] bg-purple-500/20 text-purple-200 border border-purple-400/30 px-2 py-0.5 rounded-full font-medium">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    当前展现类型: {currentDisplayType}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                先选大类，再展示具体大图参考；已自动根据展现类型进行优先推荐筛选
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Category Filter (先选大类) & Search */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 space-y-3">
          {/* Search bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-purple-600" />
              <span>第一步：选择模板大类</span>
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索模板名称/关键词..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                selectedCategory === 'ALL'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>全部</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === 'ALL'
                    ? 'bg-purple-700 text-purple-100'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {categoryCounts.ALL || 0}
              </span>
            </button>

            {categoryList.map((cat) => {
              const isCurrentType =
                currentDisplayType &&
                (cat.toLowerCase() === currentDisplayType.toLowerCase() ||
                  cat.includes(currentDisplayType));
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs'
                      : isCurrentType
                        ? 'bg-purple-50 text-purple-700 border border-purple-300 hover:bg-purple-100'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {isCurrentType && <Sparkles className="w-3 h-3 text-amber-500" />}
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-purple-700 text-purple-100'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Big Image Grid (具体图片让我选，图片大一些) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-500 font-medium">
              当前大类【{selectedCategory === 'ALL' ? '全部' : selectedCategory}】下共有{' '}
              <strong className="text-slate-900">{filteredTemplates.length}</strong> 款大图参考模板
            </span>

            {selectedCategory !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className="text-xs text-purple-600 hover:text-purple-800 font-semibold"
              >
                查看全部大类模板 →
              </button>
            )}
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto my-6">
              <LayoutTemplate className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                分类「{selectedCategory}」下暂无模板
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                当前大类还未录入参考模板，你可以点击下方查看其他分类的模板或前往「参考模板库」上传新模板。
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition"
              >
                查看全部模板 ({templates.length})
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((tpl) => {
                const categoryName = tpl.category || tpl.mainCategory || '通用';
                const isMatched =
                  currentDisplayType &&
                  categoryName.toLowerCase().includes(currentDisplayType.toLowerCase());

                return (
                  <div
                    key={tpl.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                  >
                    {/* Big Image Container (大图展示，满足用户'图片大一些'要求) */}
                    <div className="relative bg-slate-100 overflow-hidden h-64 sm:h-72 w-full flex items-center justify-center border-b border-slate-200">
                      {tpl.screenshotUrl ? (
                        <img
                          src={tpl.screenshotUrl}
                          alt={tpl.templateName}
                          className="w-full h-full object-cover object-top group-hover:scale-102 transition duration-300 cursor-pointer"
                          onClick={() => onSelectTemplate(tpl)}
                        />
                      ) : (
                        <div
                          className="text-center p-6 text-slate-400 cursor-pointer"
                          onClick={() => onSelectTemplate(tpl)}
                        >
                          <LayoutTemplate className="w-12 h-12 mx-auto mb-2 opacity-40" />
                          <span className="text-xs">暂无模板大图</span>
                        </div>
                      )}

                      {/* Badges on Top */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs shadow-xs">
                          {categoryName}
                        </span>
                        {isMatched && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            推荐匹配
                          </span>
                        )}
                      </div>

                      {/* Zoom Button on Image Hover */}
                      {tpl.screenshotUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onZoomImage(tpl.screenshotUrl!, tpl.templateName, tpl.referenceUrl);
                          }}
                          className="absolute bottom-2.5 right-2.5 p-2 rounded-lg bg-slate-900/75 hover:bg-slate-900 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition shadow-sm flex items-center gap-1 text-[11px] font-medium"
                          title="点击放大查看大图"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>放大查看</span>
                        </button>
                      )}
                    </div>

                    {/* Content & Select Action */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectTemplate(tpl)}
                            className="text-left text-xs font-bold text-slate-900 line-clamp-1 leading-snug hover:text-purple-700"
                          >
                            {tpl.templateName}
                          </button>
                          {tpl.referenceUrl && (
                            <a
                              href={tpl.referenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-purple-600 hover:text-purple-800 shrink-0 p-0.5"
                              title="在新窗口打开原网页链接"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {tpl.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {tpl.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (tpl.screenshotUrl) {
                              onZoomImage(tpl.screenshotUrl, tpl.templateName, tpl.referenceUrl);
                            }
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                        >
                          查看大图
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectTemplate(tpl);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>选用此模板</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            共载入 {templates.length} 款模板，支持随时更换
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
