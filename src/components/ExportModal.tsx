import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Calendar,
  FileText,
  Layers,
  Download,
  Filter,
  Check,
  Edit3,
} from 'lucide-react';
import { CalendarItem, EmailBrief } from '../types';
import { exportFlexibleExcel, ExportConfig } from '../services/excel';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarItems: CalendarItem[];
  briefs: EmailBrief[];
  activeBrand: string;
  initialTarget?: 'both' | 'calendar' | 'brief';
  initialBriefId?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  calendarItems,
  briefs,
  activeBrand,
  initialTarget = 'calendar',
  initialBriefId,
}) => {
  const [target, setTarget] = useState<'both' | 'calendar' | 'brief'>(initialTarget);
  const [selectedBriefIds, setSelectedBriefIds] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string>(activeBrand !== 'ALL' ? activeBrand : 'ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Month selector for Month-View Calendar export
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    calendarItems.forEach((item) => {
      if (item.date && item.date.length >= 7) {
        monthSet.add(item.date.slice(0, 7));
      }
    });
    // Ensure default demo months and current month exist in list
    monthSet.add('2026-10');
    monthSet.add('2026-09');
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(currentMonthStr);
    return Array.from(monthSet).sort().reverse();
  }, [calendarItems]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => availableMonths[0] || '2026-10');
  const [calendarExportMode, setCalendarExportMode] = useState<'scheduled_only' | 'full_month'>('scheduled_only');
  const [customFilename, setCustomFilename] = useState<string>('');
  const [isCustomFilenameTouched, setIsCustomFilenameTouched] = useState<boolean>(false);

  // Reset or initialize state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const initTgt = initialTarget || 'calendar';
      setTarget(initTgt);
      setBrandFilter(activeBrand !== 'ALL' ? activeBrand : 'ALL');

      if (initialBriefId) {
        setSelectedBriefIds([initialBriefId]);
      } else {
        setSelectedBriefIds(briefs.map((b) => b.id));
      }

      setIsCustomFilenameTouched(false);
    }
  }, [isOpen, initialTarget, initialBriefId, activeBrand, briefs]);

  // Compute standard filename strictly based on user instructions:
  // "2. 导出的brief，命名为：品牌名+日期。导出日历，命名为：月份 calendar"
  const defaultFilename = useMemo(() => {
    let monthNum = 10;
    if (selectedMonth && selectedMonth !== 'ALL') {
      const parts = selectedMonth.split('-');
      monthNum = parts.length > 1 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
    }

    if (target === 'calendar') {
      return `${monthNum}月 calendar.xlsx`;
    }

    if (target === 'brief') {
      const chosenBriefs = briefs.filter((b) => selectedBriefIds.includes(b.id));
      if (chosenBriefs.length === 1) {
        const b = chosenBriefs[0];
        const brand = b.brand || 'EDM';
        const date = b.date || '2026-10-01';
        return `${brand}+${date}.xlsx`;
      } else if (chosenBriefs.length > 1) {
        const b = chosenBriefs[0];
        const brand = b.brand || 'EDM';
        const date = b.date || '2026-10-01';
        return `${brand}+${date}等.xlsx`;
      }
      return 'EDM+Brief.xlsx';
    }

    // Target === 'both'
    return `${monthNum}月 calendar.xlsx`;
  }, [target, selectedMonth, selectedBriefIds, briefs]);

  // Keep customFilename in sync with defaultFilename unless manually typed
  useEffect(() => {
    if (!isCustomFilenameTouched) {
      setCustomFilename(defaultFilename);
    }
  }, [defaultFilename, isCustomFilenameTouched]);

  if (!isOpen) return null;

  // Filter briefs based on brand filter in modal
  const filteredBriefs = briefs.filter((b) =>
    brandFilter === 'ALL' ? true : b.brand.toLowerCase() === brandFilter.toLowerCase()
  );

  // Quick brand options from briefs
  const uniqueBrands = Array.from(new Set(briefs.map((b) => b.brand).filter(Boolean)));

  const handleToggleBrief = (id: string) => {
    setSelectedBriefIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredBriefs.map((b) => b.id);
    setSelectedBriefIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleDeselectAllFiltered = () => {
    const filteredIds = new Set(filteredBriefs.map((b) => b.id));
    setSelectedBriefIds((prev) => prev.filter((id) => !filteredIds.has(id)));
  };

  const handleExport = async () => {
    if ((target === 'brief' || target === 'both') && selectedBriefIds.length === 0) {
      alert('请至少勾选 1 份要导出的 EDM 需求单，或者选择「仅导出日历排期」。');
      return;
    }

    setIsExporting(true);
    setExportSuccess(false);

    try {
      const config: ExportConfig = {
        target,
        selectedBriefIds,
        selectedMonth,
        calendarExportMode,
        filename: customFilename.trim() || defaultFilename,
      };

      await exportFlexibleExcel(calendarItems, briefs, config);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Export error:', err);
      alert('导出 Excel 失败: ' + String(err));
    } finally {
      setIsExporting(false);
    }
  };

  // Format month for display
  const formatMonthLabel = (mStr: string) => {
    const parts = mStr.split('-');
    if (parts.length === 2) {
      const mNum = parseInt(parts[1], 10);
      return `${parts[0]}年 ${mNum}月 (${mNum}月 calendar)`;
    }
    return mStr;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">导出 Excel 报表</h2>
              <p className="text-xs text-slate-500">
                支持月视图日历导出与自选需求单 Brief 导出
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Target Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. 选择导出类型
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option: Calendar Only */}
              <div
                onClick={() => setTarget('calendar')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  target === 'calendar'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                    <Calendar className="w-4 h-4" />
                  </div>
                  {target === 'calendar' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold mb-0.5">仅导出日历排期</h4>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    按月视图导出，命名为「月份 calendar」
                  </p>
                </div>
              </div>

              {/* Option: Brief Only */}
              <div
                onClick={() => setTarget('brief')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  target === 'brief'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <FileText className="w-4 h-4" />
                  </div>
                  {target === 'brief' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold mb-0.5">仅导出需求单 (Brief)</h4>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    内嵌参考图，命名为「品牌名+日期」
                  </p>
                </div>
              </div>

              {/* Option: Both */}
              <div
                onClick={() => setTarget('both')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  target === 'both'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                    <Layers className="w-4 h-4" />
                  </div>
                  {target === 'both' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold mb-0.5">日历 + 需求单 (双表合一)</h4>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    排期月视图与选中的需求单合并导出
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Month View Configuration (Shown if target is calendar or both) */}
          {(target === 'calendar' || target === 'both') && (
            <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  日历月视图导出设置
                </label>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  命名规范: 月份 calendar
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    选择导出月份 (月视图)
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setIsCustomFilenameTouched(false);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {availableMonths.map((mStr) => (
                      <option key={mStr} value={mStr}>
                        {formatMonthLabel(mStr)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    排期明细导出范围
                  </label>
                  <select
                    value={calendarExportMode}
                    onChange={(e) => setCalendarExportMode(e.target.value as 'scheduled_only' | 'full_month')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="scheduled_only">按排期日程导出 (仅有排期的日期 - 推荐)</option>
                    <option value="full_month">按当月完整日历导出 (1号至月末全天日历)</option>
                  </select>
                </div>
              </div>

              {/* Requirement 1 Column Specification Notice */}
              <div className="pt-2 border-t border-amber-200/60 flex items-start gap-2 text-[11px] text-amber-900">
                <span className="font-bold text-amber-700 shrink-0">表头列字段：</span>
                <span>
                  严格包含 <span className="font-bold">【星期】、【日期】、【品牌及对应的选题】、【产品】、【形式】</span>，其余邮件类型、状态、备注等均已按要求剔除。
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Brief Selection List (Only shown if target includes briefs) */}
          {(target === 'brief' || target === 'both') && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. 自选需求单导出 ({selectedBriefIds.length} / {briefs.length} 已选)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    单选导出将自动命名为「品牌名+日期.xlsx」，多选导出内嵌高清参考图
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Brand Filter */}
                  {uniqueBrands.length > 1 && (
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-xs">
                      <Filter className="w-3 h-3 text-slate-400" />
                      <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="bg-transparent border-none text-xs font-medium text-slate-700 focus:outline-none"
                      >
                        <option value="ALL">全部品牌</option>
                        {uniqueBrands.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={handleSelectAllFiltered}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50"
                  >
                    全选
                  </button>
                  <button
                    onClick={handleDeselectAllFiltered}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded hover:bg-slate-100"
                  >
                    清空
                  </button>
                </div>
              </div>

              {/* Briefs Checklist */}
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/40">
                {filteredBriefs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    暂无可导出的 EDM 需求单，请先在排期日历中编辑保存需求。
                  </div>
                ) : (
                  filteredBriefs.map((brief) => {
                    const isChecked = selectedBriefIds.includes(brief.id);
                    const positionCount = brief.positions?.length || 0;
                    const imageCount = (brief.positions || []).filter(
                      (p) => Boolean(p.templateScreenshot)
                    ).length;

                    return (
                      <div
                        key={brief.id}
                        onClick={() => {
                          handleToggleBrief(brief.id);
                          setIsCustomFilenameTouched(false);
                        }}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                          isChecked ? 'bg-indigo-50/70' : 'hover:bg-white bg-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className="text-indigo-600 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBrief(brief.id);
                              setIsCustomFilenameTouched(false);
                            }}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-white uppercase">
                                {brief.brand}
                              </span>
                              <span className="text-xs font-mono font-medium text-slate-600">
                                {brief.date}
                              </span>
                              <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                                {brief.format || 'EDM'}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
                              {brief.topic}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {positionCount} 个板块
                          </span>
                          {imageCount > 0 && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded inline-block mt-0.5">
                              含 {imageCount} 张参考图
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Brief Specification Notice */}
              <div className="text-[11px] text-purple-900 bg-purple-50/60 p-2.5 rounded-lg border border-purple-200/60">
                <span className="font-bold text-purple-800">Brief 表格输出规范：</span>
                包含「位置」、「参考模板（内嵌高清图）」、「内容」、「link」、「关键需求」5项，命名自动匹配【品牌名+日期】。
              </div>
            </div>
          )}

          {/* Filename Preview and Input */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                导出文件名
              </label>
              <button
                type="button"
                onClick={() => {
                  setCustomFilename(defaultFilename);
                  setIsCustomFilenameTouched(false);
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                恢复推荐命名
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customFilename}
                onChange={(e) => {
                  setCustomFilename(e.target.value);
                  setIsCustomFilenameTouched(true);
                }}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="例如: 10月 calendar.xlsx 或 FireMaple+2026-10-15.xlsx"
              />
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                {target === 'calendar' && '已遵照指令命名为：月份 calendar.xlsx'}
                {target === 'brief' && '已遵照指令命名为：品牌名+日期.xlsx'}
                {target === 'both' && '双表合并模式：月份 calendar.xlsx'}
              </span>
              <span className="text-slate-400">格式: .xlsx</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-200 transition"
          >
            取消
          </button>

          <button
            onClick={handleExport}
            disabled={
              isExporting ||
              ((target === 'brief' || target === 'both') && selectedBriefIds.length === 0)
            }
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting
                ? '正在生成并导出...'
                : exportSuccess
                ? '导出成功！'
                : `导出「${customFilename || defaultFilename}」`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
