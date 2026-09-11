import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  List,
  FileText,
  Edit2,
  Trash2,
  Tag,
  Package,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Upload,
  Download,
  Layers,
} from 'lucide-react';
import { CalendarItem, Brand } from '../types';

interface CalendarViewProps {
  calendarItems: CalendarItem[];
  brands: Brand[];
  selectedBrand: string;
  onOpenCreateModal: (date?: string, initialMode?: 'single' | 'batch') => void;
  onEditItem: (item: CalendarItem) => void;
  onDeleteItem: (id: string) => void;
  onOpenBrief: (item: CalendarItem) => void;
  onOpenImport?: () => void;
  onExportMonthCalendar?: (monthStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  calendarItems,
  brands,
  selectedBrand,
  onOpenCreateModal,
  onEditItem,
  onDeleteItem,
  onOpenBrief,
  onOpenImport,
  onExportMonthCalendar,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // Default October 2026
  const [viewMode, setViewMode] = useState<'month' | 'table'>('month');
  const [searchTerm, setSearchTerm] = useState('');

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = `${year}年 ${month + 1}月`;

  // Filter items by selected brand and search term
  const filteredItems = calendarItems.filter((item) => {
    const matchesBrand = selectedBrand === 'ALL' || item.brand.toLowerCase() === selectedBrand.toLowerCase();
    const matchesSearch = searchTerm
      ? item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.productNames && item.productNames.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        item.format.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesBrand && matchesSearch;
  });

  // Generate calendar grid days
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Trailing days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNum: d, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNum: d, dateStr, isCurrentMonth: true });
  }

  // Next month leading days to complete grid (42 cells: 6 rows)
  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month + 2 > 12 ? 1 : month + 2;
    const y = month + 2 > 12 ? year + 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNum: d, dateStr, isCurrentMonth: false });
  }

  const getBrandColor = (brandName: string) => {
    const b = brands.find((brand) => brand.name.toLowerCase() === brandName.toLowerCase());
    return b?.color || '#4f46e5';
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header & View Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={prevMonth}
              className="p-1 rounded hover:bg-white hover:shadow-xs transition text-slate-700"
              title="上个月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-2 py-0.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
            >
              今天
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded hover:bg-white hover:shadow-xs transition text-slate-700"
              title="下个月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {monthName}
          </h2>

          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
            共 {filteredItems.length} 条排期
          </span>
        </div>

        {/* Controls: Search, View Mode, Add Button */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="搜索选题、品牌、产品或形式..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>月视图</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>列表</span>
            </button>
          </div>

          {/* Quick Action Buttons per requirements */}
          <div className="flex items-center gap-2">
            {onExportMonthCalendar && (
              <button
                type="button"
                onClick={() => onExportMonthCalendar(`${year}-${String(month + 1).padStart(2, '0')}`)}
                className="flex items-center gap-1 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-2xs transition"
                title="以标准月的日历视图网格导出当前月份的 Excel 日历"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>导出月日历</span>
              </button>
            )}

            {onOpenImport && (
              <button
                type="button"
                onClick={onOpenImport}
                className="flex items-center gap-1 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-2xs transition"
                title="从 Excel 批量导入 EDM 排期数据"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>导入排期 Excel</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenCreateModal(undefined, 'batch')}
              className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
              title="一次性批量新增多条 EDM 排期"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>批量新增</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCreateModal(undefined, 'single')}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增排期</span>
            </button>
          </div>
        </div>
      </div>

      {/* MONTH GRID VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2 text-xs font-semibold text-slate-600">
            <div>周日</div>
            <div>周一</div>
            <div>周二</div>
            <div>周三</div>
            <div>周四</div>
            <div>周五</div>
            <div>周六</div>
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100">
            {calendarDays.map((calDay, idx) => {
              const dayItems = filteredItems.filter((item) => item.date === calDay.dateStr);
              const isToday = calDay.dateStr === new Date().toISOString().slice(0, 10);
              const pendingBriefCount = dayItems.filter((item) => !item.hasBrief).length;
              const totalBriefCount = dayItems.length;

              return (
                <div
                  key={idx}
                  className={`min-h-[180px] p-2 bg-white transition flex flex-col group ${
                    !calDay.isCurrentMonth ? 'bg-slate-50/60 opacity-50' : ''
                  }`}
                >
                  {/* Date header with brief reminder badge & quick add */}
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100 gap-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span
                        className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : calDay.isCurrentMonth
                            ? 'text-slate-800 bg-slate-100'
                            : 'text-slate-400'
                        }`}
                      >
                        {calDay.dayNum}
                      </span>

                      {/* Brief requirement reminder badge right next to the date */}
                      {calDay.isCurrentMonth && totalBriefCount > 0 && (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 shadow-2xs transition ${
                            pendingBriefCount > 0
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          }`}
                          title={
                            pendingBriefCount > 0
                              ? `当天有 ${pendingBriefCount} 个 Brief 需求待写 (共 ${totalBriefCount} 条排期)`
                              : `当天 ${totalBriefCount} 个 Brief 需求均已编写就绪`
                          }
                        >
                          {pendingBriefCount > 0 ? (
                            <FileText className="w-2.5 h-2.5 shrink-0 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-emerald-600" />
                          )}
                          <span>
                            {pendingBriefCount > 0
                              ? `${pendingBriefCount}个Brief待写`
                              : `${totalBriefCount}个已就绪`}
                          </span>
                        </span>
                      )}
                    </div>

                    {calDay.isCurrentMonth && (
                      <button
                        onClick={() => onOpenCreateModal(calDay.dateStr)}
                        title={`在 ${calDay.dateStr} 新增排期`}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1 rounded transition shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* EDM Items on this Day - ample height & smooth layout, no clipping */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[320px] pr-0.5 pb-1">
                    {dayItems.map((item) => {
                      const brandColor = getBrandColor(item.brand);
                      return (
                        <div
                          key={item.id}
                          className="text-[11px] p-2 rounded-lg border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xs transition relative group/card cursor-pointer shadow-2xs"
                          onClick={() => onEditItem(item)}
                        >
                          {/* Brand & Format Tag */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className="px-1.5 py-0.2 rounded font-bold text-[10px] text-white shrink-0"
                              style={{ backgroundColor: brandColor }}
                            >
                              {item.brand}
                            </span>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-medium truncate max-w-[65px]">
                              {item.format}
                            </span>
                          </div>

                          {/* Topic Title */}
                          <div className="font-semibold text-slate-800 line-clamp-2 leading-tight">
                            {item.topic}
                          </div>

                          {/* Products line */}
                          {item.productNames && item.productNames.length > 0 && (
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 truncate">
                              <Package className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span className="truncate">{item.productNames.join(', ')}</span>
                            </div>
                          )}

                          {/* Brief Status Badge & Action */}
                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenBrief(item);
                              }}
                              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition ${
                                item.hasBrief
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                              }`}
                            >
                              {item.hasBrief ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <FileText className="w-3 h-3 text-indigo-600" />
                              )}
                              <span>{item.hasBrief ? '编辑需求' : '去写需求'}</span>
                            </button>

                            <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteItem(item.id);
                                }}
                                className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                                title="删除排期"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLE / LIST VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">品牌</th>
                  <th className="py-3 px-4">发送日期</th>
                  <th className="py-3 px-4">选题与类型</th>
                  <th className="py-3 px-4">关联推广产品</th>
                  <th className="py-3 px-4">EDM 形式</th>
                  <th className="py-3 px-4">需求单状态</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      未找到符合筛选条件的排期记录。
                    </td>
                  </tr>
                ) : (
                  filteredItems
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((item) => {
                      const brandColor = getBrandColor(item.brand);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                          <td className="py-3 px-4">
                            <span
                              className="px-2 py-0.5 rounded text-[11px] font-semibold text-white inline-block"
                              style={{ backgroundColor: brandColor }}
                            >
                              {item.brand}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-slate-900 leading-snug">{item.topic}</div>
                            {item.emailType && (
                              <div className="text-[11px] text-slate-500">{item.emailType}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            {item.productNames && item.productNames.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.productNames.map((pName, i) => (
                                  <span
                                    key={i}
                                    className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  >
                                    {pName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">未选产品</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                              {item.format}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => onOpenBrief(item)}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition shadow-xs ${
                                item.hasBrief
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{item.hasBrief ? '编辑需求' : '创建需求'}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onEditItem(item)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                                title="编辑排期"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="删除排期"
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
    </div>
  );
};
