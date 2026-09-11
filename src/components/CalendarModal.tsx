import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Search, Plus, Trash2, Upload, Calendar as CalendarIcon, Check } from 'lucide-react';
import { CalendarItem, Brand, Topic, Product, EDMFormat, EDMStatus, TopicCategory } from '../types';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: CalendarItem, saveNewTopic?: { brand: string; topic: string; category: string; subtopic: string; emailType: string }) => Promise<void>;
  onSaveBatch?: (items: CalendarItem[]) => Promise<void>;
  onOpenExcelImport?: () => void;
  itemToEdit?: CalendarItem | null;
  initialDate?: string;
  initialTab?: 'single' | 'batch';
  brands: Brand[];
  topics: Topic[];
  products: Product[];
  formats: EDMFormat[];
  topicCategories?: TopicCategory[];
  existingCalendarItems: CalendarItem[];
}

interface BatchRow {
  id: string;
  date: string;
  brand: string;
  topic: string;
  subtopic: string;
  format: string;
  selectedProductIds: string[];
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveBatch,
  onOpenExcelImport,
  itemToEdit,
  initialDate,
  initialTab = 'single',
  brands,
  topics,
  products,
  formats,
  topicCategories = [],
  existingCalendarItems,
}) => {
  const [modalTab, setModalTab] = useState<'single' | 'batch'>(initialTab);

  // Single form states
  const [brand, setBrand] = useState(brands[0]?.name || 'FireMaple');
  const [date, setDate] = useState(initialDate || new Date().toISOString().slice(0, 10));
  const [topicMode, setTopicMode] = useState<'select' | 'new'>('select');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [topicCategoryFilter, setTopicCategoryFilter] = useState<string>('ALL');
  const [customCategory, setCustomCategory] = useState('节日活动');
  const [customTopic, setCustomTopic] = useState('');
  const [customSubtopic, setCustomSubtopic] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [emailType, setEmailType] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  // Format is NOT required per requirement
  const [format, setFormat] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<EDMStatus>('Planned');
  const [productSearch, setProductSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Batch form states
  const [batchRows, setBatchRows] = useState<BatchRow[]>([
    {
      id: 'batch_1',
      date: initialDate || new Date().toISOString().slice(0, 10),
      brand: brands[0]?.name || 'FireMaple',
      topic: '',
      subtopic: '',
      format: '',
      selectedProductIds: [],
    },
    {
      id: 'batch_2',
      date: initialDate || new Date().toISOString().slice(0, 10),
      brand: brands[1]?.name || brands[0]?.name || 'FireMaple',
      topic: '',
      subtopic: '',
      format: '',
      selectedProductIds: [],
    },
  ]);

  // Pre-fill on open or edit
  useEffect(() => {
    if (itemToEdit) {
      setModalTab('single');
      setBrand(itemToEdit.brand);
      setDate(itemToEdit.date);
      setTopicMode('select');
      setSelectedTopicId(itemToEdit.topicId || '');
      setCustomTopic(itemToEdit.topic);
      setCustomSubtopic(itemToEdit.subtopic || '');
      setCustomCategory(itemToEdit.topicCategory || '普通');
      setEmailType(itemToEdit.emailType || '');
      setSelectedProductIds(itemToEdit.productIds || []);
      setFormat(itemToEdit.format || '');
      setNotes(itemToEdit.notes || '');
      setStatus(itemToEdit.status);
    } else {
      setModalTab(initialTab);
      setBrand(brands[0]?.name || 'FireMaple');
      setDate(initialDate || new Date().toISOString().slice(0, 10));
      setTopicMode('select');
      setSelectedTopicId('');
      setCustomTopic('');
      setCustomSubtopic('');
      setCustomCategory(topicCategories[0]?.name || '普通');
      setSaveToLibrary(false);
      setEmailType('');
      setSelectedProductIds([]);
      setFormat('');
      setNotes('');
      setStatus('Planned');
    }
    setErrorMessage('');
    setProductSearch('');
  }, [itemToEdit, initialDate, isOpen, brands, formats]);

  if (!isOpen) return null;

  // Filter topics and products by brand
  const brandTopics = topics.filter((t) => t.brand.toLowerCase() === brand.toLowerCase());
  const distinctCategories = Array.from(
    new Set([
      ...topicCategories.map((c) => c.name),
      ...brandTopics.map((t) => t.category).filter(Boolean),
      '普通',
      '节日活动',
    ])
  );
  const customBrandCategories = distinctCategories.filter(
    (c) => c !== '普通' && c !== '节日活动'
  );
  const filteredBrandTopics =
    topicCategoryFilter === 'ALL'
      ? brandTopics
      : brandTopics.filter((t) => (t.category || '普通') === topicCategoryFilter);

  const brandProducts = products.filter(
    (p) =>
      p.brand.toLowerCase() === brand.toLowerCase() &&
      (!productSearch || p.productName.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // Check unique rule: One brand can have ONLY ONE EDM per day
  const isDuplicateDate = existingCalendarItems.some(
    (item) =>
      item.brand.toLowerCase() === brand.toLowerCase() &&
      item.date === date &&
      (!itemToEdit || item.id !== itemToEdit.id)
  );

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopicId(topicId);
    const found = topics.find((t) => t.id === topicId);
    if (found) {
      setCustomTopic(found.topic);
      setCustomSubtopic(found.subtopic || '');
      setCustomCategory(found.category || '普通');
      setEmailType(found.emailType || '');
    }
  };

  const toggleProduct = (prodId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  // Submit Single Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!brand) {
      setErrorMessage('请选择所属品牌。');
      return;
    }
    if (!date) {
      setErrorMessage('请选择发送排期日期。');
      return;
    }
    if (isDuplicateDate) {
      setErrorMessage(`排期冲突：品牌 "${brand}" 在 ${date} 已有排期的 EDM。规则规定同一品牌每天仅可排发 1 封邮件。`);
      return;
    }

    const selectedObj = topics.find((t) => t.id === selectedTopicId);
    const finalTopicTitle = topicMode === 'select'
      ? selectedObj?.topic || customTopic
      : customTopic;
    const finalSubtopic = topicMode === 'select'
      ? selectedObj?.subtopic || customSubtopic
      : customSubtopic;
    const finalCategory = topicMode === 'select'
      ? selectedObj?.category || customCategory
      : customCategory;

    if (!finalTopicTitle.trim()) {
      setErrorMessage('请选择或输入邮件主题。');
      return;
    }

    // Resolve product names
    const resolvedProductNames = selectedProductIds
      .map((id) => products.find((p) => p.id === id)?.productName)
      .filter((n): n is string => Boolean(n));

    const id = itemToEdit ? itemToEdit.id : `${brand.toLowerCase()}_${date}`;

    const calendarItem: CalendarItem = {
      id,
      brand,
      date,
      topic: finalTopicTitle.trim(),
      subtopic: finalSubtopic.trim(),
      topicCategory: finalCategory,
      topicId: topicMode === 'select' ? selectedTopicId : undefined,
      emailType,
      productIds: selectedProductIds,
      productNames: resolvedProductNames,
      format: format ? format.trim() : undefined, // optional
      notes,
      status,
      hasBrief: itemToEdit ? itemToEdit.hasBrief : false,
      briefId: itemToEdit ? itemToEdit.briefId : undefined,
      createdAt: itemToEdit ? itemToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      let newTopicToSave: { brand: string; topic: string; category: string; subtopic: string; emailType: string } | undefined;
      if (topicMode === 'new' && saveToLibrary && finalTopicTitle.trim()) {
        newTopicToSave = {
          brand,
          topic: finalTopicTitle.trim(),
          category: customCategory,
          subtopic: customSubtopic.trim(),
          emailType,
        };
      }
      await onSave(calendarItem, newTopicToSave);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存排期记录出错。';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Batch row handlers
  const handleAddBatchRow = () => {
    const lastRow = batchRows[batchRows.length - 1];
    let nextDate = lastRow ? lastRow.date : new Date().toISOString().slice(0, 10);
    try {
      const d = new Date(nextDate);
      d.setDate(d.getDate() + 2);
      nextDate = d.toISOString().slice(0, 10);
    } catch {
      // keep current
    }

    setBatchRows((prev) => [
      ...prev,
      {
        id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: nextDate,
        brand: lastRow ? lastRow.brand : brands[0]?.name || 'FireMaple',
        topic: '',
        subtopic: '',
        format: '',
        selectedProductIds: [],
      },
    ]);
  };

  const handleUpdateBatchRow = (rowId: string, updates: Partial<BatchRow>) => {
    setBatchRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...updates } : r))
    );
  };

  const handleRemoveBatchRow = (rowId: string) => {
    if (batchRows.length <= 1) return;
    setBatchRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Check validity
    const validRows = batchRows.filter((r) => r.topic.trim() && r.date);
    if (validRows.length === 0) {
      setErrorMessage('请至少完整填写一行的日期与主题。');
      return;
    }

    // Check internal conflict
    const pairKeys = new Set<string>();
    for (const r of validRows) {
      const key = `${r.brand.toLowerCase()}_${r.date}`;
      if (pairKeys.has(key)) {
        setErrorMessage(`批量添加中存在同一品牌同日期的冲突: ${r.brand} 在 ${r.date} 出现了多次。`);
        return;
      }
      pairKeys.add(key);

      // Check external conflict with existing
      const conflict = existingCalendarItems.some(
        (ex) => ex.brand.toLowerCase() === r.brand.toLowerCase() && ex.date === r.date
      );
      if (conflict) {
        setErrorMessage(`排期冲突：系统已存在 ${r.brand} 在 ${r.date} 的排期记录。同一品牌每天仅可排 1 封。`);
        return;
      }
    }

    const itemsToSave: CalendarItem[] = validRows.map((r) => {
      const prodNames = r.selectedProductIds
        .map((pid) => products.find((p) => p.id === pid)?.productName)
        .filter((n): n is string => Boolean(n));

      return {
        id: `${r.brand.toLowerCase()}_${r.date}`,
        brand: r.brand,
        date: r.date,
        topic: r.topic.trim(),
        subtopic: r.subtopic.trim(),
        productIds: r.selectedProductIds,
        productNames: prodNames,
        format: r.format ? r.format.trim() : undefined,
        status: 'Planned',
        hasBrief: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    setIsSaving(true);
    try {
      if (onSaveBatch) {
        await onSaveBatch(itemsToSave);
      } else {
        for (const item of itemsToSave) {
          await onSave(item);
        }
      }
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '批量保存失败。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className={`bg-white rounded-xl shadow-2xl border border-slate-200 w-full ${
        modalTab === 'batch' ? 'max-w-5xl' : 'max-w-2xl'
      } overflow-hidden my-8 transition-all`}>
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold">
                {itemToEdit ? '编辑 EDM 排期' : '新建 EDM 排期'}
              </h2>
              {!itemToEdit && (
                <div className="flex bg-slate-800 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setModalTab('single')}
                    className={`px-3 py-1 rounded-md transition ${
                      modalTab === 'single'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    单条排期
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('batch')}
                    className={`px-3 py-1 rounded-md transition ${
                      modalTab === 'batch'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    批量快速排期 (一键新增多条)
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              同一品牌每天仅限排期 1 封邮件，形式为可选填项。支持批量一键新增或 Excel 导入。
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenExcelImport && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExcelImport();
                }}
                className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>从 Excel 导入</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: SINGLE EDM ENTRY */}
        {modalTab === 'single' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Row 1: Brand & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  所属品牌 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  disabled={Boolean(itemToEdit)}
                  className="w-full text-sm border border-slate-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  排期日期 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2: Topic Selection / Custom Input */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  邮件主题 (Topic) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTopicMode('select')}
                    className={`px-2.5 py-1 rounded transition ${
                      topicMode === 'select'
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    从选题库选择
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicMode('new')}
                    className={`px-2.5 py-1 rounded transition ${
                      topicMode === 'new'
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    自定义临时主题
                  </button>
                </div>
              </div>

              {topicMode === 'select' ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Step 1: 先选大类 */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        第一步：先选主题大类
                      </label>
                      <select
                        value={topicCategoryFilter}
                        onChange={(e) => {
                          setTopicCategoryFilter(e.target.value);
                          setSelectedTopicId('');
                        }}
                        className="w-full text-xs font-medium border border-slate-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="ALL">全部大类 ({brandTopics.length})</option>
                        {distinctCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat} ({brandTopics.filter((t) => (t.category || '普通') === cat).length})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Step 2: 再选具体邮件主题 */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        第二步：选择具体邮件主题 <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedTopicId}
                        onChange={(e) => handleTopicSelect(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">-- 请选择 {brand} 品牌的具体主题 --</option>
                        {filteredBrandTopics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.topic} {t.subtopic ? `(${t.subtopic})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedTopicId && (
                    <div className="p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-md text-xs text-indigo-950 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="font-semibold text-indigo-700">当前已选：</span>
                        <span className="font-medium">{customTopic}</span>
                        {customSubtopic && (
                          <span className="text-slate-500 ml-1.5 font-normal">| {customSubtopic}</span>
                        )}
                      </div>
                      <span className="text-[11px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium shrink-0">
                        {customCategory}
                      </span>
                    </div>
                  )}

                  {brandTopics.length === 0 && (
                    <p className="text-[11px] text-amber-700 mt-1">
                      {brand} 选题库暂无主题，可切换为「自定义临时主题」进行录入。
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="输入新主题名称 (如: 极地探险新品发布)"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="对应副标题 (可选)"
                        value={customSubtopic}
                        onChange={(e) => setCustomSubtopic(e.target.value)}
                        className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">类别:</span>
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="text-xs border border-slate-300 rounded p-1.5 bg-white"
                      >
                        {distinctCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer text-indigo-700 font-medium">
                      <input
                        type="checkbox"
                        checked={saveToLibrary}
                        onChange={(e) => setSaveToLibrary(e.target.checked)}
                      />
                      <span>同时永久保存该主题至 {brand} 选题库</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Row 3: Products Multi-Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  关联产品 (支持多选，已选 {selectedProductIds.length} 款)
                </label>
                <div className="relative w-44">
                  <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索产品..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full text-xs pl-7 pr-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-md p-2 space-y-1 bg-white">
                {brandProducts.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3 text-center">
                    {brand} 品牌暂无匹配的产品数据。
                  </div>
                ) : (
                  brandProducts.map((p) => {
                    const isChecked = selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProduct(p.id)}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer text-xs transition ${
                          isChecked
                            ? 'bg-indigo-50 border border-indigo-200 font-medium text-indigo-900'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{p.productName}</span>
                          {p.sku && (
                            <span className="text-[10px] text-slate-400 font-mono">[{p.sku}]</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">{p.price || ''}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Row 4: Format (OPTIONAL) & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>内容形式 (Format)</span>
                  <span className="text-[10px] text-slate-400 font-normal">可选</span>
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- 无 / 暂不设定形式 (可选) --</option>
                  {formats.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">排期状态</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EDMStatus)}
                  className="w-full text-sm border border-slate-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Planned">计划中 (Planned)</option>
                  <option value="In Progress">进行中 (In Progress)</option>
                  <option value="Brief Ready">Brief 已就绪 (Brief Ready)</option>
                  <option value="Completed">已完成 (Completed)</option>
                  <option value="Cancelled">已取消 (Cancelled)</option>
                </select>
              </div>
            </div>

            {/* Row 5: Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">规划与执行备注</label>
              <textarea
                rows={2}
                placeholder="活动重点、排期细节、设计制作对接备忘..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSaving || isDuplicateDate}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow disabled:opacity-50 transition"
              >
                {isSaving ? '保存中...' : itemToEdit ? '更新排期' : '确认排期'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: BATCH QUICK ADD */}
        {modalTab === 'batch' && (
          <form onSubmit={handleBatchSubmit} className="p-6 space-y-4">
            <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-xs text-indigo-900">
              <span>
                💡 批量模式下可一次性输入多天、多个品牌的 EDM 排期计划，点击底部「一键新增全部排期」即刻生效。
              </span>
              <button
                type="button"
                onClick={handleAddBatchRow}
                className="flex items-center gap-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded shadow-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>增加一行</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[50vh]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 w-12 text-center">序号</th>
                    <th className="p-2.5 w-36">排发日期 *</th>
                    <th className="p-2.5 w-32">品牌 *</th>
                    <th className="p-2.5">主题内容 (Topic) *</th>
                    <th className="p-2.5 w-40">副标题 (Subtopic)</th>
                    <th className="p-2.5 w-40">形式 (Format，可选)</th>
                    <th className="p-2.5 w-16 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {batchRows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-2.5">
                        <input
                          type="date"
                          required
                          value={row.date}
                          onChange={(e) =>
                            handleUpdateBatchRow(row.id, { date: e.target.value })
                          }
                          className="w-full text-xs border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={row.brand}
                          onChange={(e) =>
                            handleUpdateBatchRow(row.id, { brand: e.target.value })
                          }
                          className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800"
                        >
                          {brands.map((b) => (
                            <option key={b.id} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          required
                          placeholder="例如: 暖秋露营炊具专场"
                          value={row.topic}
                          onChange={(e) =>
                            handleUpdateBatchRow(row.id, { topic: e.target.value })
                          }
                          className="w-full text-xs border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          placeholder="副标题 (可选)"
                          value={row.subtopic}
                          onChange={(e) =>
                            handleUpdateBatchRow(row.id, { subtopic: e.target.value })
                          }
                          className="w-full text-xs border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={row.format}
                          onChange={(e) =>
                            handleUpdateBatchRow(row.id, { format: e.target.value })
                          }
                          className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- 可选 --</option>
                          {formats.map((f) => (
                            <option key={f.id} value={f.name}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveBatchRow(row.id)}
                          disabled={batchRows.length <= 1}
                          className="text-slate-400 hover:text-rose-600 p-1 disabled:opacity-30"
                          title="删除该行"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleAddBatchRow}
                className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-800"
              >
                <Plus className="w-4 h-4" />
                <span>再增加一行</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>一键新增全部 {batchRows.length} 条排期</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
