import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  LayoutTemplate,
  ExternalLink,
  X,
  Image as ImageIcon,
  Upload,
  FolderPlus,
  Settings2,
  Maximize2,
  Check,
  AlertCircle,
  FileImage,
} from 'lucide-react';
import { Template, DisplayTypeConfig } from '../types';
import { compressImageFile } from '../utils/imageCompress';

interface TemplateLibraryProps {
  templates: Template[];
  onSaveTemplate: (template: Template) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  displayTypes?: DisplayTypeConfig;
}

const DEFAULT_CATEGORIES = [
  'Hero (首焦区)',
  'Product Launch (新品发布)',
  'Promotion (促销活动)',
  'Section (常规板块)',
  'Recipe (食谱/场景)',
  'Educational (科普指南)',
  'UGC (用户口碑)',
  'Storytelling (品牌故事)',
  'Footer (页尾)',
  'Other (其他)',
];

const STORAGE_KEY_CATEGORIES = 'edm_template_custom_categories_v2';

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  displayTypes,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Categories State
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return Array.from(new Set([
      ...DEFAULT_CATEGORIES,
      ...(displayTypes?.heroTypes || []),
      ...(displayTypes?.bodyTypes || []),
    ]));
  });

  // Sync any categories that exist in loaded templates into our categories list
  useEffect(() => {
    const templateCats = templates.map((t) => t.category).filter(Boolean);
    const combined = Array.from(new Set([
      ...categories,
      ...templateCats,
      ...(displayTypes?.heroTypes || []),
      ...(displayTypes?.bodyTypes || []),
    ]));
    if (combined.length !== categories.length) {
      setCategories(combined);
      try {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(combined));
      } catch {
        // ignore
      }
    }
  }, [templates, categories, displayTypes]);

  // Save categories to localStorage
  const saveCategoriesToStorage = (newCats: string[]) => {
    setCategories(newCats);
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(newCats));
    } catch {
      // ignore
    }
  };

  // Add / Edit Template Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form Fields
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('Hero (首焦区)');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Quick inline add category state in modal
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [newInlineCategoryName, setNewInlineCategoryName] = useState('');

  // Category Manager Modal State
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Image Lightbox State
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Hidden quick file input ref
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesCategory =
      categoryFilter === 'ALL' ||
      t.category === categoryFilter ||
      (categoryFilter.startsWith(t.category) || t.category.startsWith(categoryFilter.split(' ')[0]));

    const matchesSearch = searchTerm
      ? t.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;

    return matchesCategory && matchesSearch;
  });

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setCategory(categoryFilter !== 'ALL' ? categoryFilter : (categories[0] || 'Hero (首焦区)'));
    setScreenshotUrl('');
    setReferenceUrl('');
    setTagsInput('');
    setNotes('');
    setIsAddingCategoryInline(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (t: Template) => {
    setEditingTemplate(t);
    setTemplateName(t.templateName);
    setCategory(t.category || categories[0] || 'Hero (首焦区)');
    setScreenshotUrl(t.screenshotUrl || '');
    setReferenceUrl(t.referenceUrl || '');
    setTagsInput((t.tags || []).join(', '));
    setNotes(t.notes || '');
    setIsAddingCategoryInline(false);
    setIsModalOpen(true);
  };

  // Process and compress image file
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择有效的图片文件 (PNG, JPG, WebP 等)');
      return;
    }
    setIsUploading(true);
    try {
      // Compress with 800px max width and 1200px max height for crisp email layout preview
      const dataUri = await compressImageFile(file, 800, 1200, 0.78);
      setScreenshotUrl(dataUri);
    } catch (err) {
      alert('处理图片失败: ' + String(err));
    } finally {
      setIsUploading(false);
    }
  };

  // Quick direct image upload handler from header button
  const handleQuickImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Derive a clean template name from the image file name (strip extension and replace underscores)
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
    const formattedName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

    setIsUploading(true);
    try {
      const dataUri = await compressImageFile(file, 800, 1200, 0.78);
      setEditingTemplate(null);
      setTemplateName(formattedName);
      setCategory(categoryFilter !== 'ALL' ? categoryFilter : (categories[0] || 'Hero (首焦区)'));
      setScreenshotUrl(dataUri);
      setReferenceUrl('');
      setTagsInput('');
      setNotes('');
      setIsModalOpen(true);
    } catch (err) {
      alert('图片上传处理失败: ' + String(err));
    } finally {
      setIsUploading(false);
      if (quickFileInputRef.current) {
        quickFileInputRef.current.value = '';
      }
    }
  };

  // Drag and Drop within modal
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Paste from clipboard listener inside modal
  useEffect(() => {
    if (!isModalOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isModalOpen]);

  // Handle Add Category Inline in modal
  const handleAddInlineCategory = () => {
    const trimmed = newInlineCategoryName.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      const updated = [...categories, trimmed];
      saveCategoriesToStorage(updated);
    }
    setCategory(trimmed);
    setNewInlineCategoryName('');
    setIsAddingCategoryInline(false);
  };

  // Save Template
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      alert('请填写模板名称');
      return;
    }

    const tags = tagsInput
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const templateItem: Template = {
      id: editingTemplate ? editingTemplate.id : `tpl_${Date.now()}`,
      templateName: templateName.trim(),
      mainCategory: category.trim() || editingTemplate?.mainCategory || 'HERO',
      category: category.trim() || 'Hero (首焦区)',
      screenshotUrl: screenshotUrl.trim(),
      referenceUrl: referenceUrl.trim(),
      description: notes.trim(),
      tags,
      notes: notes.trim(),
      createdAt: editingTemplate ? editingTemplate.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onSaveTemplate(templateItem);
      setIsModalOpen(false);
    } catch (err) {
      alert('保存模板出错: ' + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Category Management Handlers
  const handleAddCategoryFromManager = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      alert('该分类已存在');
      return;
    }
    const updated = [...categories, trimmed];
    saveCategoriesToStorage(updated);
    setNewCategoryInput('');
  };

  const handleSaveEditCategory = async (oldName: string) => {
    const trimmed = editingCatName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCatIndex(null);
      return;
    }

    // Check if new name exists
    if (categories.includes(trimmed) && trimmed !== oldName) {
      alert('该分类名称已存在');
      return;
    }

    // Update categories list
    const updatedCats = categories.map((c) => (c === oldName ? trimmed : c));
    saveCategoriesToStorage(updatedCats);

    // Update templates using old category
    const templatesToUpdate = templates.filter((t) => t.category === oldName);
    if (templatesToUpdate.length > 0) {
      const shouldUpdate = confirm(
        `已有 ${templatesToUpdate.length} 个模板正在使用分类「${oldName}」，是否同步更新为「${trimmed}」？`
      );
      if (shouldUpdate) {
        for (const t of templatesToUpdate) {
          await onSaveTemplate({
            ...t,
            category: trimmed,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    setEditingCatIndex(null);
    setEditingCatName('');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const count = templates.filter((t) => t.category === catToDelete).length;
    if (count > 0) {
      if (!confirm(`分类「${catToDelete}」下有 ${count} 个模板，确定要删除此分类吗？`)) {
        return;
      }
    }
    const updated = categories.filter((c) => c !== catToDelete);
    saveCategoriesToStorage(updated);
    if (categoryFilter === catToDelete) {
      setCategoryFilter('ALL');
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input for Quick Upload */}
      <input
        type="file"
        ref={quickFileInputRef}
        accept="image/*"
        onChange={handleQuickImageSelect}
        className="hidden"
      />

      {/* Header & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
            <LayoutTemplate className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">模板参考库 (Reference Template Library)</h1>
            <p className="text-xs text-slate-500">
              用于各 EDM 板块（首焦 Hero、产品特写、促销活动、科普、页尾等）的视觉排版参考，支持图片上传及自定义分类。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索模板名称、标签或备注..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 w-56 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Manage Categories Button */}
          <button
            onClick={() => setIsCatManagerOpen(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition"
            title="新增或编辑模板分类"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>分类管理</span>
          </button>

          {/* Quick Image Upload Button */}
          <button
            onClick={() => quickFileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs"
            title="直接选择图片上传新建模板"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>上传图片新增模板</span>
          </button>

          {/* Add Template Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增模板</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3 py-1 rounded-full font-medium transition shrink-0 ${
            categoryFilter === 'ALL'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          全部 ({templates.length})
        </button>

        {categories.map((cat) => {
          const count = templates.filter(
            (t) =>
              t.category === cat ||
              (t.category && cat.startsWith(t.category)) ||
              (t.category && t.category.startsWith(cat.split(' ')[0]))
          ).length;

          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full font-medium transition shrink-0 flex items-center gap-1.5 ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  categoryFilter === cat ? 'bg-purple-700 text-purple-100' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setIsCatManagerOpen(true)}
          className="text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-1 flex items-center gap-1 shrink-0 ml-1"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>+ 新增/编辑分类</span>
        </button>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200 space-y-3">
            <LayoutTemplate className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
            <div className="text-sm font-medium text-slate-600">未找到符合条件的模板</div>
            <p className="text-xs text-slate-400">可以点击上方“新增模板”或“上传图片新增模板”添加参考设计</p>
          </div>
        ) : (
          filteredTemplates.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition group"
            >
              <div>
                {/* Screenshot Preview */}
                <div
                  onClick={() => {
                    if (t.screenshotUrl) {
                      setPreviewImage({ url: t.screenshotUrl, title: t.templateName });
                    }
                  }}
                  className={`h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100 ${
                    t.screenshotUrl ? 'cursor-pointer' : ''
                  }`}
                  title={t.screenshotUrl ? '点击查看大图' : ''}
                >
                  {t.screenshotUrl ? (
                    <>
                      <img
                        src={t.screenshotUrl}
                        alt={t.templateName}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 text-white text-xs font-medium">
                        <Maximize2 className="w-4 h-4" />
                        <span>查看大图</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 text-slate-400 flex flex-col items-center gap-1">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-[11px]">暂无预览截图</span>
                    </div>
                  )}

                  <span className="absolute top-2 left-2 text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded shadow-xs">
                    {t.category}
                  </span>
                </div>

                {/* Body Details */}
                <div className="p-3.5 space-y-2">
                  <h3 className="font-bold text-xs text-slate-900 leading-snug">{t.templateName}</h3>

                  {t.notes && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {t.notes}
                    </p>
                  )}

                  {/* Tags */}
                  {t.tags && t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {t.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                {t.referenceUrl ? (
                  <a
                    href={t.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:underline flex items-center gap-1 text-[11px] font-medium"
                  >
                    <span>参考外链</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">无外链</span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="text-slate-500 hover:text-slate-900 text-xs font-medium"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确认删除模板「${t.templateName}」？`)) onDeleteTemplate(t.id);
                    }}
                    className="text-rose-500 hover:text-rose-700 text-xs font-medium"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {editingTemplate ? '编辑参考模板' : '新增参考模板'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Template Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  模板名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：Hero - 双列大标题+促销倒计时"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Category Selection + Inline Category Addition */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">模板分类</label>
                  {!isAddingCategoryInline ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategoryInline(true)}
                      className="text-[11px] text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>新建分类</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategoryInline(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      取消新建
                    </button>
                  )}
                </div>

                {!isAddingCategoryInline ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="输入新分类名称..."
                      value={newInlineCategoryName}
                      onChange={(e) => setNewInlineCategoryName(e.target.value)}
                      className="flex-1 text-xs border border-purple-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddInlineCategory}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-md transition"
                    >
                      添加并选定
                    </button>
                  </div>
                )}
              </div>

              {/* Image Upload Area (Supports Drag & Drop, File Picker, Clipboard Paste) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  模板图片 / 截图 <span className="text-slate-400 font-normal">(支持拖拽、点击上传或 Ctrl+V 粘贴图片)</span>
                </label>

                {screenshotUrl ? (
                  <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={screenshotUrl}
                        alt="Template Preview"
                        className="w-16 h-20 object-cover rounded border border-slate-300 bg-white"
                      />
                      <div className="text-xs space-y-1">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>已就绪图片模板</span>
                        </div>
                        <p className="text-[11px] text-slate-500">已完成高清自动压缩，可直接保存至数据库</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-purple-700 hover:text-purple-900 bg-white border border-purple-200 hover:bg-purple-50 px-2.5 py-1 rounded cursor-pointer transition text-center">
                        <span>更换图片</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) processImageFile(file);
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setScreenshotUrl('')}
                        className="text-xs text-rose-600 hover:text-rose-800 px-2 py-0.5"
                      >
                        移除图片
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-5 text-center transition ${
                      isDragging
                        ? 'border-purple-500 bg-purple-50/50'
                        : 'border-slate-300 hover:border-purple-400 bg-slate-50/40'
                    }`}
                  >
                    <FileImage className="w-8 h-8 mx-auto text-slate-400 mb-1.5" />
                    <p className="text-xs font-semibold text-slate-700">
                      拖拽模板图片至此处，或{' '}
                      <label className="text-purple-600 hover:underline cursor-pointer font-bold">
                        <span>点击选择文件</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) processImageFile(file);
                          }}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      支持 PNG, JPG, WebP 格式；亦可直接在当前弹窗中按下 Ctrl+V 粘贴截图
                    </p>
                    {isUploading && (
                      <p className="text-xs text-purple-600 font-medium mt-2 animate-pulse">正在压缩处理图片...</p>
                    )}
                  </div>
                )}

                {/* Optional external URL fallback */}
                <details className="text-[11px] text-slate-500 pt-1">
                  <summary className="cursor-pointer hover:text-slate-800">使用外部图片 URL (可选)</summary>
                  <input
                    type="text"
                    placeholder="粘贴外部图片网络链接 (https://...)"
                    value={screenshotUrl.startsWith('data:') ? '' : screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white font-mono mt-1.5"
                  />
                </details>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">标签 (以逗号分隔)</label>
                <input
                  type="text"
                  placeholder="例如：极简, 促销, 黑五, 双列, 暖色调"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* External Reference URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  外部参考链接 (例如 ReallyGoodEmails 案例链接)
                </label>
                <input
                  type="url"
                  placeholder="https://reallygoodemails.com/..."
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                />
              </div>

              {/* Design Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">设计建议与执行说明</label>
                <textarea
                  rows={2}
                  placeholder="建议排版形式、推荐图片比例、视觉氛围、配色注意事项..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? '保存中...' : editingTemplate ? '更新模板' : '创建模板'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {isCatManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold">分类管理 (编辑 / 新增分类)</h3>
              </div>
              <button
                onClick={() => {
                  setIsCatManagerOpen(false);
                  setEditingCatIndex(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Add New Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  新增模板分类
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="输入新分类名称 (如：会员关怀, 弃购挽回...)"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategoryFromManager();
                      }
                    }}
                    className="flex-1 text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategoryFromManager}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-md transition"
                  >
                    新增
                  </button>
                </div>
              </div>

              {/* Category List */}
              <div className="space-y-1 pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  现有分类列表 ({categories.length})
                </label>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {categories.map((cat, idx) => {
                    const isEditing = editingCatIndex === idx;
                    const templateCount = templates.filter((t) => t.category === cat).length;

                    return (
                      <div
                        key={idx}
                        className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="flex-1 text-xs border border-purple-400 rounded px-2 py-1 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEditCategory(cat)}
                              className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingCatIndex(null)}
                              className="text-xs text-slate-500 hover:text-slate-800"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{cat}</span>
                              <span className="text-[10px] text-slate-400">
                                ({templateCount} 个模板)
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingCatIndex(idx);
                                  setEditingCatName(cat);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                                title="重命名分类"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                title="删除分类"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCatManagerOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-md hover:bg-slate-700 transition"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Viewer Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-700"
          >
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-semibold text-xs">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto p-4 flex items-center justify-center bg-slate-950/20">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[78vh] object-contain rounded shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
