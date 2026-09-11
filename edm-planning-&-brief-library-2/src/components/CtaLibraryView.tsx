import React, { useState } from 'react';
import {
  MousePointerClick,
  Plus,
  Search,
  Edit2,
  Trash2,
  FolderPlus,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import { CtaCopy } from '../types';

interface CtaLibraryViewProps {
  ctaCopies: CtaCopy[];
  onSaveCta: (cta: CtaCopy) => Promise<void>;
  onDeleteCta: (id: string) => Promise<void>;
}

export const CtaLibraryView: React.FC<CtaLibraryViewProps> = ({
  ctaCopies,
  onSaveCta,
  onDeleteCta,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCta, setEditingCta] = useState<CtaCopy | null>(null);

  // Form states
  const [category, setCategory] = useState('通用型');
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Inline new category state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Extract all categories
  const categories = Array.from(
    new Set(['通用型', '转化类', '促销类', ...ctaCopies.map((c) => c.category).filter(Boolean)])
  );

  const filtered = ctaCopies.filter((c) => {
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesSearch =
      !searchTerm.trim() ||
      c.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.link && c.link.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingCta(null);
    setCategory(selectedCategory !== 'ALL' ? selectedCategory : '通用型');
    setText('');
    setLink('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cta: CtaCopy) => {
    setEditingCta(cta);
    setCategory(cta.category || '通用型');
    setText(cta.text);
    setLink(cta.link || '');
    setNotes(cta.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const item: CtaCopy = {
      id: editingCta ? editingCta.id : `cta_${Date.now()}`,
      category: category.trim() || '通用型',
      text: text.trim(),
      link: link.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingCta ? editingCta.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onSaveCta(item);
      setIsModalOpen(false);
    } catch (err) {
      alert('保存 CTA 失败: ' + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    setCategory(trimmed);
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 border border-pink-200 flex items-center justify-center">
            <MousePointerClick className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">EDM CTA 文案库</h1>
            <p className="text-xs text-slate-500">
              统一沉淀并分类管理各类 EDM 按钮文案（如通用型、转化类、促销类等），支持在编写 Brief 时一键插入与自定义。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索 CTA 按钮文案..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 w-60 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增 CTA 文案</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              selectedCategory === 'ALL'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            全部文案 ({ctaCopies.length})
          </button>

          {categories.map((cat) => {
            const count = ctaCopies.filter((c) => c.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-28">文案类别</th>
                <th className="py-3 px-4 w-52">CTA 按钮预览</th>
                <th className="py-3 px-4">默认跳转链接 (Link)</th>
                <th className="py-3 px-4">适用场景与备注说明</th>
                <th className="py-3 px-4 text-right w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    暂未找到符合条件的 CTA 文案记录。点击右上角「新增 CTA 文案」即可添加。
                  </td>
                </tr>
              ) : (
                filtered.map((cta) => (
                  <tr key={cta.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                        {cta.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs hover:bg-slate-800 transition select-none">
                        <span>{cta.text}</span>
                        <span>➔</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {cta.link ? (
                        <a
                          href={cta.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span className="truncate max-w-xs">{cta.link}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">按具体排期链接填写</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {cta.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(cta)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          title="编辑"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定要删除 CTA 文案 "${cta.text}" 吗？`)) {
                              onDeleteCta(cta.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit CTA Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {editingCta ? '编辑 CTA 按钮文案' : '新增 CTA 按钮文案'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    文案分类 <span className="text-rose-500">*</span>
                  </label>
                  {!isAddingCategory ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="text-[10px] text-pink-600 hover:underline font-semibold"
                    >
                      + 新建分类
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="text-[10px] text-slate-400 hover:underline"
                    >
                      取消新建
                    </button>
                  )}
                </div>

                {isAddingCategory ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="新分类名称 (如：会员专属)"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="text-xs border border-slate-300 rounded p-1.5 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="bg-pink-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-pink-700"
                    >
                      确定
                    </button>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  按钮文案 (CTA Text) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: SHOP NOW / 立刻探索 / 解锁早鸟优惠"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2 font-bold focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  默认跳转链接 (可选)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2 font-mono focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  适用场景 / 备注建议
                </label>
                <textarea
                  rows={2}
                  placeholder="例如：适合置于首焦大促区或新品卡片底部..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              {/* Preview */}
              {text.trim() && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase">
                    按钮效果预览
                  </span>
                  <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm">
                    <span>{text}</span>
                    <span>➔</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-md shadow disabled:opacity-50 transition"
                >
                  {isSaving ? '保存中...' : '确认保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
