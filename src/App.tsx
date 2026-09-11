/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchAllData,
  saveCalendarItem,
  deleteCalendarItem,
  saveBrief,
  deleteBrief,
  saveTopic,
  deleteTopic,
  saveProduct,
  deleteProduct,
  saveTemplate,
  deleteTemplate,
  saveFormat,
  deleteFormat,
  saveBrand,
  deleteBrand,
  saveCtaCopy,
  deleteCtaCopy,
  saveAllTopicCategories,
  batchSaveProducts,
  batchSaveCalendar,
  batchSaveTopics,
  subscribeDisplayTypes,
  saveDisplayTypes,
  DEFAULT_DISPLAY_TYPES,
} from './services/db';
import {
  Brand,
  Topic,
  TopicCategory,
  Product,
  Template,
  EDMFormat,
  CalendarItem,
  EmailBrief,
  CtaCopy,
  DisplayTypeConfig,
} from './types';
import { Navbar, NavTab } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { CalendarModal } from './components/CalendarModal';
import { BriefEditor } from './components/BriefEditor';
import { TopicLibrary } from './components/TopicLibrary';
import { ProductLibrary } from './components/ProductLibrary';
import { TemplateLibrary } from './components/TemplateLibrary';
import { CtaLibraryView } from './components/CtaLibraryView';
import { FormatManager } from './components/FormatManager';
import { SettingsBackup } from './components/SettingsBackup';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ExportModal } from './components/ExportModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Loader2 } from 'lucide-react';

export default function App() {
  // Master Collections
  const [brands, setBrands] = useState<Brand[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [formats, setFormats] = useState<EDMFormat[]>([]);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [briefs, setBriefs] = useState<EmailBrief[]>([]);
  const [ctaCopies, setCtaCopies] = useState<CtaCopy[]>([]);
  const [topicCategories, setTopicCategories] = useState<TopicCategory[]>([]);
  const [displayTypes, setDisplayTypes] = useState<DisplayTypeConfig>(DEFAULT_DISPLAY_TYPES);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<NavTab>('calendar');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');

  // Active Brief State
  const [activeBriefItem, setActiveBriefItem] = useState<CalendarItem | null>(null);

  // Modals State
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [editingCalendarItem, setEditingCalendarItem] = useState<CalendarItem | null>(null);
  const [calendarModalInitialDate, setCalendarModalInitialDate] = useState<string | undefined>(undefined);
  const [calendarModalInitialTab, setCalendarModalInitialTab] = useState<'single' | 'batch'>('single');

  // Excel Import & Export Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<'topics' | 'products' | 'calendar'>('calendar');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportInitialTarget, setExportInitialTarget] = useState<'both' | 'calendar' | 'brief'>('calendar');
  const [exportInitialBriefId, setExportInitialBriefId] = useState<string | undefined>(undefined);

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Subscribe to display types
  useEffect(() => {
    const unsub = subscribeDisplayTypes((conf) => {
      if (conf) setDisplayTypes(conf);
    });
    return () => unsub();
  }, []);

  // Load all data from Firestore & local storage
  const loadData = useCallback(async () => {
    try {
      const data = await fetchAllData();
      setBrands(data.brands);
      setTopics(data.topics);
      setProducts(data.products);
      setTemplates(data.templates);
      setFormats(data.formats);
      setCalendarItems(data.calendarItems);
      setBriefs(data.briefs);
      setCtaCopies(data.ctaCopies || []);
      setTopicCategories(data.topicCategories || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      addToast('Error loading database records.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global Excel Export - opens the flexible export selector modal
  const handleExportExcel = (target: 'both' | 'calendar' | 'brief' = 'calendar', briefId?: string) => {
    setExportInitialTarget(target);
    setExportInitialBriefId(briefId);
    setExportModalOpen(true);
  };

  // Open Brief Handler
  const handleOpenBrief = (item: CalendarItem) => {
    setActiveBriefItem(item);
    setActiveTab('brief');
  };

  // Save Brief Handler
  const handleSaveBrief = async (brief: EmailBrief) => {
    await saveBrief(brief);

    // Update in local briefs list
    setBriefs((prev) => {
      const idx = prev.findIndex((b) => b.id === brief.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = brief;
        return next;
      }
      return [...prev, brief];
    });

    // Mark calendar item as having brief
    const targetCalendarItem = calendarItems.find((c) => c.id === brief.calendarItemId);
    if (targetCalendarItem && !targetCalendarItem.hasBrief) {
      const updatedCalendarItem: CalendarItem = {
        ...targetCalendarItem,
        hasBrief: true,
        briefId: brief.id,
      };
      await saveCalendarItem(updatedCalendarItem);
      setCalendarItems((prev) =>
        prev.map((c) => (c.id === updatedCalendarItem.id ? updatedCalendarItem : c))
      );
      if (activeBriefItem?.id === updatedCalendarItem.id) {
        setActiveBriefItem(updatedCalendarItem);
      }
    }

    addToast(`品牌 ${brief.brand}（${brief.date}）需求单已成功保存！`, 'success');
  };

  // Calendar Item Save Handler
  const handleSaveCalendarItem = async (
    item: CalendarItem,
    newTopicToSave?: { brand: string; topic: string; category?: string; subtopic?: string; emailType: string; marketingAngle?: string }
  ) => {
    // If user requested to save new topic to library
    if (newTopicToSave) {
      const newTopic: Topic = {
        id: `topic_${Date.now()}`,
        brand: newTopicToSave.brand,
        category: (newTopicToSave.category as '节日活动' | '普通') || '普通',
        topic: newTopicToSave.topic,
        subtopic: newTopicToSave.subtopic,
        emailType: newTopicToSave.emailType,
        marketingAngle: newTopicToSave.marketingAngle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveTopic(newTopic);
      setTopics((prev) => [...prev, newTopic]);
      item.topicId = newTopic.id;
    }

    await saveCalendarItem(item);
    setCalendarItems((prev) => {
      const idx = prev.findIndex((c) => c.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [...prev, item];
    });

    addToast(`已成功排期 ${item.brand} 于 ${item.date} 的 EDM。`, 'success');
  };

  // Delete Calendar Item
  const handleDeleteCalendarItem = async (id: string) => {
    const item = calendarItems.find((c) => c.id === id);
    if (!item) return;

    if (!confirm(`确定删除 ${item.brand} 于 ${item.date} 的排期记录？`)) {
      return;
    }

    await deleteCalendarItem(id);
    if (item.briefId) {
      await deleteBrief(item.briefId);
      setBriefs((prev) => prev.filter((b) => b.id !== item.briefId));
    }

    setCalendarItems((prev) => prev.filter((c) => c.id !== id));
    if (activeBriefItem?.id === id) {
      setActiveBriefItem(null);
      setActiveTab('calendar');
    }
    addToast(`已删除 ${item.brand} 的排期记录。`, 'info');
  };

  // Topics CRUD
  const handleSaveTopic = async (topic: Topic) => {
    await saveTopic(topic);
    setTopics((prev) => {
      const idx = prev.findIndex((t) => t.id === topic.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = topic;
        return next;
      }
      return [...prev, topic];
    });
    addToast(`选题「${topic.topic}」已保存至选题库。`, 'success');
  };

  const handleDeleteTopic = async (id: string) => {
    await deleteTopic(id);
    setTopics((prev) => prev.filter((t) => t.id !== id));
    addToast('选题已删除。', 'info');
  };

  // Products CRUD
  const handleSaveProduct = async (product: Product) => {
    await saveProduct(product);
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = product;
        return next;
      }
      return [...prev, product];
    });
    addToast(`产品「${product.productName}」已保存至产品库。`, 'success');
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addToast('产品已从产品库移除。', 'info');
  };

  // Templates CRUD
  const handleSaveTemplate = async (template: Template) => {
    await saveTemplate(template);
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === template.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = template;
        return next;
      }
      return [...prev, template];
    });
    addToast(`模板「${template.templateName}」已保存。`, 'success');
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    addToast('模板已删除。', 'info');
  };

  // Formats CRUD
  const handleSaveFormat = async (format: EDMFormat) => {
    await saveFormat(format);
    setFormats((prev) => {
      const idx = prev.findIndex((f) => f.id === format.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = format;
        return next;
      }
      return [...prev, format];
    });
    addToast(`形式「${format.name}」已更新。`, 'success');
  };

  const handleDeleteFormat = async (id: string) => {
    await deleteFormat(id);
    setFormats((prev) => prev.filter((f) => f.id !== id));
    addToast('形式已删除。', 'info');
  };

  // Brands CRUD
  const handleSaveBrand = async (brand: Brand) => {
    await saveBrand(brand);
    setBrands((prev) => {
      const idx = prev.findIndex((b) => b.id === brand.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = brand;
        return next;
      }
      return [...prev, brand];
    });
    addToast(`品牌「${brand.name}」已添加。`, 'success');
  };

  const handleDeleteBrand = async (id: string) => {
    await deleteBrand(id);
    setBrands((prev) => prev.filter((b) => b.id !== id));
    addToast('品牌已移除。', 'info');
  };

  // CTA Copy CRUD
  const handleSaveCta = async (cta: CtaCopy) => {
    await saveCtaCopy(cta);
    setCtaCopies((prev) => {
      const idx = prev.findIndex((c) => c.id === cta.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = cta;
        return next;
      }
      return [...prev, cta];
    });
    addToast(`CTA「${cta.text}」已保存。`, 'success');
  };

  const handleDeleteCta = async (id: string) => {
    await deleteCtaCopy(id);
    setCtaCopies((prev) => prev.filter((c) => c.id !== id));
    addToast('CTA 已删除。', 'info');
  };

  // Topic Categories persistence
  const handleSaveTopicCategories = async (categories: TopicCategory[]) => {
    await saveAllTopicCategories(categories);
    setTopicCategories(categories);
    addToast('主题类别符号已更新。', 'success');
  };

  // Display Types persistence
  const handleSaveDisplayTypes = async (conf: DisplayTypeConfig) => {
    await saveDisplayTypes(conf);
    setDisplayTypes(conf);
    addToast('展现类型配置已更新。', 'success');
  };

  // Helper to ensure any newly encountered brand from imports is registered
  const ensureBrandsExist = async (brandNames: string[]) => {
    const existingNames = new Set(brands.map((b) => b.name.toLowerCase()));
    const newBrandsToRegister: Brand[] = [];
    for (const name of brandNames) {
      if (!name || !name.trim()) continue;
      const cleanName = name.trim();
      if (!existingNames.has(cleanName.toLowerCase())) {
        existingNames.add(cleanName.toLowerCase());
        const newBrand: Brand = {
          id: cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_') || `brand_${Date.now()}`,
          name: cleanName,
          createdAt: new Date().toISOString(),
        };
        newBrandsToRegister.push(newBrand);
        await saveBrand(newBrand);
      }
    }
    if (newBrandsToRegister.length > 0) {
      setBrands((prev) => [...prev, ...newBrandsToRegister]);
    }
  };

  // Excel Import Commit Handlers
  const handleCommitTopics = async (importedTopics: Topic[]) => {
    const validTopics = importedTopics.filter((t) => t && t.topic && t.topic.trim());
    if (validTopics.length === 0) {
      addToast('未发现可导入的有效主题。', 'error');
      return;
    }
    await ensureBrandsExist(validTopics.map((t) => t.brand));
    await batchSaveTopics(validTopics);
    setTopics((prev) => {
      const map = new Map(prev.map((t) => [t.id, t]));
      validTopics.forEach((t) => map.set(t.id, t));
      return Array.from(map.values());
    });
    await loadData();
    addToast(`已成功将 ${validTopics.length} 条选题保存至云端数据库！`, 'success');
  };

  const handleCommitProducts = async (importedProducts: Product[]) => {
    const validProducts = importedProducts.filter((p) => {
      const importRow = p as Product & { isValid?: boolean };
      return p && importRow.isValid !== false && p.productName && p.productName.trim() && p.brand && p.brand.trim();
    });
    if (validProducts.length === 0) {
      addToast('未发现可导入的有效产品。', 'error');
      return;
    }
    await ensureBrandsExist(validProducts.map((p) => p.brand));
    await batchSaveProducts(validProducts);
    setProducts((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      validProducts.forEach((p) => map.set(p.id, p));
      return Array.from(map.values());
    });
    await loadData();
    addToast(`已成功将 ${validProducts.length} 个产品保存至云端数据库！`, 'success');
  };

  const handleCommitCalendar = async (importedCalendar: CalendarItem[]) => {
    const validCalendar = importedCalendar.filter((c) => c && c.date && c.topic && c.topic.trim());
    if (validCalendar.length === 0) {
      addToast('未发现可导入的有效排期。', 'error');
      return;
    }
    await ensureBrandsExist(validCalendar.map((c) => c.brand));
    await batchSaveCalendar(validCalendar);
    setCalendarItems((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]));
      validCalendar.forEach((c) => map.set(c.id, c));
      return Array.from(map.values());
    });
    await loadData();
    addToast(`已成功将 ${validCalendar.length} 条排期保存至云端数据库！`, 'success');
  };

  // Find existing brief for the active calendar item
  const currentBrief = activeBriefItem
    ? briefs.find((b) => b.calendarItemId === activeBriefItem.id) || null
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center text-slate-700">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <span className="font-semibold text-sm">正在加载 EDM 资产与排期管理库...</span>
        <span className="text-xs text-slate-400 mt-1">连接 Firestore 云端数据库</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased">
      {/* Persistent Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        brands={brands}
        selectedBrand={selectedBrand}
        onSelectBrand={setSelectedBrand}
        onExportExcel={() => handleExportExcel(activeTab === 'brief' ? 'brief' : 'calendar', currentBrief?.id)}
        onOpenImport={(type) => {
          setImportType(type);
          setImportModalOpen(true);
        }}
        activeBriefId={activeBriefItem ? activeBriefItem.id : null}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6">
        {activeTab === 'calendar' && (
          <CalendarView
            calendarItems={calendarItems}
            brands={brands}
            selectedBrand={selectedBrand}
            onOpenCreateModal={(date, initialMode) => {
              setEditingCalendarItem(null);
              setCalendarModalInitialDate(date);
              setCalendarModalInitialTab(initialMode || 'single');
              setCalendarModalOpen(true);
            }}
            onEditItem={(item) => {
              setEditingCalendarItem(item);
              setCalendarModalInitialDate(item.date);
              setCalendarModalInitialTab('single');
              setCalendarModalOpen(true);
            }}
            onDeleteItem={handleDeleteCalendarItem}
            onOpenBrief={handleOpenBrief}
            onOpenImport={() => {
              setImportType('calendar');
              setImportModalOpen(true);
            }}
            onExportMonthCalendar={() => handleExportExcel('calendar')}
          />
        )}

        {activeTab === 'brief' && activeBriefItem && (
          <BriefEditor
            calendarItem={activeBriefItem}
            existingBrief={currentBrief}
            products={products}
            templates={templates}
            topics={topics}
            ctaCopies={ctaCopies}
            displayTypes={displayTypes}
            onSaveDisplayTypes={handleSaveDisplayTypes}
            onSaveBrief={handleSaveBrief}
            onBackToCalendar={() => setActiveTab('calendar')}
            onExportExcel={() => handleExportExcel('brief', currentBrief?.id)}
            onOpenCtaLibrary={() => setActiveTab('cta')}
          />
        )}

        {activeTab === 'brief' && !activeBriefItem && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
            <h3 className="text-base font-bold text-slate-900 mb-1">未选择当前 EDM 需求单</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              每份 EDM 需求单直接与排期日历和品牌对应绑定。
              请前往排期日历选择任意已排期的 EDM 项目进入并编辑需求单。
            </p>
            <button
              onClick={() => setActiveTab('calendar')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              前往排期日历
            </button>
          </div>
        )}

        {activeTab === 'topics' && (
          <TopicLibrary
            topics={topics}
            brands={brands}
            selectedBrand={selectedBrand}
            topicCategories={topicCategories}
            onSaveTopic={handleSaveTopic}
            onDeleteTopic={handleDeleteTopic}
            onSaveTopicCategories={handleSaveTopicCategories}
            onOpenImport={() => {
              setImportType('topics');
              setImportModalOpen(true);
            }}
          />
        )}

        {activeTab === 'products' && (
          <ProductLibrary
            products={products}
            brands={brands}
            selectedBrand={selectedBrand}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onOpenImport={() => {
              setImportType('products');
              setImportModalOpen(true);
            }}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateLibrary
            templates={templates}
            displayTypes={displayTypes}
            onSaveTemplate={handleSaveTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        )}

        {activeTab === 'cta' && (
          <CtaLibraryView
            ctaCopies={ctaCopies}
            onSaveCta={handleSaveCta}
            onDeleteCta={handleDeleteCta}
          />
        )}

        {activeTab === 'formats' && (
          <FormatManager
            formats={formats}
            onSaveFormat={handleSaveFormat}
            onDeleteFormat={handleDeleteFormat}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsBackup
            brands={brands}
            onSaveBrand={handleSaveBrand}
            onDeleteBrand={handleDeleteBrand}
            onDataRestored={loadData}
          />
        )}
      </main>

      {/* Calendar Item Modal (Add/Edit) */}
      <CalendarModal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        onSave={handleSaveCalendarItem}
        onSaveBatch={handleCommitCalendar}
        onOpenExcelImport={() => {
          setCalendarModalOpen(false);
          setImportType('calendar');
          setImportModalOpen(true);
        }}
        itemToEdit={editingCalendarItem}
        initialDate={calendarModalInitialDate}
        initialTab={calendarModalInitialTab}
        brands={brands}
        topics={topics}
        products={products}
        formats={formats}
        topicCategories={topicCategories}
        existingCalendarItems={calendarItems}
      />

      {/* Excel Universal Import Modal */}
      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type={importType}
        brands={brands}
        onCommitTopics={handleCommitTopics}
        onCommitProducts={handleCommitProducts}
        onCommitCalendar={handleCommitCalendar}
      />

      {/* Universal Flexible Excel Export Modal (自选导出：日历、需求单或Both，支持多选需求单) */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        calendarItems={calendarItems}
        briefs={briefs}
        activeBrand={selectedBrand}
        initialTarget={exportInitialTarget}
        initialBriefId={exportInitialBriefId}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
