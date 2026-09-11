import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  parseCalendarExcel,
  parseProductsExcel,
  parseTopicsExcel,
} from '../services/excel';
import { CalendarItem, Product, Topic } from '../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'topics' | 'products' | 'calendar';
  onCommitTopics: (topics: Topic[]) => Promise<void>;
  onCommitProducts: (products: Product[]) => Promise<void>;
  onCommitCalendar: (calendarItems: CalendarItem[]) => Promise<void>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  type,
  onCommitTopics,
  onCommitProducts,
  onCommitCalendar,
}) => {
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const title =
    type === 'topics'
      ? '从 Excel 批量导入选题库'
      : type === 'products'
      ? '从 Excel 批量导入产品库'
      : '从 Excel 批量导入 EDM 排期日历';

  // Generate and download sample template
  const handleDownloadSampleTemplate = () => {
    const wb = XLSX.utils.book_new();

    if (type === 'topics') {
      const sampleTopics = [
        {
          Brand: 'FireMaple',
          类别: '节日活动',
          子标题: '双十一返场大促',
          Topic: '双十一户外烹饪好物返场盛惠',
          'Email Type': '促销活动 (Promotion)',
          'Marketing Angle': '限时直降与返场特惠',
          Notes: '主推海燕锅与便携钛炉',
        },
        {
          Brand: 'Sunseeker',
          类别: '普通',
          子标题: '车顶行李收纳指南',
          Topic: '自驾越野车顶行李架装载全攻略',
          'Email Type': '科普指南 (How-To)',
          'Marketing Angle': '安全稳固与大空间扩展',
          Notes: '重点展示高承重横杆与收纳箱',
        },
      ];
      const ws = XLSX.utils.json_to_sheet(sampleTopics);
      XLSX.utils.book_append_sheet(wb, ws, 'Topics');
      XLSX.writeFile(wb, 'sample_topics_template.xlsx');
    } else if (type === 'products') {
      // Products template strictly following user instructions:
      // Includes SKU, Discount, Original Price, Price, Multiple descriptions (描述1, 描述2, etc.), Features/Selling points merged
      // Deleted Product Type, Product Description, Product Images
      const sampleProducts = [
        {
          Brand: 'FireMaple',
          'Product Name': '海燕 600ml 超轻聚能锅',
          SKU: 'FM-PETREL-600',
          优惠: '立减 $10 (限时 8 折)',
          原价: '$49.95',
          活动价: '$39.95',
          'Product URL': 'https://firemaple.com/products/petrel-pot',
          规格: '重量：145g\n容量：600ml\n材质：硬质阳极氧化铝',
          功能与卖点: '底部高效聚能环系统 (技术参数风): 热效率提升 30%，2分钟快速沸腾500ml水\n折叠防烫隔热手柄 (痛点转化风): 牢固贴合手腕，倒水不烫手，平整收纳\n带滤水孔 Tritan 锅盖 (使用体验风): 煮面倾倒汤汁安全不脱落',
          描述1: '短描述：超轻硬质阳极氧化铝户外锅，自带底部聚能环',
          描述2: '长描述：专为高山徒步与快穿设计的聚能锅，底部集成蜂窝聚能环，热效率提升30%，搭配折叠隔热手柄与滤水盖',
          描述3: '海外风：Engineered for ultralight thru-hikers seeking boiling speed and wind-resistance',
          'Target Use Cases': '单人徒步穿越、高山轻量露营、周末快速野炊。',
          'Product Status': 'Active',
        },
        {
          Brand: 'Sunseeker',
          'Product Name': 'Nomad 270 侧边车顶天幕',
          SKU: 'SS-AWN-270-PRO',
          优惠: '新品首发赠防风绳组',
          原价: '$799.00',
          活动价: '$699.00',
          'Product URL': 'https://sunseeker4x4.com/products/nomad-270',
          规格: '覆盖面积：12㎡\n闭合尺寸：2.3m\n面料：280G 涤棉防撕裂',
          功能与卖点: '全无立杆自立式悬臂设计 (体验风): 1人单手30秒即可轻松展开与收纳\n280G 防撕裂特氟龙防水涂层 (技术风): PU 3000mm 强效防暴雨防紫外线 UPF50+',
          描述1: '短描述：270度自立式轻量车顶天幕，单人30秒速开',
          描述2: '长描述：覆盖面积达12平米，坚固铝合金悬臂架构，无需落地支撑杆即可在微风天气自立使用',
          'Target Use Cases': '自驾越野、露营车露、海边钓鱼。',
          'Product Status': 'Active',
        },
      ];
      const ws = XLSX.utils.json_to_sheet(sampleProducts);
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      XLSX.writeFile(wb, 'sample_products_template.xlsx');
    } else {
      // Calendar sample template - format is optional!
      const sampleCalendar = [
        {
          Brand: 'FireMaple',
          Date: '2026-10-15',
          Topic: '秋季徒步烹饪核心装备清单',
          Product: '海燕 600ml 超轻聚能锅',
          Format: '食谱教程 (可选)',
          MarketingAngle: '新手入门与保暖膳食',
          Notes: '搭配便携气炉优惠活动',
          Status: 'Planned',
        },
        {
          Brand: 'Sunseeker',
          Date: '2026-10-18',
          Topic: '秋冬越野露营营地速搭指南',
          Product: 'Nomad 270 侧边车顶天幕',
          Format: '',
          MarketingAngle: '极速搭建与风雨庇护',
          Notes: '针对自驾越野玩家群体',
          Status: 'Planned',
        },
      ];
      const ws = XLSX.utils.json_to_sheet(sampleCalendar);
      XLSX.utils.book_append_sheet(wb, ws, 'EDM_Calendar');
      XLSX.writeFile(wb, 'sample_calendar_template.xlsx');
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage('');
    setParsedRows([]);

    try {
      const buffer = await file.arrayBuffer();

      if (type === 'topics') {
        const items = parseTopicsExcel(buffer);
        if (items.length === 0) throw new Error('在 Excel 工作表中未识别到有效的选题行。');
        setParsedRows(items);
      } else if (type === 'products') {
        const items = parseProductsExcel(buffer);
        if (items.length === 0) throw new Error('在 Excel 工作表中未识别到有效的产品行。');
        setParsedRows(items);
      } else {
        const items = parseCalendarExcel(buffer);
        if (items.length === 0) throw new Error('在 Excel 工作表中未识别到有效的排期日历行。');
        setParsedRows(items);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  // Commit imported rows to database
  const handleCommit = async () => {
    if (parsedRows.length === 0) return;
    setIsCommitting(true);
    setErrorMessage('');
    try {
      if (type === 'topics') {
        await onCommitTopics(parsedRows);
      } else if (type === 'products') {
        await onCommitProducts(parsedRows);
      } else {
        await onCommitCalendar(parsedRows);
      }
      onClose();
    } catch (err) {
      console.error('Commit error:', err);
      setErrorMessage('导入数据出错: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Instructions & Template Download */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-slate-800">
                {type === 'products' ? '支持智能多描述、SKU、原价活动价与功能合并识别' : '需要标准的表格列结构？'}
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {type === 'products'
                  ? '表格中可直接包含「描述1」「描述2」「功能与卖点」「原价」「活动价」「SKU」等列。'
                  : '下载预设标准表头格式的示例 Excel 模版文件。'}
              </p>
            </div>
            <button
              onClick={handleDownloadSampleTemplate}
              className="flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-md shadow-xs transition shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>下载示例模版 (.xlsx)</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition group">
            <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition mb-2" />
            <span className="text-xs font-semibold text-slate-700">
              {fileName ? fileName : '点击选择或拖拽 .xlsx / .xls 表格文件至此处'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              支持标准 Excel 格式，解析后会自动校验并去除冗余
            </span>
            <input
              type="file"
              accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Preview Parsed Rows */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  已成功解析 {parsedRows.length} 条记录
                </span>
                <span className="text-slate-500 text-[11px]">确认无误后点击下方按钮导入</span>
              </div>

              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg text-xs bg-slate-50/40 divide-y divide-slate-200">
                {parsedRows.slice(0, 20).map((row, i) => (
                  <div key={i} className="p-3 text-slate-700 hover:bg-white transition">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-x-2 truncate">
                        <span className="font-bold text-slate-900">[{row.brand}]</span>
                        <span className="font-medium">
                          {type === 'calendar'
                            ? `${row.date} - ${row.topic}`
                            : row.productName || row.topic}
                        </span>
                        {row.sku && (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                            SKU: {row.sku}
                          </span>
                        )}
                        {row.discount && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                            {row.discount}
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {row.originalPrice && (
                          <span className="text-slate-400 line-through text-[11px]">
                            {row.originalPrice}
                          </span>
                        )}
                        {row.price && (
                          <span className="font-semibold text-emerald-600">{row.price}</span>
                        )}
                      </div>
                    </div>

                    {/* Products Extra Metadata Preview */}
                    {type === 'products' && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                        {row.descriptions && row.descriptions.length > 0 && (
                          <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            已解析 {row.descriptions.length} 条描述 (
                            {row.descriptions.map((d: any) => d.keyword).join(', ')})
                          </span>
                        )}
                        {row.featuresList && row.featuresList.length > 0 && (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {row.featuresList.length} 项功能卖点
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition"
            >
              取消
            </button>
            <button
              onClick={handleCommit}
              disabled={parsedRows.length === 0 || isCommitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow disabled:opacity-50 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>{isCommitting ? '正在保存到数据库...' : `确认导入 ${parsedRows.length} 条记录`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
