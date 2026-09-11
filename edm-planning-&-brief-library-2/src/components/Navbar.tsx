import React from 'react';
import {
  Calendar as CalendarIcon,
  BookOpen,
  Package,
  LayoutTemplate,
  Sliders,
  Settings,
  Download,
  Upload,
  Layers,
  MousePointerClick,
} from 'lucide-react';
import { Brand } from '../types';

export type NavTab = 'calendar' | 'topics' | 'products' | 'templates' | 'cta' | 'formats' | 'settings' | 'brief';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  brands: Brand[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  onExportExcel: () => void;
  onOpenImport: (type: 'topics' | 'products' | 'calendar') => void;
  activeBriefId?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  brands,
  selectedBrand,
  onSelectBrand,
  onExportExcel,
  onOpenImport,
  activeBriefId,
}) => {
  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & App Title */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectTab('calendar')}>
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-white block">EDM 排期与需求库</span>
              <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">规划与资产管理</span>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => onSelectTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>排期日历</span>
            </button>

            {activeBriefId && (
              <button
                onClick={() => onSelectTab('brief')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'brief'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-indigo-300 hover:bg-indigo-950/50 border border-indigo-500/40'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span>当前需求单</span>
              </button>
            )}

            <button
              onClick={() => onSelectTab('topics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'topics'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>选题库</span>
            </button>

            <button
              onClick={() => onSelectTab('products')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>产品库</span>
            </button>

            <button
              onClick={() => onSelectTab('templates')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-purple-400" />
              <span>模板参考库</span>
            </button>

            <button
              onClick={() => onSelectTab('cta')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'cta'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <MousePointerClick className="w-3.5 h-3.5 text-pink-400" />
              <span>CTA 文案库</span>
            </button>

            <button
              onClick={() => onSelectTab('formats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'formats'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>形式管理</span>
            </button>

            <button
              onClick={() => onSelectTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>设置 / 备份</span>
            </button>
          </nav>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Brand Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-md px-2.5 py-1 text-xs">
            <span className="text-slate-400">品牌:</span>
            <select
              value={selectedBrand}
              onChange={(e) => onSelectBrand(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-slate-900 text-white">全部品牌</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name} className="bg-slate-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Import Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-md border border-slate-700 transition">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>导入 Excel</span>
            </button>
            <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-md shadow-xl py-1 hidden group-hover:block z-50">
              <button
                onClick={() => onOpenImport('calendar')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                导入排期日历
              </button>
              <button
                onClick={() => onOpenImport('topics')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                导入选题库
              </button>
              <button
                onClick={() => onOpenImport('products')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                导入产品库
              </button>
            </div>
          </div>

          {/* Export Excel (Dual Sheet) */}
          <button
            onClick={onExportExcel}
            title="导出包含 Calendar 与 Brief 双工作表的 Excel 文件"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 Excel</span>
          </button>
        </div>
      </div>
    </header>
  );
};
