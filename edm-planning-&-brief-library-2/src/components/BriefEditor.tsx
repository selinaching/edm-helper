import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  LayoutTemplate,
  Package,
  Link as LinkIcon,
  FileSpreadsheet,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Maximize2,
  MousePointerClick,
  Sparkles,
  Layers,
  Tag,
  Check,
} from 'lucide-react';
import {
  EmailBrief,
  EmailPosition,
  CalendarItem,
  Product,
  Template,
  CtaCopy,
  PositionCta,
  Topic,
  DisplayTypeConfig,
} from '../types';
import { ImageZoomModal } from './ImageZoomModal';
import { CtaPickerModal } from './CtaPickerModal';
import { TemplatePickerModal } from './TemplatePickerModal';
import { DisplayTypeManagerModal } from './DisplayTypeManagerModal';

interface BriefEditorProps {
  calendarItem: CalendarItem;
  existingBrief?: EmailBrief | null;
  products: Product[];
  templates: Template[];
  topics?: Topic[];
  ctaCopies?: CtaCopy[];
  displayTypes?: DisplayTypeConfig;
  onSaveDisplayTypes?: (config: DisplayTypeConfig) => Promise<void>;
  onSaveBrief: (brief: EmailBrief) => Promise<void>;
  onBackToCalendar: () => void;
  onExportExcel: () => void;
  onOpenCtaLibrary?: () => void;
}

const DEFAULT_HERO_TYPES = ['内容', '促销', '新品首发', '场景体验', '活动预告'];
const DEFAULT_BODY_TYPES = [
  '功能属性',
  '媒体背书',
  '场景体验',
  '用户评价',
  '对比测评',
  '技术解析',
  '配件/周边',
];

export const BriefEditor: React.FC<BriefEditorProps> = ({
  calendarItem,
  existingBrief,
  products,
  templates,
  topics = [],
  ctaCopies = [],
  displayTypes,
  onSaveDisplayTypes,
  onSaveBrief,
  onBackToCalendar,
  onExportExcel,
  onOpenCtaLibrary,
}) => {
  // Synchronize products selected in calendar or brief
  const [briefProductIds, setBriefProductIds] = useState<string[]>(
    existingBrief?.productIds || []
  );

  // Subject Line & Pre-header state
  const [subjectLine, setSubjectLine] = useState(
    existingBrief?.subjectLine || ''
  );
  const [preheader, setPreheader] = useState(
    existingBrief?.preheader || ''
  );

  // Default positions requirement: Hero, Section 1, Section 2, Section 3, Footer
  const defaultInitialPositions: EmailPosition[] = [
    {
      id: 'pos-hero',
      name: 'Hero',
      order: 1,
      content: '',
      productIds: [],
      link: '',
      keyRequirements: '',
      ctas: [{ id: 'cta-hero-1', text: 'SHOP NOW', link: '' }],
    },
    {
      id: 'pos-sec-1',
      name: 'Section 1',
      order: 2,
      content: '',
      productIds: [],
      link: '',
      keyRequirements: '',
      ctas: [{ id: 'cta-sec1-1', text: 'EXPLORE MORE', link: '' }],
    },
    {
      id: 'pos-sec-2',
      name: 'Section 2',
      order: 3,
      content: '',
      productIds: [],
      link: '',
      keyRequirements: '',
      ctas: [],
    },
    {
      id: 'pos-sec-3',
      name: 'Section 3',
      order: 4,
      content: '',
      productIds: [],
      link: '',
      keyRequirements: '',
      ctas: [],
    },
    {
      id: 'pos-footer',
      name: 'Footer',
      order: 5,
      content: '',
      productIds: [],
      link: '',
      keyRequirements: '',
      ctas: [],
    },
  ];

  const [positions, setPositions] = useState<EmailPosition[]>(
    existingBrief?.positions && existingBrief.positions.length > 0
      ? existingBrief.positions
      : defaultInitialPositions
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [openProductTrays, setOpenProductTrays] = useState<Record<string, boolean>>({});

  // Image Zoom Lightbox state
  const [zoomImage, setZoomImage] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    category?: string;
    referenceUrl?: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
  });

  // CTA Picker modal state: active position ID picking a CTA
  const [ctaPickerPosId, setCtaPickerPosId] = useState<string | null>(null);

  // Template Picker Modal state: active position ID picking a reference template
  const [templatePickerPosId, setTemplatePickerPosId] = useState<string | null>(null);

  // Display Type Manager Modal state
  const [displayTypeModalOpen, setDisplayTypeModalOpen] = useState(false);

  // Product content insertion checkboxes state: positionId ->
  // { productId, fields, selectedDescriptionIndices, selectedFeatures: { [featureId]: styleIndex } }
  const [insertCheckboxes, setInsertCheckboxes] = useState<
    Record<
      string,
      {
        productId: string;
        fields: Record<string, boolean>;
        selectedDescriptionIndices?: number[];
        selectedFeatures?: Record<string, number>; // featureId/sellingPointId -> selected description variant index
      }
    >
  >({});

  // Active products for this brief
  const activeProducts = products.filter((p) => briefProductIds.includes(p.id));

  // Initialize or update checkbox default product for position trays
  useEffect(() => {
    if (activeProducts.length > 0) {
      setInsertCheckboxes((prev) => {
        const next = { ...prev };
        positions.forEach((pos) => {
          if (!next[pos.id]) {
            const firstProd = activeProducts[0];
            const descCount =
              firstProd.descriptions?.length ||
              (firstProd.productDescription ? 1 : 0);
            
            next[pos.id] = {
              productId: firstProd.id,
              selectedDescriptionIndices: [],
              selectedFeatures: {},
              fields: {
                productName: false,
                description: false,
                features: false,
                specifications: false,
                keySellingPoints: false,
                targetUseCases: false,
                price: false,
                productUrl: false,
              },
            };
          }
        });
        return next;
      });
    }
  }, [activeProducts, positions]);

  // Position management
  const handleAddPosition = () => {
    const nextOrder = positions.length + 1;
    const newPos: EmailPosition = {
      id: `pos-${Date.now()}`,
      name: `Section ${nextOrder - 1}`,
      order: nextOrder,
      content: '',
      productIds: [],
      link: '',
      keyRequirements: '',
      ctas: [],
    };
    // Insert before footer if last position is footer
    const hasFooter = positions[positions.length - 1]?.name.toLowerCase().trim() === 'footer';
    if (hasFooter) {
      const allExceptFooter = positions.slice(0, positions.length - 1);
      const footer = positions[positions.length - 1];
      const updated = [...allExceptFooter, newPos, { ...footer, order: nextOrder + 1 }];
      setPositions(updated);
    } else {
      setPositions([...positions, newPos]);
    }
  };

  const handleDeletePosition = (posId: string) => {
    if (positions.length <= 1) {
      alert('至少需要保留 1 个板块。');
      return;
    }
    const updated = positions
      .filter((p) => p.id !== posId)
      .map((p, idx) => ({ ...p, order: idx + 1 }));
    setPositions(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...positions];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setPositions(next.map((p, idx) => ({ ...p, order: idx + 1 })));
  };

  const handleMoveDown = (index: number) => {
    if (index === positions.length - 1) return;
    const next = [...positions];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setPositions(next.map((p, idx) => ({ ...p, order: idx + 1 })));
  };

  // Position Field Edit
  const handleUpdatePositionField = (posId: string, field: keyof EmailPosition, value: unknown) => {
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id === posId) return { ...p, [field]: value };
        if (field === 'displayType' && p.name.toLowerCase().trim() !== 'hero' && p.name.toLowerCase().trim() !== 'footer') {
          const source = positions.find((item) => item.id === posId);
          if (source && source.name.toLowerCase().trim() !== 'hero' && source.name.toLowerCase().trim() !== 'footer') {
            return { ...p, displayType: value as string };
          }
        }
        return p;
      })
    );
  };

  // CTA Button Management per position
  const handleAddCtaToPosition = (posId: string, ctaData?: { text: string; link?: string; category?: string }) => {
    const newCta: PositionCta = {
      id: `cta_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: ctaData?.text || 'SHOP NOW',
      link: ctaData?.link || '',
      category: ctaData?.category || '通用型',
    };

    setPositions((prev) =>
      prev.map((p) => {
        if (p.id === posId) {
          const currentCtas = p.ctas || [];
          return { ...p, ctas: [...currentCtas, newCta] };
        }
        return p;
      })
    );
  };

  const handleUpdateCta = (posId: string, ctaId: string, updates: Partial<PositionCta>) => {
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id === posId) {
          const currentCtas = (p.ctas || []).map((cta) =>
            cta.id === ctaId ? { ...cta, ...updates } : cta
          );
          return { ...p, ctas: currentCtas };
        }
        return p;
      })
    );
  };

  const handleDeleteCta = (posId: string, ctaId: string) => {
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id === posId) {
          const currentCtas = (p.ctas || []).filter((cta) => cta.id !== ctaId);
          return { ...p, ctas: currentCtas };
        }
        return p;
      })
    );
  };

  // Template Selection per Position
  const handleSelectTemplate = (posId: string, templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id === posId) {
          return {
            ...p,
            templateId: templateId || undefined,
            templateName: template?.templateName || '',
            templateScreenshot: template?.screenshotUrl || '',
            templateReferenceUrl: template?.referenceUrl || '',
          };
        }
        return p;
      })
    );
  };

  // Checkbox state toggle for reusable product content tray
  const handleToggleTrayField = (posId: string, fieldKey: string) => {
    setInsertCheckboxes((prev) => {
      const current = prev[posId] || {
        productId: activeProducts[0]?.id || '',
        fields: {},
      };
      return {
        ...prev,
        [posId]: {
          ...current,
          fields: {
            ...current.fields,
            [fieldKey]: !current.fields[fieldKey],
          },
        },
      };
    });
  };

  // Toggle specific description index selection for a position
  const handleToggleDescriptionIndex = (posId: string, descIndex: number) => {
    setInsertCheckboxes((prev) => {
      const current = prev[posId] || {
        productId: activeProducts[0]?.id || '',
        fields: {},
        selectedDescriptionIndices: [],
      };
      const existingIndices = current.selectedDescriptionIndices || [];
      const nextIndices = existingIndices.includes(descIndex)
        ? existingIndices.filter((idx) => idx !== descIndex)
        : [...existingIndices, descIndex];

      return {
        ...prev,
        [posId]: {
          ...current,
          selectedDescriptionIndices: nextIndices,
          fields: {
            ...current.fields,
            description: nextIndices.length > 0,
          },
        },
      };
    });
  };

  // Toggle specific feature selection & variant for a position
  const handleToggleFeature = (posId: string, featureId: string, variantIndex = 0) => {
    setInsertCheckboxes((prev) => {
      const current = prev[posId] || {
        productId: activeProducts[0]?.id || '',
        fields: {},
        selectedFeatures: {},
      };
      const currentFeats = { ...(current.selectedFeatures || {}) };
      if (featureId in currentFeats) {
        delete currentFeats[featureId];
      } else {
        currentFeats[featureId] = variantIndex;
      }

      return {
        ...prev,
        [posId]: {
          ...current,
          selectedFeatures: currentFeats,
          fields: {
            ...current.fields,
            features: Object.keys(currentFeats).length > 0,
          },
        },
      };
    });
  };

  const handleSelectFeatureVariant = (posId: string, featureId: string, variantIndex: number) => {
    setInsertCheckboxes((prev) => {
      const current = prev[posId] || {
        productId: activeProducts[0]?.id || '',
        fields: {},
        selectedFeatures: {},
      };
      return {
        ...prev,
        [posId]: {
          ...current,
          selectedFeatures: {
            ...(current.selectedFeatures || {}),
            [featureId]: variantIndex,
          },
        },
      };
    });
  };

  const handleChangeTrayProduct = (posId: string, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    const defaultIndices: number[] = [];

    setInsertCheckboxes((prev) => ({
      ...prev,
      [posId]: {
        ...(prev[posId] || { fields: {} }),
        productId: prodId,
        selectedDescriptionIndices: defaultIndices,
        selectedFeatures: {},
      },
    }));
  };

  const normalizePrice = (value?: string): string => {
    const normalized = value?.replace(/\s+/g, ' ').trim() || '';
    if (!normalized) return '';
    return /^\$/.test(normalized) ? normalized : /^\d+(?:\.\d+)?$/.test(normalized)
      ? `$${normalized}`
      : normalized;
  };

  const stripDescriptionLabel = (value: string): string =>
    value
      .split('\n')
      .map((line) => line.replace(/^\s*\[[^\]]+\]\s*:?\s*/, '').trimEnd())
      .join('\n')
      .trim();

  // Insert Selected Content into Content box
  const handleInsertContent = (posId: string) => {
    const trayState = insertCheckboxes[posId];
    if (!trayState || !trayState.productId) {
      alert('请先选择要插入的产品。');
      return;
    }

    const prod = products.find((p) => p.id === trayState.productId);
    if (!prod) return;

    const sections: string[] = [];
    const f = trayState.fields || {};

    if (f.productName) sections.push(`产品名称: ${prod.productName}`);

    if (f.price) {
      const originalPrice = normalizePrice(prod.originalPrice);
      const currentPrice = normalizePrice(prod.price);
      if (originalPrice && currentPrice) {
        sections.push(`~~${originalPrice}~~ ${currentPrice}`);
      } else if (currentPrice) {
        sections.push(currentPrice);
      }
    }

    // Insert customizable descriptions
    if (f.description) {
      if (prod.descriptions && prod.descriptions.length > 0) {
        const chosenIndices =
          trayState.selectedDescriptionIndices ?? prod.descriptions.map((_, i) => i);
        const filtered = prod.descriptions.filter((_, idx) => chosenIndices.includes(idx));
        if (filtered.length > 0) {
          const descTexts = filtered.map((d) => stripDescriptionLabel(d.content));
          sections.push(`产品描述:\n${descTexts.join('\n')}`);
        }
      } else if (prod.productDescription) {
        const descriptionText = stripDescriptionLabel(prod.productDescription);
        sections.push(`产品描述:\n${descriptionText}`);
      }
    }

    // Insert customizable selling points with selected descriptions (卖点与描述)
    if (f.features) {
      const selectedFeats = trayState.selectedFeatures || {};
      const featEntries: string[] = [];

      if (prod.sellingPoints && prod.sellingPoints.length > 0) {
        prod.sellingPoints.forEach((sp) => {
          if (sp.id in selectedFeats) {
            const variantIdx = selectedFeats[sp.id] ?? 0;
            const chosenDesc = sp.descriptions?.[variantIdx];
            if (chosenDesc) {
              const label = chosenDesc.label || `描述 ${variantIdx + 1}`;
              featEntries.push(`• ${sp.title} (${label}): ${chosenDesc.text}`);
            } else {
              featEntries.push(`• ${sp.title}`);
            }
          }
        });
      } else if (prod.featuresList && prod.featuresList.length > 0) {
        prod.featuresList.forEach((feat) => {
          if (feat.id in selectedFeats) {
            const variantIdx = selectedFeats[feat.id] ?? 0;
            const chosenVariant = feat.descriptions?.[variantIdx];
            if (chosenVariant) {
              featEntries.push(`• ${feat.name} (${chosenVariant.style}): ${chosenVariant.text}`);
            } else {
              featEntries.push(`• ${feat.name}`);
            }
          }
        });
      } else if (prod.features || prod.keySellingPoints) {
        const featText = [prod.features, prod.keySellingPoints].filter(Boolean).join('\n');
        if (featText) featEntries.push(featText);
      }

      if (featEntries.length > 0) {
        sections.push(`卖点:\n${featEntries.join('\n')}`);
      }
    }

    // Parameters (产品参数)
    if (f.specifications) {
      const params = prod.parameters || prod.specifications;
      if (params) sections.push(`产品参数:\n${params}`);
    }
    if (f.targetUseCases && prod.targetUseCases) sections.push(`适用场景:\n${prod.targetUseCases}`);
    if (f.productUrl && prod.productUrl) sections.push(`链接: ${prod.productUrl}`);

    const insertionText = sections.join('\n\n');

    setPositions((prev) =>
      prev.map((pos) => {
        if (pos.id === posId) {
          const updatedContent = pos.content.trim()
            ? `${pos.content}\n\n---\n${insertionText}`
            : insertionText;

          const updatedLink = pos.link.trim() ? pos.link : prod.productUrl || '';

          const currentPids = pos.productIds || [];
          const updatedPids = currentPids.includes(prod.id) ? currentPids : [...currentPids, prod.id];
          const updatedNames = updatedPids
            .map((id) => products.find((p) => p.id === id)?.productName)
            .filter((n): n is string => Boolean(n));

          return {
            ...pos,
            content: updatedContent,
            link: updatedLink,
            productIds: updatedPids,
            productNames: updatedNames,
          };
        }
        return pos;
      })
    );

    setSaveSuccessMessage(`已成功插入 ${prod.productName} 的信息`);
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  // Sync Hero Topic & Subtopic into Hero position content
  const handleSyncHeroTopic = (posId: string) => {
    const t = calendarItem.topic;
    const sub = calendarItem.subtopic;
    const heroHeadline = [
      t ? `【主题】: ${t}` : '',
      sub ? `【副标题】: ${sub}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    setPositions((prev) =>
      prev.map((pos) => {
        if (pos.id === posId) {
          const newContent = pos.content.trim()
            ? `${heroHeadline}\n\n${pos.content}`
            : heroHeadline;
          return { ...pos, content: newContent };
        }
        return pos;
      })
    );

    setSaveSuccessMessage('已将日历排期主题与子主题同步至首焦区文案！');
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  // Save Brief to Firestore / Cache
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMessage('');

    const briefId = existingBrief ? existingBrief.id : `brief_${calendarItem.id}`;

    const brief: EmailBrief = {
      id: briefId,
      calendarItemId: calendarItem.id,
      brand: calendarItem.brand,
      date: calendarItem.date,
      topic: calendarItem.topic,
      subtopic: calendarItem.subtopic,
      subjectLine: subjectLine.trim(),
      preheader: preheader.trim(),
      format: calendarItem.format,
      productIds: briefProductIds,
      positions,
      createdAt: existingBrief ? existingBrief.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSaveBrief(brief);
      setSaveSuccessMessage('需求 Brief 已成功保存！');
      setTimeout(() => setSaveSuccessMessage(''), 4000);
    } catch (err: unknown) {
      alert('保存 Brief 出错: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sticky Top Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 sticky top-14 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCalendar}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回日历</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-600 text-white">
                {calendarItem.brand}
              </span>
              <span className="text-xs font-mono font-medium text-slate-500">
                {calendarItem.date}
              </span>
              {calendarItem.format && (
                <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-medium">
                  {calendarItem.format}
                </span>
              )}
            </div>
            <h1 className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <span>{calendarItem.topic}</span>
              {calendarItem.subtopic && (
                <span className="text-xs text-slate-500 font-normal">
                  — {calendarItem.subtopic}
                </span>
              )}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {saveSuccessMessage && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200 animate-fade-in flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {saveSuccessMessage}
            </span>
          )}

          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>导出本期 Brief (Excel)</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? '保存中...' : '保存 Brief 需求'}</span>
          </button>
        </div>
      </div>

      {/* Subject Line & Pre-header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white p-5 rounded-xl border border-indigo-950 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
            邮件外发配置：Subject Line 与 Pre-header
          </h2>
          <span className="text-[11px] text-slate-400">
            (发布邮件时填写，支持直接保存在 Brief 并同步导出到 Excel)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-indigo-100 mb-1 flex items-center justify-between">
              <span>邮件标题 (Subject Line)</span>
              <span className="text-[10px] text-slate-400 font-mono">
                建议 40~60 字符
              </span>
            </label>
            <input
              type="text"
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
              placeholder="例如: 🔥 Fall Camping Gear: Boil 500ml in 2 Mins!"
              className="w-full text-xs font-medium bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-indigo-100 mb-1 flex items-center justify-between">
              <span>预览摘要文本 (Pre-header)</span>
              <span className="text-[10px] text-slate-400 font-mono">
                收件箱第一行预览文案
              </span>
            </label>
            <input
              type="text"
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              placeholder="例如: Special Autumn Deals Inside - Free Shipping on Orders Over $50"
              className="w-full text-xs font-medium bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Drawer: Product Selection & Section Navigator (col 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Brief Products Multi-select */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>本期选入产品 ({briefProductIds.length})</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  勾选后可在右侧板块直接一键插入产品信息
                </span>
              </div>
            </div>

            {/* List of all brand products with toggles */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 border border-slate-100 rounded-md p-2 bg-slate-50/50">
              {products
                .filter((p) => p.brand.toLowerCase() === calendarItem.brand.toLowerCase())
                .map((prod) => {
                  const isSelected = briefProductIds.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setBriefProductIds((prev) =>
                          prev.includes(prod.id)
                            ? prev.filter((id) => id !== prod.id)
                            : [...prev, prod.id]
                        );
                      }}
                      className={`flex items-start justify-between p-2 rounded cursor-pointer transition text-xs ${
                        isSelected
                          ? 'bg-indigo-50 border border-indigo-200 font-medium text-indigo-950'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="leading-tight">{prod.productName}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                            {prod.sku && <span>SKU: {prod.sku}</span>}
                            {prod.discount && (
                              <span className="text-rose-600 font-bold">{prod.discount}</span>
                            )}
                            {prod.price && <span>{prod.price}</span>}
                          </div>
                        </div>
                      </div>
                      {prod.productUrl && (
                        <a
                          href={prod.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-indigo-600 p-0.5"
                          title="查看产品外链"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  );
                })}
              {products.filter((p) => p.brand.toLowerCase() === calendarItem.brand.toLowerCase())
                .length === 0 && (
                <div className="p-3 text-center text-xs text-slate-400">
                  {calendarItem.brand} 品牌暂无已录入产品。
                </div>
              )}
            </div>
          </div>

          {/* Quick Jump Index */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-2">板块快速导航</h4>
            <div className="space-y-1">
              {positions.map((pos, idx) => {
                const isFooter = pos.name.toLowerCase().trim() === 'footer';
                const isHero = pos.name.toLowerCase().trim() === 'hero';
                return (
                  <a
                    key={pos.id}
                    href={`#position-${pos.id}`}
                    className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-slate-100 text-slate-700 transition"
                  >
                    <span className="font-medium flex items-center gap-1">
                      {idx + 1}. {pos.name}
                      {isHero && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                          首焦
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isFooter ? 'footer' : pos.templateName || '未指定模板'}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Stage: Dynamic Email Positions List (col 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">邮件各屏板块 ({positions.length})</h2>
              <p className="text-xs text-slate-500">
                可为每一屏配置独立模板、CTA按钮、细选产品功能与对应描述。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDisplayTypeModalOpen(true)}
              className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            >
              管理展现类型
            </button>
            <button
              onClick={handleAddPosition}
              className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增板块</span>
            </button>
          </div>

          {/* Positions List */}
          <div className="space-y-4">
            {positions.map((pos, index) => {
              const isFooter = pos.name.toLowerCase().trim() === 'footer';
              const isHero = pos.name.toLowerCase().trim() === 'hero';

              // User requirement: "footer"这一位置，不用加任何东西，只用显示“footer”就行
              if (isFooter) {
                return (
                  <div
                    id={`position-${pos.id}`}
                    key={pos.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                  >
                    <div className="p-4 flex items-center justify-between bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                          footer
                        </span>
                        <span className="text-[11px] text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          页尾通用模块（固定展示）
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                          title="上移"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === positions.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                          title="下移"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePosition(pos.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="删除板块"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              const tray = insertCheckboxes[pos.id] || {
                productId: activeProducts[0]?.id || '',
                fields: {
                  productName: false,
                  description: false,
                  features: false,
                  specifications: false,
                  keySellingPoints: false,
                  targetUseCases: false,
                  price: false,
                  productUrl: false,
                },
              };

              const isTrayOpen = openProductTrays[pos.id] !== false;
              const currProd = products.find((p) => p.id === tray.productId);

              return (
                <div
                  id={`position-${pos.id}`}
                  key={pos.id}
                  className={`bg-white rounded-xl border shadow-xs overflow-hidden transition ${
                    isHero ? 'border-amber-300 ring-1 ring-amber-200/60' : 'border-slate-200'
                  }`}
                >
                  {/* Position Header Bar */}
                  <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 ${
                    isHero ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                        isHero ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={pos.name}
                        onChange={(e) => handleUpdatePositionField(pos.id, 'name', e.target.value)}
                        placeholder="板块名称 (如: Hero, Section 1)"
                        className="font-bold text-xs text-slate-800 bg-white border border-slate-300 rounded px-2 py-1 w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <select
                        value={pos.displayType || ''}
                        onChange={(e) => handleUpdatePositionField(pos.id, 'displayType', e.target.value)}
                        className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                      >
                        <option value="">选择展现类型</option>
                        {(isHero ? displayTypes?.heroTypes : displayTypes?.bodyTypes)?.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {isHero && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                          ⭐ Hero 首焦区
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                        title="上移"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === positions.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                        title="下移"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePosition(pos.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="删除板块"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Position Form Body */}
                  <div className="p-4 space-y-4">
                    {/* REQUIREMENT 4: HERO SECTION TOPIC LINKING */}
                    {isHero && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span>首焦区主题与子主题关联 (Hero Section Topic Link)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSyncHeroTopic(pos.id)}
                            className="text-[11px] font-semibold text-amber-800 bg-amber-200/70 hover:bg-amber-300/80 px-2.5 py-1 rounded-md transition"
                          >
                            ⚡ 一键同步至下方文案内容
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/80 p-3 rounded-lg border border-amber-200/60">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                              已关联主题 (Topic)
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {calendarItem.topic}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                              已关联子主题 (Subtopic)
                            </span>
                            <span className="font-medium text-slate-700 text-xs">
                              {calendarItem.subtopic || '（未设定子主题）'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Row: Reference Template Selection with REQUIREMENT 5: IMAGE ZOOM */}
                    <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label className="text-xs font-semibold text-purple-900 flex items-center gap-1.5">
                          <LayoutTemplate className="w-3.5 h-3.5 text-purple-600" />
                          <span>参考模板 (该板块独立指定)</span>
                        </label>
                        {pos.templateReferenceUrl && (
                          <a
                            href={pos.templateReferenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-purple-700 hover:underline flex items-center gap-1"
                          >
                            <span>打开参考链接</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className={pos.templateScreenshot ? 'sm:col-span-8' : 'sm:col-span-12'}>
                          <button
                            type="button"
                            onClick={() => setTemplatePickerPosId(pos.id)}
                            className="w-full min-h-24 border border-dashed border-purple-300 bg-white hover:bg-purple-50/60 rounded-lg p-3 text-left transition flex items-center gap-3"
                          >
                            {pos.templateScreenshot ? (
                              <img
                                src={pos.templateScreenshot}
                                alt={pos.templateName || '已选择模板'}
                                className="w-20 h-16 object-cover object-top rounded-md border border-purple-100 shrink-0"
                              />
                            ) : (
                              <div className="w-20 h-16 rounded-md bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                                <LayoutTemplate className="w-6 h-6 text-purple-400" />
                              </div>
                            )}
                            <span className="min-w-0">
                              <span className="block text-xs font-bold text-purple-900">
                                {pos.templateName || '先选择参考模板'}
                              </span>
                              <span className="block text-[11px] text-slate-500 mt-1">
                                {pos.templateName
                                  ? '点击更换模板或查看其他大类图片'
                                  : '先选大类，再从图片和名称中选择模板'}
                              </span>
                            </span>
                          </button>
                        </div>

                        {/* Thumbnail with Zoom button */}
                        {pos.templateScreenshot && (
                          <div className="sm:col-span-4 flex items-center gap-2.5 bg-white p-1.5 rounded-lg border border-purple-200">
                            <div className="relative group/img cursor-pointer shrink-0">
                              <img
                                src={pos.templateScreenshot}
                                alt="Template Preview"
                                className="w-12 h-12 object-cover rounded border border-purple-100"
                                onClick={() =>
                                  setZoomImage({
                                    isOpen: true,
                                    url: pos.templateScreenshot!,
                                    title: pos.templateName || '模板放大预览',
                                    referenceUrl: pos.templateReferenceUrl,
                                  })
                                }
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setZoomImage({
                                    isOpen: true,
                                    url: pos.templateScreenshot!,
                                    title: pos.templateName || '模板放大预览',
                                    referenceUrl: pos.templateReferenceUrl,
                                  })
                                }
                                title="点击放大查看大图"
                                className="absolute inset-0 bg-black/40 text-white rounded flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-semibold text-slate-800 line-clamp-1 block">
                                {pos.templateName}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setZoomImage({
                                    isOpen: true,
                                    url: pos.templateScreenshot!,
                                    title: pos.templateName || '模板放大预览',
                                    referenceUrl: pos.templateReferenceUrl,
                                  })
                                }
                                className="text-[10px] text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium mt-0.5"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span>点击放大查看</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* REQUIREMENT 6: GRANULAR PRODUCT FEATURE & DESCRIPTION INSERTION */}
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => {
                          setOpenProductTrays((prev) => ({ ...prev, [pos.id]: !isTrayOpen }));
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-xs font-bold text-slate-800">
                            插入产品信息 (支持具体选择哪个功能与对应语言描述)
                          </span>
                        </div>
                        <button type="button" className="text-slate-400 p-0.5">
                          {isTrayOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {isTrayOpen && (
                        <div className="mt-3 space-y-3 pt-2 border-t border-slate-200">
                          {/* Choose which product to pull info from */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-slate-500 font-medium">来源产品:</span>
                            <select
                              value={tray.productId}
                              onChange={(e) => handleChangeTrayProduct(pos.id, e.target.value)}
                              className="text-xs border border-slate-300 rounded p-1.5 bg-white font-medium text-slate-800"
                            >
                              {activeProducts.length === 0 ? (
                                <option value="">左侧尚未勾选本期产品</option>
                              ) : (
                                activeProducts.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.productName} ({p.price || '无价格'})
                                  </option>
                                ))
                              )}
                            </select>

                          </div>

                          {/* Base toggles */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-2.5 rounded border border-slate-200">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                              <input
                                type="checkbox"
                                checked={Boolean(tray.fields?.productName)}
                                onChange={() => handleToggleTrayField(pos.id, 'productName')}
                                className="rounded text-indigo-600"
                              />
                              <span>产品名称</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                              <input
                                type="checkbox"
                                checked={Boolean(tray.fields?.description)}
                                onChange={() => handleToggleTrayField(pos.id, 'description')}
                                className="rounded text-indigo-600"
                              />
                              <span>产品描述</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                              <input
                                type="checkbox"
                                checked={Boolean(tray.fields?.features)}
                                onChange={() => handleToggleTrayField(pos.id, 'features')}
                                className="rounded text-indigo-600"
                              />
                              <span>卖点</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                              <input
                                type="checkbox"
                                checked={Boolean(tray.fields?.specifications)}
                                onChange={() => handleToggleTrayField(pos.id, 'specifications')}
                                className="rounded text-indigo-600"
                              />
                              <span>产品参数</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                              <input
                                type="checkbox"
                                checked={Boolean(tray.fields?.targetUseCases)}
                                onChange={() => handleToggleTrayField(pos.id, 'targetUseCases')}
                                className="rounded text-indigo-600"
                              />
                              <span>适用场景</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                              <input
                                type="checkbox"
                                checked={Boolean(tray.fields?.price)}
                                onChange={() => handleToggleTrayField(pos.id, 'price')}
                                className="rounded text-indigo-600"
                              />
                              <span>价格/活动价</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                              <input
                                type="checkbox"
                                checked={Boolean(tray.fields?.productUrl)}
                                onChange={() => handleToggleTrayField(pos.id, 'productUrl')}
                                className="rounded text-indigo-600"
                              />
                              <span>产品链接</span>
                            </label>
                          </div>

                          {/* 1. Granular Description Selection */}
                          {Boolean(tray.fields?.description) && currProd && (
                            <div className="bg-indigo-50/40 border border-indigo-100 rounded-lg p-3 text-xs space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-indigo-900">
                                  选择插入的具体描述（已选{' '}
                                  {tray.selectedDescriptionIndices?.length || 0} 项）:
                                </span>
                              </div>

                              {currProd.descriptions && currProd.descriptions.length > 0 ? (
                                <div className="space-y-1.5">
                                  {currProd.descriptions.map((d, dIdx) => {
                                    const isChecked = (
                                      tray.selectedDescriptionIndices || []
                                    ).includes(dIdx);
                                    return (
                                      <label
                                        key={d.id || dIdx}
                                        className={`flex items-start gap-2 p-2 rounded cursor-pointer transition text-xs border ${
                                          isChecked
                                            ? 'bg-white border-indigo-300 text-slate-800 shadow-2xs'
                                            : 'bg-white/60 border-slate-200 text-slate-500'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() =>
                                            handleToggleDescriptionIndex(pos.id, dIdx)
                                          }
                                          className="mt-0.5 rounded text-indigo-600"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <span className="font-bold text-indigo-700 mr-1.5 text-[11px] bg-indigo-50 px-1.5 py-0.5 rounded">
                                            {d.keyword || `描述 ${dIdx + 1}`}
                                          </span>
                                          <span className="text-[11px] leading-relaxed">
                                            {d.content}
                                          </span>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              ) : currProd.productDescription ? (
                                <p className="text-slate-600 text-xs bg-white p-2 rounded border border-indigo-100">
                                  {stripDescriptionLabel(currProd.productDescription)}
                                </p>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  该产品暂未添加描述文本
                                </span>
                              )}
                            </div>
                          )}

                          {/* 2. Granular Feature & Language Style Selection */}
                          {Boolean(tray.fields?.features) && currProd && (
                            <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3 text-xs space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-emerald-900">
                                  选择插入的产品功能以及对应的语言描述风格:
                                </span>
                              </div>

                              {currProd.featuresList && currProd.featuresList.length > 0 ? (
                                <div className="space-y-2">
                                  {currProd.featuresList.map((feat) => {
                                    const isSelected =
                                      tray.selectedFeatures && feat.id in tray.selectedFeatures;
                                    const selectedVariantIdx =
                                      tray.selectedFeatures?.[feat.id] ?? 0;

                                    return (
                                      <div
                                        key={feat.id}
                                        className={`p-2.5 rounded-lg border transition ${
                                          isSelected
                                            ? 'bg-white border-emerald-300 shadow-2xs'
                                            : 'bg-white/60 border-slate-200'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() =>
                                                handleToggleFeature(pos.id, feat.id, selectedVariantIdx)
                                              }
                                              className="rounded text-emerald-600"
                                            />
                                            <span className="font-bold text-xs text-slate-800">
                                              {feat.name}
                                            </span>
                                          </label>

                                          {/* Language Style Dropdown for this feature */}
                                          {feat.descriptions && feat.descriptions.length > 1 && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-slate-400">风格:</span>
                                              <select
                                                value={selectedVariantIdx}
                                                disabled={!isSelected}
                                                onChange={(e) =>
                                                  handleSelectFeatureVariant(
                                                    pos.id,
                                                    feat.id,
                                                    Number(e.target.value)
                                                  )
                                                }
                                                className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-medium disabled:opacity-50"
                                              >
                                                {feat.descriptions.map((variant, vIdx) => (
                                                  <option key={variant.id || vIdx} value={vIdx}>
                                                    {variant.style || `风格 ${vIdx + 1}`}
                                                  </option>
                                                ))}
                                              </select>
                                            </div>
                                          )}
                                        </div>

                                        {/* Preview of chosen variant text */}
                                        {isSelected && feat.descriptions?.[selectedVariantIdx] && (
                                          <div className="mt-1.5 pl-6 text-[11px] text-slate-600 bg-slate-50/70 p-1.5 rounded">
                                            <span className="font-semibold text-emerald-700 mr-1">
                                              [{feat.descriptions[selectedVariantIdx].style}]:
                                            </span>
                                            {feat.descriptions[selectedVariantIdx].text}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : currProd.features || currProd.keySellingPoints ? (
                                <p className="text-slate-600 text-xs bg-white p-2 rounded border border-emerald-100">
                                  {[currProd.features, currProd.keySellingPoints].filter(Boolean).join('\n')}
                                </p>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  该产品暂未配置功能卖点
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action Button: Insert */}
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleInsertContent(pos.id)}
                              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-xs transition"
                            >
                              插入选中信息至下方文案
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Row: Content Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-800">
                          文案内容 (可自由编辑标题 / 描述 / 卖点文案)
                        </label>
                        <span className="text-[10px] text-slate-400">
                          在此编辑不会影响产品库原始数据
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={pos.content}
                        onChange={(e) => handleUpdatePositionField(pos.id, 'content', e.target.value)}
                        placeholder="输入自定义文案或点击上方插入产品信息..."
                        className="w-full text-xs font-mono border border-slate-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                      />
                    </div>

                    {/* REQUIREMENT 1: CTA BUTTONS WITH LIBRARY INTEGRATION */}
                    <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <MousePointerClick className="w-3.5 h-3.5 text-indigo-600" />
                          <span>CTA 按钮设定 (Call to Action)</span>
                        </label>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCtaPickerPosId(pos.id)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md transition"
                          >
                            <MousePointerClick className="w-3 h-3" />
                            <span>从 CTA 库选择</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddCtaToPosition(pos.id)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>添加按钮</span>
                          </button>
                        </div>
                      </div>

                      {/* CTA Buttons list */}
                      <div className="space-y-2">
                        {(!pos.ctas || pos.ctas.length === 0) ? (
                          <div className="text-[11px] text-slate-400 py-1.5 italic">
                            当前板块暂无 CTA 按钮。可点击右上角从文案库选择或新增按钮。
                          </div>
                        ) : (
                          pos.ctas.map((cta, ctaIdx) => (
                            <div
                              key={cta.id || ctaIdx}
                              className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center gap-2"
                            >
                              <span className="text-[10px] font-bold text-slate-400">
                                按钮 {ctaIdx + 1}
                              </span>

                              {/* CTA Text */}
                              <div className="flex-1 min-w-[120px]">
                                <input
                                  type="text"
                                  value={cta.text}
                                  onChange={(e) =>
                                    handleUpdateCta(pos.id, cta.id, { text: e.target.value })
                                  }
                                  placeholder="按钮文案 (如: SHOP NOW)"
                                  className="w-full text-xs font-bold border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>

                              {/* CTA Link */}
                              <div className="flex-1 min-w-[180px]">
                                <input
                                  type="text"
                                  value={cta.link || ''}
                                  onChange={(e) =>
                                    handleUpdateCta(pos.id, cta.id, { link: e.target.value })
                                  }
                                  placeholder="按钮跳转链接 (可选)"
                                  className="w-full text-xs font-mono border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>

                              {/* Category Badge */}
                              {cta.category && (
                                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                                  {cta.category}
                                </span>
                              )}

                              {/* Delete CTA Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCta(pos.id, cta.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                                title="删除此 CTA 按钮"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Row: Link Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-slate-400" />
                        <span>板块主跳转链接 (Link)</span>
                      </label>
                      <input
                        type="text"
                        value={pos.link}
                        onChange={(e) => handleUpdatePositionField(pos.id, 'link', e.target.value)}
                        placeholder="https://... (商品页或活动页链接)"
                        className="w-full text-xs border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    {/* Row: Key Requirements */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        核心制作要求 (给设计师/排版人员的执行指引)
                      </label>
                      <input
                        type="text"
                        value={pos.keyRequirements}
                        onChange={(e) => handleUpdatePositionField(pos.id, 'keyRequirements', e.target.value)}
                        placeholder="例如：白底产品抠图、秋季露营氛围微暖色调、粗体醒目大标题、展示促销角标..."
                        className="w-full text-xs border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
            <button
              onClick={handleAddPosition}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="w-4 h-4" />
              <span>新增板块</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onExportExcel}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-md transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>导出 Excel (EDM_Planning.xlsx)</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2 rounded-md shadow transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? '保存中...' : '保存所有更改'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Image Zoom Modal */}
      <ImageZoomModal
        isOpen={zoomImage.isOpen}
        onClose={() => setZoomImage({ isOpen: false, url: '', title: '' })}
        imageUrl={zoomImage.url}
        title={zoomImage.title}
        referenceUrl={zoomImage.referenceUrl}
      />

      {/* CTA Picker Modal */}
      <CtaPickerModal
        isOpen={Boolean(ctaPickerPosId)}
        onClose={() => setCtaPickerPosId(null)}
        ctaCopies={ctaCopies}
        onSelectCta={(ctaData) => {
          if (ctaPickerPosId) {
            handleAddCtaToPosition(ctaPickerPosId, ctaData);
          }
        }}
        onOpenCtaLibrary={onOpenCtaLibrary}
      />

      <TemplatePickerModal
        isOpen={Boolean(templatePickerPosId)}
        onClose={() => setTemplatePickerPosId(null)}
        positionName={positions.find((p) => p.id === templatePickerPosId)?.name || ''}
        currentDisplayType={positions.find((p) => p.id === templatePickerPosId)?.displayType}
        templates={templates}
        displayTypes={displayTypes}
        isHero={positions.find((p) => p.id === templatePickerPosId)?.name.toLowerCase().trim() === 'hero'}
        onSelectTemplate={(template) => {
          if (templatePickerPosId) {
            handleSelectTemplate(templatePickerPosId, template.id);
          }
          setTemplatePickerPosId(null);
        }}
        onZoomImage={(url, title, referenceUrl) =>
          setZoomImage({ isOpen: true, url, title, referenceUrl })
        }
      />

      <DisplayTypeManagerModal
        isOpen={displayTypeModalOpen}
        onClose={() => setDisplayTypeModalOpen(false)}
        displayTypes={displayTypes}
        onSaveDisplayTypes={async (config) => {
          if (onSaveDisplayTypes) await onSaveDisplayTypes(config);
        }}
      />
    </div>
  );
};
