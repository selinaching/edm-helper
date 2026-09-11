import React, { useState } from 'react';
import {
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  FolderPlus,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  MousePointerClick,
} from 'lucide-react';
import { CtaCopy } from '../types';

interface CtaLibraryProps {
  ctaCopies: CtaCopy[];
  onSaveCta: (cta: CtaCopy) => Promise<void>;
  onDeleteCta: (id: string) => Promise<void>;
}

export const CtaLibrary: React.FC<CtaLibraryProps> = ({
  ctaCopies,
  onSaveCta,
  onDeleteCta,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [editingCta, setEditingCta] = useState<CtaCopy | null>(null);
  const [formText, setFormText] = useState('');
  const [formCategory, setFormCategory] = useState('通用型');
  const [formLink, setFormLink] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Category management states
  const [newCategoryName, setNewCategoryName] = useState('');

  // Collect all unique categories
  const defaultCategories = ['通用型', '转化类', '促销类', '内容/故事类', '品牌互动类'];
  const allCategories = Array.from(
    new Set([...defaultCategories, ...ctaCopies.map((c) => c.category).filter(Boolean)])
  );

  const filteredCopies = ctaCopies.filter((c) => {
    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingCta(null);
    setFormText('');
    setFormCategory(selectedCategory !== 'ALL' ? selectedCategory : '通用型');
    setFormLink('');
    setFormNotes('');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (cta: CtaCopy) => {
    setEditingCta(cta);
    setFormText(cta.text);
    setFormCategory(cta.category || '通用型');
    setFormLink(cta.link || '');
    setFormNotes(cta.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    const item: CtaCopy = {
      id: editingCta ? editingCta.id : 'cta_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      text: formText.trim(),
      category: formCategory.trim() || '通用型',
      link: formLink.trim(),
      notes: formNotes.trim(),
      createdAt: editingCta ? editingCta.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveCta(item);
    setIsEditModalOpen(false);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    // Add dummy CTA in that category to register it, or set to selected
    setSelectedCategory(newCategoryName.trim());
    setFormCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-indigo-600" />
            <span>CTA 按钮文案库</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            分类管理邮件各屏位置调用的行动号召 (Call-To-Action) 文案，编写 Brief 时可一键插入并增加/删除按钮。
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
            <span>自定义分类</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建 CTA 文案</span>
          </button>
        </div>
      </div>

      {/* Filter & Category Pills */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              全部 ({ctaCopies.length})
            </button>
            {allCategories.map((cat) => {
              const count = ctaCopies.filter((c) => c.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索 CTA 按钮文案或说明..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* CTA Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {filteredCopies.map((cta) => (
          <div
            key={cta.id}
            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {cta.category}
                </span>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleCopyText(cta.text, cta.id)}
                    title="复制文案"
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                  >
                    {copiedId === cta.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(cta)}
                    title="编辑"
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定删除 CTA 文案「${cta.text}」？`)) {
                        onDeleteCta(cta.id);
                      }
                    }}
                    title="删除"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Button Preview Graphic */}
              <div className="my-2 text-center">
                <span className="inline-block px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-md shadow-xs tracking-wider">
                  {cta.text}
                </span>
              </div>

              {cta.notes && (
                <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                  {cta.notes}
                </p>
              )}
            </div>

            {cta.link && (
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-400 truncate">
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{cta.link}</span>
              </div>
            )}
          </div>
        ))}

        {filteredCopies.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">未找到匹配的 CTA 按钮文案</p>
            <p className="text-[11px] text-slate-400 mt-1">可点击右上角新建文案或选择其他分类。</p>
          </div>
        )}
      </div>

      {/* Edit / Add CTA Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-sm font-semibold">
                {editingCta ? '编辑 CTA 按钮文案' : '新建 CTA 按钮文案'}
              </span>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  按钮文案内容 *
                </label>
                <input
                  type="text"
                  required
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="例如: SHOP NOW / 立即探索 / 限时抢购"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  所属分类 *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const custom = prompt('输入新的自定义分类名称:');
                      if (custom && custom.trim()) {
                        setFormCategory(custom.trim());
                      }
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shrink-0"
                  >
                    + 自定义
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  预设跳转链接 (可选)
                </label>
                <input
                  type="text"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="例如: https://firemaple.com/collections/sale"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  文案备注与适用场景 (可选)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="例如: 适合放置在首焦区或限时抢购板块，紧迫感强"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold shadow-xs"
                >
                  保存文案
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">添加自定义 CTA 分类</h3>
            <p className="text-xs text-slate-500">
              分类用于在 Brief 需求单中按转化场景快速筛选 CTA 按钮。
            </p>
            <input
              type="text"
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="例如: 会员专享 / 问卷调研 / 互动游戏"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-3.5 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold disabled:opacity-50"
              >
                添加分类
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
