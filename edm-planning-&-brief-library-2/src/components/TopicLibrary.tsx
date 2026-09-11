import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, Upload, X, Tag, FolderPlus, Smile, Check } from 'lucide-react';
import { Topic, Brand, TopicCategory } from '../types';

interface TopicLibraryProps {
  topics: Topic[];
  brands: Brand[];
  selectedBrand: string;
  topicCategories?: TopicCategory[];
  onSaveTopic: (topic: Topic) => Promise<void>;
  onDeleteTopic: (id: string) => Promise<void>;
  onOpenImport: () => void;
  onSaveTopicCategories?: (categories: TopicCategory[]) => Promise<void>;
}

const DEFAULT_CATEGORIES = ['节日活动', '普通'];
const DEFAULT_SYMBOLS: Record<string, string> = {
  '节日活动': '🎉',
  '普通': '✍️', // Default to ✍️ per user requirement
};
const STORAGE_KEY_CATEGORIES = 'edm_custom_topic_categories';
const STORAGE_KEY_SYMBOLS = 'edm_topic_category_symbols';

const QUICK_EMOJIS = ['✍️', '🎉', '🏷️', '🔥', '🎁', '⚡', '🌟', '📢', '💡', '🎯', '🌿', '🏕️', '🍳', '☕', '🚀'];

export const TopicLibrary: React.FC<TopicLibraryProps> = ({
  topics,
  brands,
  selectedBrand,
  topicCategories,
  onSaveTopic,
  onDeleteTopic,
  onOpenImport,
  onSaveTopicCategories,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      const parsed = saved ? JSON.parse(saved) : [];
      const topicCats = topics.map((t) => t.category).filter(Boolean);
      const fromProps = topicCategories ? topicCategories.map((c) => c.name) : [];
      const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...parsed, ...topicCats, ...fromProps]));
      return combined;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  // Category symbols map: { "普通": "✍️", "节日活动": "🎉", ... }
  const [categorySymbols, setCategorySymbols] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SYMBOLS);
      const parsed = saved ? JSON.parse(saved) : {};
      const fromProps: Record<string, string> = {};
      if (topicCategories) {
        topicCategories.forEach((tc) => {
          if (tc.name && tc.symbol) fromProps[tc.name] = tc.symbol;
        });
      }
      return { ...DEFAULT_SYMBOLS, ...parsed, ...fromProps };
    } catch {
      return DEFAULT_SYMBOLS;
    }
  });

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>('');
  const [editingCategorySymbol, setEditingCategorySymbol] = useState<string>('🏷️');

  // New category inline creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySymbol, setNewCategorySymbol] = useState('🏷️');

  // Form fields
  const [brand, setBrand] = useState(brands[0]?.name || 'FireMaple');
  const [category, setCategory] = useState<string>('节日活动');
  const [topicName, setTopicName] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [emailType, setEmailType] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to get category symbol
  const getSymbol = (catName: string) => {
    return categorySymbols[catName] || '🏷️';
  };

  // Synchronize any newly discovered categories from props
  useEffect(() => {
    const topicCats = topics.map((t) => t.category).filter(Boolean);
    const fromProps = topicCategories ? topicCategories.map((c) => c.name) : [];
    setCategories((prev) => {
      const merged = Array.from(new Set([...prev, ...topicCats, ...fromProps]));
      if (merged.length !== prev.length) {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(merged));
        return merged;
      }
      return prev;
    });

    if (topicCategories && topicCategories.length > 0) {
      setCategorySymbols((prev) => {
        const next = { ...prev };
        topicCategories.forEach((tc) => {
          if (tc.name && tc.symbol) next[tc.name] = tc.symbol;
        });
        return next;
      });
    }
  }, [topics, topicCategories]);

  // Save symbols to storage and optional parent sync
  const handleUpdateSymbol = (catName: string, newSymbol: string) => {
    const updated = { ...categorySymbols, [catName]: newSymbol.trim() || '🏷️' };
    setCategorySymbols(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SYMBOLS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    if (onSaveTopicCategories) {
      const catsList: TopicCategory[] = categories.map((c) => ({
        id: `cat_${c}`,
        name: c,
        symbol: updated[c] || '🏷️',
      }));
      onSaveTopicCategories(catsList);
    }
  };

  const handleSaveEditedCategory = () => {
    if (!editingCategory || !editingCategoryName.trim()) return;
    const oldName = editingCategory;
    const newName = editingCategoryName.trim();
    const newSymbol = editingCategorySymbol.trim() || '🏷️';

    const updatedSymbols = { ...categorySymbols, [newName]: newSymbol };
    if (oldName !== newName) {
      delete updatedSymbols[oldName];
    }
    setCategorySymbols(updatedSymbols);

    let updatedCats = categories;
    if (oldName !== newName) {
      updatedCats = categories.map((c) => (c === oldName ? newName : c));
      setCategories(updatedCats);
      if (categoryFilter === oldName) setCategoryFilter(newName);
    }

    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updatedCats));
      localStorage.setItem(STORAGE_KEY_SYMBOLS, JSON.stringify(updatedSymbols));
    } catch (e) {
      console.error(e);
    }

    if (onSaveTopicCategories) {
      const catsList: TopicCategory[] = updatedCats.map((c) => ({
        id: `cat_${c}`,
        name: c,
        symbol: updatedSymbols[c] || '🏷️',
      }));
      onSaveTopicCategories(catsList);
    }

    setEditingCategory(null);
  };

  const handleCreateCategory = (nameToCreate?: string, symbolToCreate?: string) => {
    const targetName = (nameToCreate || newCategoryName).trim();
    if (!targetName) return;
    if (categories.includes(targetName)) {
      alert(`类别 "${targetName}" 已经存在。`);
      return;
    }

    const updatedCats = [...categories, targetName];
    setCategories(updatedCats);

    const symb = symbolToCreate || newCategorySymbol || '🏷️';
    const updatedSymbs = { ...categorySymbols, [targetName]: symb };
    setCategorySymbols(updatedSymbs);

    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updatedCats));
      localStorage.setItem(STORAGE_KEY_SYMBOLS, JSON.stringify(updatedSymbs));
    } catch (e) {
      console.error(e);
    }

    if (onSaveTopicCategories) {
      const catsList: TopicCategory[] = updatedCats.map((c) => ({
        id: `cat_${c}`,
        name: c,
        symbol: updatedSymbs[c] || '🏷️',
      }));
      onSaveTopicCategories(catsList);
    }

    setNewCategoryName('');
    setIsAddingCategory(false);
    setCategory(targetName);
  };

  const handleDeleteCategory = (catToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (DEFAULT_CATEGORIES.includes(catToDelete)) {
      alert('系统内置类别不可删除。');
      return;
    }
    const inUseCount = topics.filter((t) => t.category === catToDelete).length;
    if (
      inUseCount > 0 &&
      !confirm(`当前有 ${inUseCount} 个主题属于类别 "${catToDelete}"，删除类别后这些主题仍会保留。确定删除此类别吗？`)
    ) {
      return;
    }

    const updated = categories.filter((c) => c !== catToDelete);
    setCategories(updated);
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (categoryFilter === catToDelete) {
      setCategoryFilter('ALL');
    }
  };

  const filteredTopics = topics.filter((t) => {
    const matchesBrand = selectedBrand === 'ALL' || t.brand.toLowerCase() === selectedBrand.toLowerCase();
    const topicCategory = t.category || '普通';
    const matchesCategory = categoryFilter === 'ALL' || topicCategory === categoryFilter;
    const matchesSearch = searchTerm
      ? t.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.subtopic && t.subtopic.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.emailType && t.emailType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    return matchesBrand && matchesCategory && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingTopic(null);
    setBrand(selectedBrand !== 'ALL' ? selectedBrand : brands[0]?.name || 'FireMaple');
    setCategory(categoryFilter !== 'ALL' ? categoryFilter : categories[0] || '节日活动');
    setTopicName('');
    setSubtopic('');
    setEmailType('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Topic) => {
    setEditingTopic(t);
    setBrand(t.brand);
    setCategory(t.category || '普通');
    setTopicName(t.topic);
    setSubtopic(t.subtopic || '');
    setEmailType(t.emailType || '');
    setNotes(t.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;

    const topicItem: Topic = {
      id: editingTopic ? editingTopic.id : `topic_${Date.now()}`,
      brand,
      category: category.trim() || '普通',
      topic: topicName.trim(),
      subtopic: subtopic.trim(),
      emailType: emailType.trim(),
      notes: notes.trim(),
      createdAt: editingTopic ? editingTopic.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onSaveTopic(topicItem);
      setIsModalOpen(false);
    } catch (err) {
      alert('保存主题出错: ' + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">EDM 主题库</h1>
            <p className="text-xs text-slate-500">
              集中管理各品牌的邮件选题、节日活动与日常主题，支持自定义编辑各主题类别的标签符号。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索主题、子标题或备注..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>导入 Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增主题</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Add Category Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* ALL tab */}
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              categoryFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            全部主题 ({topics.length})
          </button>

          {/* Dynamic Category Tabs */}
          {categories.map((cat) => {
            const isDefault = DEFAULT_CATEGORIES.includes(cat);
            const count = topics.filter((t) => (t.category || '普通') === cat).length;
            const isSelected = categoryFilter === cat;

            return (
              <div key={cat} className="relative group inline-flex items-center">
                <button
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    isSelected
                      ? cat === '节日活动'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>

                {/* Edit category & symbol button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(cat);
                    setEditingCategoryName(cat);
                    setEditingCategorySymbol(getSymbol(cat));
                  }}
                  title={`编辑「${cat}」类别及标签符号`}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 rounded transition"
                >
                  <Edit2 className="w-3 h-3" />
                </button>

                {/* Delete button for custom categories */}
                {!isDefault && (
                  <button
                    onClick={(e) => handleDeleteCategory(cat, e)}
                    title={`删除类别「${cat}」`}
                    className="ml-0.5 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add Category Button / Inline Form */}
          {isAddingCategory ? (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-300 animate-fade-in">
              <input
                type="text"
                value={newCategorySymbol}
                onChange={(e) => setNewCategorySymbol(e.target.value)}
                placeholder="符号"
                className="text-xs px-1.5 py-1 bg-white border border-slate-300 rounded focus:outline-none w-10 text-center"
                title="类别符号/图标"
              />
              <input
                type="text"
                autoFocus
                placeholder="新类别名称..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateCategory();
                  if (e.key === 'Escape') setIsAddingCategory(false);
                }}
                className="text-xs px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 w-28"
              />
              <button
                type="button"
                onClick={() => handleCreateCategory()}
                className="bg-indigo-600 text-white text-[11px] font-semibold px-2 py-1 rounded hover:bg-indigo-700 transition"
              >
                添加
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingCategory(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100/80 rounded-lg transition border border-dashed border-indigo-300"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ 新增类别</span>
            </button>
          )}
        </div>

      </div>

      {/* Topics Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-32">类别 (自定义标签)</th>
                <th className="py-3 px-4 w-28">品牌</th>
                <th className="py-3 px-4">主标题</th>
                <th className="py-3 px-4">对应子标题</th>
                <th className="py-3 px-4 w-32">邮件类型</th>
                <th className="py-3 px-4">备注说明</th>
                <th className="py-3 px-4 text-right w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTopics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    暂未找到符合条件的主题记录。
                  </td>
                </tr>
              ) : (
                filteredTopics.map((t) => {
                  const cat = t.category || '普通';
                  const symbol = getSymbol(cat);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          <span>{symbol}</span>
                          <span>{cat}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                          {t.brand}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{t.topic}</td>
                      <td className="py-3 px-4 text-slate-700">{t.subtopic || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{t.emailType || '—'}</td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{t.notes || '—'}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="编辑"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`确定要删除主题 "${t.topic}" 吗？`)) onDeleteTopic(t.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Topic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {editingTopic ? '编辑主题' : '新增主题'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">所属品牌</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      主题类别 <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newCat = prompt('请输入新类别名称：');
                        if (newCat && newCat.trim()) {
                          handleCreateCategory(newCat.trim());
                        }
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-semibold"
                    >
                      + 新类别
                    </button>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  主标题 (Topic) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: 暖冬露营装备选购指南"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  对应副标题 (Subtopic)
                </label>
                <input
                  type="text"
                  placeholder="例如: 从帐篷到炊具，一站式保暖方案推荐"
                  value={subtopic}
                  onChange={(e) => setSubtopic(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  邮件类型 (Email Type)
                </label>
                <input
                  type="text"
                  placeholder="例如: 新品上市 / 促销活动 / 内容科普"
                  value={emailType}
                  onChange={(e) => setEmailType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">备注说明</label>
                <textarea
                  rows={3}
                  placeholder="可记录往期效果、推荐主推款或营销点子..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

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
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow disabled:opacity-50 transition"
                >
                  {isSaving ? '保存中...' : '确认保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY & SYMBOL MODAL */}
      {editingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setEditingCategory(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold">编辑类别与标签符号</h2>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  类别名称
                </label>
                <input
                  type="text"
                  value={editingCategoryName}
                  disabled={DEFAULT_CATEGORIES.includes(editingCategory)}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
                {DEFAULT_CATEGORIES.includes(editingCategory) && (
                  <p className="text-[11px] text-slate-400 mt-1">系统内置大类名称不可更改，但可自定义其标签符号。</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  标签符号 (Emoji / 标记)
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl bg-slate-100 border border-slate-300 w-10 h-10 rounded-lg flex items-center justify-center shadow-xs shrink-0">
                    {editingCategorySymbol || '🏷️'}
                  </span>
                  <input
                    type="text"
                    value={editingCategorySymbol}
                    onChange={(e) => setEditingCategorySymbol(e.target.value)}
                    placeholder="输入或选择符号"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                  快捷常用符号点击选择:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditingCategorySymbol(emoji)}
                      className={`px-2.5 py-1.5 text-base rounded cursor-pointer border transition hover:scale-110 ${
                        editingCategorySymbol === emoji
                          ? 'bg-indigo-100 border-indigo-400 text-indigo-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveEditedCategory}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
              >
                保存类别与符号
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
