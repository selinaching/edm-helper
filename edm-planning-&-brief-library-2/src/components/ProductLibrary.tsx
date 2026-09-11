import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Upload,
  ExternalLink,
  X,
  Building2,
  ArrowLeft,
  LayoutGrid,
  List,
  Sparkles,
  Tag,
  Eye,
  Layers,
} from 'lucide-react';
import {
  Product,
  Brand,
  ProductDescriptionItem,
  ProductFeatureItem,
  FeatureDescriptionVariant,
} from '../types';

interface ProductLibraryProps {
  products: Product[];
  brands: Brand[];
  selectedBrand: string;
  onSaveProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onOpenImport: () => void;
}

export const ProductLibrary: React.FC<ProductLibraryProps> = ({
  products,
  brands,
  selectedBrand,
  onSaveProduct,
  onDeleteProduct,
  onOpenImport,
}) => {
  // Brand directory active brand
  const [activeBrandView, setActiveBrandView] = useState<string | null>(
    selectedBrand !== 'ALL' ? selectedBrand : null
  );

  // Search brand in Brand Directory
  const [brandSearchTerm, setBrandSearchTerm] = useState('');

  // Inside Brand Workspace states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProductDetail, setViewingProductDetail] = useState<Product | null>(null);

  // Form fields
  const [formBrand, setFormBrand] = useState(brands[0]?.name || 'FireMaple');
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [productType, setProductType] = useState('');
  const [discount, setDiscount] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [price, setPrice] = useState('');

  // Form structured descriptions: { id, keyword, content }
  const [formDescriptions, setFormDescriptions] = useState<
    { id: string; keyword: string; content: string }[]
  >([{ id: 'desc_1', keyword: '短描述', content: '' }]);

  // Form structured featuresList: { id, name, descriptions: [{ id, style, text }] }
  const [formFeatures, setFormFeatures] = useState<
    { id: string; name: string; descriptions: { id: string; style: string; text: string }[] }[]
  >([]);

  const [specifications, setSpecifications] = useState('');
  const [targetUseCases, setTargetUseCases] = useState('');
  const [productImages, setProductImages] = useState('');
  const [productStatus, setProductStatus] = useState('Active');
  const [isSaving, setIsSaving] = useState(false);

  // Derive unique brands
  const allBrandNames = Array.from(
    new Set([...brands.map((b) => b.name), ...products.map((p) => p.brand).filter(Boolean)])
  );

  const filteredBrands = allBrandNames.filter((bName) =>
    brandSearchTerm ? bName.toLowerCase().includes(brandSearchTerm.toLowerCase()) : true
  );

  const currentBrandProducts = activeBrandView
    ? products.filter((p) => p.brand.toLowerCase() === activeBrandView.toLowerCase())
    : [];

  const brandProductTypes = Array.from(
    new Set(currentBrandProducts.map((p) => p.productType).filter(Boolean))
  );

  // Helper to extract normalized description list
  const getNormalizedDescriptions = (p: Product): { keyword: string; content: string }[] => {
    if (p.descriptions && p.descriptions.length > 0) {
      return p.descriptions.map((d, i) => {
        if (typeof d === 'string') return { keyword: `描述 ${i + 1}`, content: d };
        return { keyword: d.keyword || `描述 ${i + 1}`, content: d.content || '' };
      });
    }
    if (p.productDescription && p.productDescription.trim()) {
      return p.productDescription
        .split('\n')
        .filter(Boolean)
        .map((line, i) => ({ keyword: `描述 ${i + 1}`, content: line }));
    }
    return [];
  };

  const filteredProducts = currentBrandProducts.filter((p) => {
    const matchesType = typeFilter === 'ALL' || p.productType.toLowerCase() === typeFilter.toLowerCase();
    const descText = getNormalizedDescriptions(p).map((d) => d.content).join(' ');
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = searchTerm
      ? p.productName.toLowerCase().includes(searchLow) ||
        (p.sku && p.sku.toLowerCase().includes(searchLow)) ||
        descText.toLowerCase().includes(searchLow) ||
        (p.features && p.features.toLowerCase().includes(searchLow)) ||
        (p.keySellingPoints && p.keySellingPoints.toLowerCase().includes(searchLow))
      : true;
    return matchesType && matchesSearch;
  });

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormBrand(activeBrandView || brands[0]?.name || 'FireMaple');
    setSku('');
    setProductName('');
    setProductUrl('');
    setProductType('');
    setDiscount('');
    setOriginalPrice('');
    setPrice('');
    setFormDescriptions([
      { id: `desc_${Date.now()}_1`, keyword: '短描述', content: '' },
      { id: `desc_${Date.now()}_2`, keyword: '详细描述', content: '' },
    ]);
    setFormFeatures([
      {
        id: `feat_${Date.now()}_1`,
        name: '核心功能',
        descriptions: [{ id: `var_1`, style: '通用版', text: '' }],
      },
    ]);
    setSpecifications('');
    setTargetUseCases('');
    setProductImages('');
    setProductStatus('Active');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormBrand(p.brand);
    setSku(p.sku || '');
    setProductName(p.productName);
    setProductUrl(p.productUrl || '');
    setProductType(p.productType || '');
    setDiscount(p.discount || '');
    setOriginalPrice(p.originalPrice || '');
    setPrice(p.price || '');

    const normDescs = getNormalizedDescriptions(p);
    setFormDescriptions(
      normDescs.length > 0
        ? normDescs.map((d, i) => ({ id: `desc_${i}`, keyword: d.keyword, content: d.content }))
        : [{ id: 'desc_1', keyword: '短描述', content: '' }]
    );

    if (p.sellingPoints && p.sellingPoints.length > 0) {
      setFormFeatures(
        p.sellingPoints.map((sp, sIdx) => ({
          id: sp.id || `sp_${sIdx}`,
          name: sp.title,
          descriptions: (sp.descriptions || []).map((d, dIdx) => ({
            id: d.id || `spd_${dIdx}`,
            style: d.label || `描述 ${dIdx + 1}`,
            text: d.text,
          })),
        }))
      );
    } else if (p.featuresList && p.featuresList.length > 0) {
      setFormFeatures(
        p.featuresList.map((f, fIdx) => ({
          id: f.id || `feat_${fIdx}`,
          name: f.name,
          descriptions: (f.descriptions || []).map((v, vIdx) => ({
            id: v.id || `var_${vIdx}`,
            style: v.style || `描述 ${vIdx + 1}`,
            text: v.text,
          })),
        }))
      );
    } else if (p.features || p.keySellingPoints) {
      const combined = [p.features, p.keySellingPoints].filter(Boolean).join('\n');
      setFormFeatures([
        {
          id: `feat_0`,
          name: '卖点A',
          descriptions: [{ id: 'var_0', style: '描述1', text: combined }],
        },
      ]);
    } else {
      setFormFeatures([]);
    }

    setSpecifications(p.parameters || p.specifications || '');
    setTargetUseCases(p.targetUseCases || '');
    setProductImages((p.productImages || []).join('\n'));
    setProductStatus(p.productStatus || 'Active');
    setIsModalOpen(true);
  };

  // Description form controls
  const handleAddDescription = () => {
    setFormDescriptions((prev) => [
      ...prev,
      { id: `desc_${Date.now()}`, keyword: `描述 ${prev.length + 1}`, content: '' },
    ]);
  };

  const handleRemoveDescription = (id: string) => {
    setFormDescriptions((prev) => {
      const next = prev.filter((d) => d.id !== id);
      return next.length > 0
        ? next
        : [{ id: `desc_${Date.now()}`, keyword: '短描述', content: '' }];
    });
  };

  const handleUpdateDescription = (id: string, field: 'keyword' | 'content', value: string) => {
    setFormDescriptions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  // Feature / Selling Point form controls
  const handleAddFeature = () => {
    setFormFeatures((prev) => [
      ...prev,
      {
        id: `feat_${Date.now()}`,
        name: `卖点${String.fromCharCode(65 + prev.length)}`,
        descriptions: [{ id: `var_${Date.now()}`, style: '描述1', text: '' }],
      },
    ]);
  };

  const handleRemoveFeature = (featId: string) => {
    setFormFeatures((prev) => prev.filter((f) => f.id !== featId));
  };

  const handleUpdateFeatureName = (featId: string, name: string) => {
    setFormFeatures((prev) =>
      prev.map((f) => (f.id === featId ? { ...f, name } : f))
    );
  };

  const handleAddFeatureVariant = (featId: string) => {
    setFormFeatures((prev) =>
      prev.map((f) => {
        if (f.id === featId) {
          return {
            ...f,
            descriptions: [
              ...f.descriptions,
              { id: `var_${Date.now()}`, style: `描述${f.descriptions.length + 1}`, text: '' },
            ],
          };
        }
        return f;
      })
    );
  };

  const handleRemoveFeatureVariant = (featId: string, varId: string) => {
    setFormFeatures((prev) =>
      prev.map((f) => {
        if (f.id === featId) {
          const nextVars = f.descriptions.filter((v) => v.id !== varId);
          return {
            ...f,
            descriptions:
              nextVars.length > 0
                ? nextVars
                : [{ id: `var_${Date.now()}`, style: '通用版', text: '' }],
          };
        }
        return f;
      })
    );
  };

  const handleUpdateFeatureVariant = (
    featId: string,
    varId: string,
    field: 'style' | 'text',
    value: string
  ) => {
    setFormFeatures((prev) =>
      prev.map((f) => {
        if (f.id === featId) {
          return {
            ...f,
            descriptions: f.descriptions.map((v) =>
              v.id === varId ? { ...v, [field]: value } : v
            ),
          };
        }
        return f;
      })
    );
  };

  // Save product form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const imgArray = productImages
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    // Filter valid descriptions
    const cleanDescriptions: ProductDescriptionItem[] = formDescriptions
      .filter((d) => d.content.trim())
      .map((d) => ({
        id: d.id,
        keyword: d.keyword.trim() || '描述',
        content: d.content.trim(),
      }));

    // Filter valid selling points / features
    const cleanSellingPoints = formFeatures
      .filter((f) => f.name.trim())
      .map((f) => ({
        id: f.id,
        title: f.name.trim(),
        descriptions: f.descriptions
          .filter((v) => v.text.trim())
          .map((v) => ({
            id: v.id,
            label: v.style.trim() || '描述',
            text: v.text.trim(),
          })),
      }));

    const cleanFeaturesList: ProductFeatureItem[] = cleanSellingPoints.map((sp) => ({
      id: sp.id,
      name: sp.title,
      descriptions: sp.descriptions.map((d) => ({
        id: d.id,
        style: d.label,
        text: d.text,
      })),
    }));

    const productItem: Product = {
      id: editingProduct ? editingProduct.id : `prod_${Date.now()}`,
      brand: formBrand,
      sku: sku.trim() || undefined,
      productName: productName.trim(),
      productUrl: productUrl.trim(),
      productType: productType.trim() || '常规',
      discount: discount.trim() || undefined,
      originalPrice: originalPrice.trim() || undefined,
      price: price.trim(),
      descriptions: cleanDescriptions,
      productDescription: cleanDescriptions.map((d) => `[${d.keyword}]: ${d.content}`).join('\n'),
      sellingPoints: cleanSellingPoints,
      featuresList: cleanFeaturesList,
      features: cleanFeaturesList.map((f) => f.name).join('; '),
      parameters: specifications.trim(),
      specifications: specifications.trim(),
      targetUseCases: targetUseCases.trim(),
      productImages: imgArray,
      productStatus,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onSaveProduct(productItem);
      setIsModalOpen(false);
    } catch (err) {
      alert('保存产品失败: ' + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. BRAND DIRECTORY VIEW */}
      {activeBrandView === null ? (
        <div className="space-y-5 animate-fade-in">
          {/* Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">产品库 · 品牌检索中心</h1>
                <p className="text-xs text-slate-500">
                  按品牌独立管理产品。请先选择或检索品牌，进入该品牌的产品库进行管理。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="检索品牌名称 (如 FireMaple, Blackdog)..."
                  value={brandSearchTerm}
                  onChange={(e) => setBrandSearchTerm(e.target.value)}
                  className="text-xs border border-slate-300 rounded-xl pl-9 pr-4 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
              </div>

              <button
                onClick={onOpenImport}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>批量导入 Excel</span>
              </button>
            </div>
          </div>

          {/* Brands Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBrands.map((bName) => {
              const brandProds = products.filter(
                (p) => p.brand.toLowerCase() === bName.toLowerCase()
              );
              return (
                <div
                  key={bName}
                  onClick={() => {
                    setActiveBrandView(bName);
                    setTypeFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center border border-emerald-200">
                          {bName.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {bName}
                          </h3>
                          <span className="text-[11px] text-slate-400">品牌产品资产</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {brandProds.length} 款
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">包含产品:</span>
                        <span className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          共 {brandProds.length} 款
                        </span>
                      </div>
                      {brandProds.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">暂无产品记录</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {brandProds.slice(0, 8).map((prod) => (
                            <span
                              key={prod.id}
                              className="bg-white border border-slate-200 text-slate-800 text-[11px] px-2 py-1 rounded-lg font-medium shadow-2xs hover:border-emerald-400 hover:text-emerald-700 transition"
                              title={prod.productName}
                            >
                              {prod.productName}
                            </span>
                          ))}
                          {brandProds.length > 8 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{brandProds.length - 8} 款更多...
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>进入 {bName} 产品管理</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 2. BRAND PRODUCTS WORKSPACE */
        <div className="space-y-4 animate-fade-in">
          {/* Top Brand Navigation & Switch Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveBrandView(null)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回品牌检索</span>
              </button>

              <div className="h-5 w-px bg-slate-200" />

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
                    {activeBrandView}
                  </span>
                  <span className="text-xs text-slate-500">
                    共 {currentBrandProducts.length} 款产品
                  </span>
                </div>
                <h1 className="text-base font-bold text-slate-900 mt-0.5">
                  {activeBrandView} 产品管理库
                </h1>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                <span className="text-slate-400">切换品牌:</span>
                <select
                  value={activeBrandView}
                  onChange={(e) => {
                    setActiveBrandView(e.target.value);
                    setTypeFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {allBrandNames.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`在 ${activeBrandView} 中搜索...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 w-52 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {brandProductTypes.length > 0 && (
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700"
                >
                  <option value="ALL">全部品类</option>
                  {brandProductTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}

              {/* View Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                  title="表格视图"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded ${
                    viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                  title="卡片视图"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
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
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增产品</span>
              </button>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-28">品牌</th>
                      <th className="py-3 px-4 w-48">产品名称 / SKU</th>
                      <th className="py-3 px-4 w-24">品类</th>
                      <th className="py-3 px-4 w-36">价格与优惠</th>
                      <th className="py-3 px-4">产品描述 (缩略预览)</th>
                      <th className="py-3 px-4 w-36">功能与特点</th>
                      <th className="py-3 px-4 w-20">状态</th>
                      <th className="py-3 px-4 text-right w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          暂无符合条件的产品。点击右上角「新增产品」添加首款产品。
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const descs = getNormalizedDescriptions(p);
                        const firstDesc = descs[0];
                        const moreCount = descs.length - 1;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                            <td className="py-3 px-4">
                              <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                                {p.brand}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900 leading-tight">
                                {p.productName}
                              </div>
                              {p.sku && (
                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                  SKU: {p.sku}
                                </span>
                              )}
                              {p.productUrl && (
                                <a
                                  href={p.productUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 font-mono truncate max-w-xs mt-0.5"
                                >
                                  <span>链接</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                                {p.productType || '常规'}
                              </span>
                            </td>
                            {/* Price & Strikethrough Logic */}
                            <td className="py-3 px-4">
                              <div className="space-y-0.5">
                                {p.discount && (
                                  <span className="inline-block bg-rose-50 text-rose-700 font-bold px-1.5 py-0.2 rounded text-[10px] border border-rose-200">
                                    {p.discount}
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5">
                                  {p.originalPrice && (
                                    <span className="text-[11px] text-slate-400 line-through">
                                      {p.originalPrice}
                                    </span>
                                  )}
                                  <span className="font-bold text-slate-900 text-xs">
                                    {p.price || '—'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Descriptions breakdown (Abbreviated per requirement) */}
                            <td className="py-3 px-4 text-slate-600">
                              {descs.length === 0 ? (
                                <span className="text-slate-400 italic text-[11px]">暂无描述</span>
                              ) : (
                                <div className="space-y-1 max-w-md">
                                  <div className="flex items-start gap-1.5 text-[11px]">
                                    <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] shrink-0 border border-indigo-100">
                                      {firstDesc.keyword}
                                    </span>
                                    <span className="text-slate-700 truncate max-w-[260px]">
                                      {firstDesc.content}
                                    </span>
                                    {moreCount > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setViewingProductDetail(p)}
                                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded shrink-0 transition"
                                      >
                                        +{moreCount} 更多
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Features list summary */}
                            <td className="py-3 px-4 text-slate-600">
                              {p.featuresList && p.featuresList.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingProductDetail(p)}
                                  className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 transition"
                                >
                                  {p.featuresList.length} 项功能卖点
                                </button>
                              ) : (
                                <div className="text-[11px] text-slate-500 truncate max-w-[120px]">
                                  {p.keySellingPoints || p.features || '—'}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  p.productStatus === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {p.productStatus === 'Active' ? '在售' : p.productStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setViewingProductDetail(p)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                                  title="查看完整详情"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(p)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                                  title="编辑"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`确定删除产品「${p.productName}」？`))
                                      onDeleteProduct(p.id);
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
          )}

          {/* CARDS VIEW */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                const descs = getNormalizedDescriptions(p);
                const firstDesc = descs[0];

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-emerald-300 transition"
                  >
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {p.brand}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {p.discount && (
                            <span className="bg-rose-50 text-rose-700 font-bold px-1.5 py-0.2 rounded text-[10px] border border-rose-200">
                              {p.discount}
                            </span>
                          )}
                          {p.originalPrice && (
                            <span className="text-[11px] text-slate-400 line-through">
                              {p.originalPrice}
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-900">{p.price}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{p.productName}</h3>
                        {p.sku && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {p.sku}
                          </span>
                        )}
                      </div>

                      {/* Descriptions summary */}
                      {firstDesc && (
                        <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-indigo-700 text-[10px] bg-indigo-50 px-1 rounded">
                              {firstDesc.keyword}
                            </span>
                            {descs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setViewingProductDetail(p)}
                                className="text-[10px] text-indigo-600 font-semibold"
                              >
                                共 {descs.length} 条描述 ➔
                              </button>
                            )}
                          </div>
                          <p className="text-slate-700 line-clamp-2 text-[11px]">
                            {firstDesc.content}
                          </p>
                        </div>
                      )}

                      {/* Features */}
                      {p.featuresList && p.featuresList.length > 0 ? (
                        <div className="text-[11px] bg-emerald-50/60 p-2 rounded text-emerald-900 border border-emerald-100 flex items-center justify-between">
                          <span className="font-semibold">
                            包含 {p.featuresList.length} 项功能卖点 (多风格)
                          </span>
                          <button
                            type="button"
                            onClick={() => setViewingProductDetail(p)}
                            className="text-[10px] text-emerald-700 font-bold"
                          >
                            查看
                          </button>
                        </div>
                      ) : p.keySellingPoints ? (
                        <div className="text-[11px] bg-emerald-50/50 p-2 rounded text-slate-700 border border-emerald-100">
                          <p className="line-clamp-2 text-[11px]">{p.keySellingPoints}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                      {p.productUrl ? (
                        <a
                          href={p.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span>商城链接</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400">无链接</span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingProductDetail(p)}
                          className="text-slate-500 hover:text-slate-900 text-xs font-medium"
                        >
                          详情
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="text-slate-500 hover:text-slate-900 text-xs font-medium"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定删除产品「${p.productName}」？`)) onDeleteProduct(p.id);
                          }}
                          className="text-rose-500 hover:text-rose-700 text-xs font-medium"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. PRODUCT DETAILS MODAL */}
      {viewingProductDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setViewingProductDetail(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                    {viewingProductDetail.brand}
                  </span>
                  {viewingProductDetail.sku && (
                    <span className="text-xs text-slate-400 font-mono">
                      SKU: {viewingProductDetail.sku}
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-white mt-1">
                  {viewingProductDetail.productName}
                </h2>
              </div>
              <button
                onClick={() => setViewingProductDetail(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Pricing Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                    价格体系
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {viewingProductDetail.originalPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        原价: {viewingProductDetail.originalPrice}
                      </span>
                    )}
                    <span className="text-sm font-bold text-slate-900">
                      活动现价: {viewingProductDetail.price || '未填'}
                    </span>
                    {viewingProductDetail.discount && (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {viewingProductDetail.discount}
                      </span>
                    )}
                  </div>
                </div>

                {viewingProductDetail.productUrl && (
                  <a
                    href={viewingProductDetail.productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
                  >
                    <span>商城外链</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* All Descriptions */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">多版本产品描述 (Descriptions):</h4>
                <div className="space-y-2">
                  {getNormalizedDescriptions(viewingProductDetail).map((d, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-1"
                    >
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {d.keyword}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed mt-1">{d.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Features */}
              {viewingProductDetail.featuresList && viewingProductDetail.featuresList.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2">
                    产品特点与多风格卖点 (Features):
                  </h4>
                  <div className="space-y-2">
                    {viewingProductDetail.featuresList.map((f, i) => (
                      <div key={i} className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/30">
                        <span className="font-bold text-xs text-emerald-950 block mb-1">
                          • {f.name}
                        </span>
                        <div className="space-y-1 pl-3">
                          {f.descriptions.map((v, vIdx) => (
                            <div key={vIdx} className="text-xs text-slate-700">
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded mr-1">
                                {v.style}
                              </span>
                              <span>{v.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingProductDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">
                  {editingProduct ? '编辑产品信息' : '新增产品'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  支持 SKU、折扣、划线原价、多关键词描述以及细粒度功能风格
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Row 1: Brand, Product Name, SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">所属品牌</label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {allBrandNames.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    产品名称 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如：海燕 600ml 超轻聚能锅"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU 编码</label>
                  <input
                    type="text"
                    placeholder="例如：FMC-218"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Row 2: Pricing Structure (Discount, Original Price, Price) */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-amber-900 block">
                  价格与促销设置 (支持原价划线展示与优惠标签)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      活动优惠信息 (Discount)
                    </label>
                    <input
                      type="text"
                      placeholder="如: 8折 / 20% OFF / 降价$10"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      原价 (划线价 Original Price)
                    </label>
                    <input
                      type="text"
                      placeholder="如: $49.99"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      活动价 / 现价 (Activity Price) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="如: $39.95"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Product URL & Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">产品链接</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">品类</label>
                  <input
                    type="text"
                    placeholder="如: 炉具 / 锅具 / 帐篷"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">在售状态</label>
                  <select
                    value={productStatus}
                    onChange={(e) => setProductStatus(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
                  >
                    <option value="Active">Active (在售)</option>
                    <option value="Draft">Draft (草稿)</option>
                    <option value="Archived">Archived (已下架)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Dynamic Descriptions with Custom Keywords */}
              <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-indigo-950">
                      多版本描述库 (支持自定义关键词，如：短描述、轻量化、详细说明)
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      在写 Brief 时可以具体按关键词选择插入某一段描述
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDescription}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1 rounded-md transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>新增描述项</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formDescriptions.map((desc, idx) => (
                    <div
                      key={desc.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">
                            描述 {idx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder="关键词 (如: 短描述 / 详细版)"
                            value={desc.keyword}
                            onChange={(e) =>
                              handleUpdateDescription(desc.id, 'keyword', e.target.value)
                            }
                            className="text-xs font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-200 rounded px-2 py-0.5 w-36"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDescription(desc.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        placeholder="输入该项对应的具体产品描述文案..."
                        value={desc.content}
                        onChange={(e) =>
                          handleUpdateDescription(desc.id, 'content', e.target.value)
                        }
                        className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 5: Dynamic Features with Multiple Language Styles */}
              <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-emerald-950">
                      产品卖点 (支持卖点A对应描述1、描述2、描述3...)
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      每个卖点可添加多条不同描述文案，写 Brief 时可选择插入具体卖点与描述
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-md transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>新增卖点</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formFeatures.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic py-2 text-center bg-white rounded-lg border border-dashed border-slate-200">
                      暂无卖点配置，可点击右上角添加
                    </div>
                  ) : (
                    formFeatures.map((feat) => (
                      <div
                        key={feat.id}
                        className="bg-white p-3 rounded-lg border border-slate-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="卖点名称 (如: 卖点A / 底部聚能环)"
                            value={feat.name}
                            onChange={(e) => handleUpdateFeatureName(feat.id, e.target.value)}
                            className="text-xs font-bold text-slate-900 border border-slate-300 rounded px-2.5 py-1 w-64"
                          />

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddFeatureVariant(feat.id)}
                              className="text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 font-medium"
                            >
                              + 新增描述
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(feat.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Variant list */}
                        <div className="space-y-2 pl-2 border-l-2 border-emerald-200">
                          {feat.descriptions.map((variant) => (
                            <div key={variant.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="描述 (如: 描述1)"
                                value={variant.style}
                                onChange={(e) =>
                                  handleUpdateFeatureVariant(
                                    feat.id,
                                    variant.id,
                                    'style',
                                    e.target.value
                                  )
                                }
                                className="w-24 text-[11px] border border-slate-300 rounded p-1 bg-slate-50 font-medium"
                              />
                              <input
                                type="text"
                                placeholder="对应卖点描述文案..."
                                value={variant.text}
                                onChange={(e) =>
                                  handleUpdateFeatureVariant(
                                    feat.id,
                                    variant.id,
                                    'text',
                                    e.target.value
                                  )
                                }
                                className="flex-1 text-xs border border-slate-300 rounded p-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveFeatureVariant(feat.id, variant.id)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Row 6: Specifications & Use Cases */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    产品参数 (Parameters)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="重量: 180g; 材质: 阳极氧化铝..."
                    value={specifications}
                    onChange={(e) => setSpecifications(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    适用场景 (Use Cases)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="适合徒步、登山、露营等轻量化户外活动..."
                    value={targetUseCases}
                    onChange={(e) => setTargetUseCases(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow disabled:opacity-50"
                >
                  {isSaving ? '保存中...' : editingProduct ? '更新产品信息' : '创建新产品'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
