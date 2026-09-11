import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { CalendarItem, EmailBrief, Product, Topic } from '../types';

export interface ExportConfig {
  target: 'both' | 'calendar' | 'brief';
  selectedBriefIds?: string[]; // Brief IDs to export
  filename?: string;
  selectedMonth?: string; // e.g. "2026-10" or "ALL"
  calendarExportMode?: 'scheduled_only' | 'full_month'; // 'scheduled_only' (default) or 'full_month'
}

/**
 * Returns Chinese weekday name (星期一 ~ 星期日) for a YYYY-MM-DD date string.
 */
export function getWeekdayName(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekdays[date.getDay()] || '';
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return weekdays[date.getDay()] || '';
}

/**
 * Normalizes various Excel date representations (serial numbers, formatted strings) into YYYY-MM-DD.
 */
export function normalizeExcelDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'number') {
    const dateObj = XLSX.SSF.parse_date_code(value);
    if (dateObj) {
      const y = dateObj.y;
      const m = String(dateObj.m).padStart(2, '0');
      const d = String(dateObj.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(value).trim();
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const usMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (usMatch) {
    const m = usMatch[1].padStart(2, '0');
    const d = usMatch[2].padStart(2, '0');
    const y = usMatch[3];
    return `${y}-${m}-${d}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
}

// ----------------------------------------------------
// EXCEL EXPORT
// ----------------------------------------------------

export async function exportFlexibleExcel(
  calendarItems: CalendarItem[],
  briefs: EmailBrief[],
  config: ExportConfig = { target: 'both' }
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EDM Planning System';
  workbook.lastModifiedBy = 'EDM Planning System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const target = config.target || 'both';

  // Resolve target year and month
  let targetYear: number;
  let targetMonth: number;
  if (config.selectedMonth && config.selectedMonth !== 'ALL') {
    const parts = config.selectedMonth.split('-');
    targetYear = parts.length > 1 ? parseInt(parts[0], 10) : new Date().getFullYear();
    targetMonth = parts.length > 1 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
  } else {
    const now = new Date();
    targetYear = now.getFullYear();
    targetMonth = now.getMonth() + 1;
  }

  // 1. Export Calendar Sheet if target is 'calendar' or 'both'
  if (target === 'calendar' || target === 'both') {
    // Filter calendar items by month if specified
    const filteredCalendar = calendarItems.filter((item) => {
      if (!config.selectedMonth || config.selectedMonth === 'ALL') return true;
      if (!item.date) return false;
      const [y, m] = item.date.split('-');
      return parseInt(y, 10) === targetYear && parseInt(m, 10) === targetMonth;
    });

    // Group items by date for quick lookup
    const dateMap = new Map<string, CalendarItem[]>();
    filteredCalendar.forEach((item) => {
      const existing = dateMap.get(item.date) || [];
      existing.push(item);
      dateMap.set(item.date, existing);
    });

    // ==========================================
    // TAB 1: 真实月日历视图网格 (Monthly Calendar Grid)
    // ==========================================
    const wsGrid = workbook.addWorksheet(`${targetMonth}月 日历视图`, {
      views: [{ showGridLines: true }],
    });

    // Title banner
    const titleRow = wsGrid.addRow([`${targetYear} 年 ${targetMonth} 月 EDM 策划排期日历`]);
    titleRow.height = 36;
    titleRow.font = { name: 'Microsoft YaHei', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    wsGrid.mergeCells(1, 1, 1, 7);

    // Weekday Headers (周日 ~ 周六)
    const weekdayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekHeaderRow = wsGrid.addRow(weekdayNames);
    weekHeaderRow.height = 28;
    weekHeaderRow.font = { name: 'Microsoft YaHei', size: 10.5, bold: true, color: { argb: 'FF334155' } };
    weekHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    weekHeaderRow.eachCell((cell, colNum) => {
      const isWeekend = colNum === 1 || colNum === 7;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isWeekend ? 'FFF1F5F9' : 'FFE2E8F0' },
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    // Set 7 uniform columns
    for (let c = 1; c <= 7; c++) {
      wsGrid.getColumn(c).width = 24;
    }

    // Days calculation
    const firstDayIndex = new Date(targetYear, targetMonth - 1, 1).getDay(); // 0 is Sun
    const totalDaysInMonth = new Date(targetYear, targetMonth, 0).getDate();

    let currentDay = 1;
    let gridRowIndex = 3;

    while (currentDay <= totalDaysInMonth) {
      const rowValues: string[] = [];
      const cellHasItems: boolean[] = [];

      for (let col = 0; col < 7; col++) {
        if ((gridRowIndex === 3 && col < firstDayIndex) || currentDay > totalDaysInMonth) {
          rowValues.push('');
          cellHasItems.push(false);
        } else {
          const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
          const itemsOnDate = dateMap.get(dateStr) || [];

          if (itemsOnDate.length > 0) {
            let cellText = `【${currentDay}日】\n`;
            itemsOnDate.forEach((it, idx) => {
              cellText += `${idx + 1}. [${it.brand}] ${it.topic}\n`;
              if (it.productNames && it.productNames.length > 0) {
                cellText += `   产品: ${it.productNames.join(', ')}\n`;
              }
              if (it.format) {
                cellText += `   形式: ${it.format}\n`;
              }
            });
            rowValues.push(cellText.trim());
            cellHasItems.push(true);
          } else {
            rowValues.push(`${currentDay}日\n(无排期)`);
            cellHasItems.push(false);
          }
          currentDay++;
        }
      }

      const row = wsGrid.addRow(rowValues);
      row.height = 96; // Generous height for calendar notes
      row.font = { name: 'Microsoft YaHei', size: 9 };
      row.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const isWeekend = colNumber === 1 || colNumber === 7;
        const hasItem = cellHasItems[colNumber - 1];

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };

        if (hasItem) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFBEB' }, // Warm amber tint for scheduled days
          };
          cell.font = { name: 'Microsoft YaHei', size: 9.5, color: { argb: 'FF1E293B' } };
        } else if (isWeekend) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
          cell.font = { name: 'Microsoft YaHei', size: 9, color: { argb: 'FF94A3B8' } };
        } else {
          cell.font = { name: 'Microsoft YaHei', size: 9, color: { argb: 'FF64748B' } };
        }
      });

      gridRowIndex++;
    }

    // ==========================================
    // TAB 2: 月排期明细表 (5列精简标准明细)
    // ==========================================
    const wsList = workbook.addWorksheet(`${targetMonth}月 排期明细`, {
      views: [{ showGridLines: true }],
    });

    wsList.columns = [
      { header: '星期', key: 'weekday', width: 14 },
      { header: '日期', key: 'date', width: 16 },
      { header: '品牌及对应的选题', key: 'brandAndTopic', width: 45 },
      { header: '产品', key: 'productNames', width: 35 },
      { header: '形式', key: 'format', width: 22 },
    ];

    const listHeader = wsList.getRow(1);
    listHeader.height = 28;
    listHeader.font = { name: 'Microsoft YaHei', bold: true, color: { argb: 'FFFFFFFF' }, size: 10.5 };
    listHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    listHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    const sortedCalendar = [...filteredCalendar].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    if (sortedCalendar.length === 0) {
      const emptyRow = wsList.addRow({
        weekday: '—',
        date: '—',
        brandAndTopic: '当月暂无排期日程',
        productNames: '—',
        format: '—',
      });
      emptyRow.height = 25;
      emptyRow.alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
      sortedCalendar.forEach((item) => {
        const productStr =
          item.productNames && item.productNames.length > 0 ? item.productNames.join('; ') : '';
        const brandAndTopic = item.brand
          ? `【${item.brand}】${item.topic || ''}`
          : item.topic || '';
        const weekday = getWeekdayName(item.date);
        const isWeekend = weekday === '星期六' || weekday === '星期日';

        const row = wsList.addRow({
          weekday,
          date: item.date || '',
          brandAndTopic,
          productNames: productStr,
          format: item.format || '',
        });

        row.height = 25;
        row.font = { name: 'Microsoft YaHei', size: 10 };
        row.alignment = { vertical: 'middle' };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };

        row.eachCell((cell) => {
          if (isWeekend) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' },
            };
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
        });
      });
    }
  }

  // 2. Export Briefs if target is 'brief' or 'both'
  if (target === 'brief' || target === 'both') {
    let targetBriefs = briefs;
    if (config.selectedBriefIds && config.selectedBriefIds.length > 0) {
      targetBriefs = briefs.filter((b) => config.selectedBriefIds!.includes(b.id));
    }

    const calMap = new Map<string, CalendarItem>();
    calendarItems.forEach((c) => {
      calMap.set(c.id, c);
      if (c.briefId) calMap.set(c.briefId, c);
    });

    const wsBrief = workbook.addWorksheet('EDM需求单', {
      views: [{ showGridLines: true }],
    });

    // Columns per requirement:
    // "3. 导出的excel中的参考模板这一栏，不要导出图片，导出其对应的名称。"
    wsBrief.columns = [
      { header: '位置', key: 'position', width: 18 },
      { header: '参考模板', key: 'templateName', width: 26 },
      { header: '内容', key: 'content', width: 50 },
      { header: 'CTA 按钮', key: 'ctaButtons', width: 24 },
      { header: 'link', key: 'link', width: 34 },
      { header: '关键需求', key: 'keyRequirements', width: 38 },
    ];

    const applyTableHeaders = (rowNum: number) => {
      const headerRow = wsBrief.getRow(rowNum);
      headerRow.values = ['位置', '参考模板', '内容', 'CTA 按钮', 'link', '关键需求'];
      headerRow.height = 26;
      headerRow.font = { name: 'Microsoft YaHei', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    };

    let currentRow = 1;

    if (targetBriefs.length === 0) {
      applyTableHeaders(1);
      const emptyRow = wsBrief.addRow(['暂无需求单数据', '', '', '', '', '']);
      emptyRow.alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
      for (let bIndex = 0; bIndex < targetBriefs.length; bIndex++) {
        const brief = targetBriefs[bIndex];
        const cal = calMap.get(brief.calendarItemId) || calMap.get(brief.id);

        // Subject Line & Pre-header meta info banner
        const metaText = `【${brief.brand}】 ${brief.date}  |  选题: ${brief.topic || cal?.topic || '—'}  |  形式: ${brief.format || cal?.format || '—'}`;
        const bannerRow = wsBrief.addRow([metaText]);
        bannerRow.height = 28;
        bannerRow.font = { name: 'Microsoft YaHei', bold: true, size: 11, color: { argb: 'FF1E3A8A' } };
        bannerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEFF6FF' },
        };
        bannerRow.alignment = { vertical: 'middle', horizontal: 'left' };
        wsBrief.mergeCells(bannerRow.number, 1, bannerRow.number, 6);

        // Display Subject Line and Pre-header if present
        if (brief.subjectLine || brief.preheader) {
          const subRow = wsBrief.addRow([
            `Subject Line: ${brief.subjectLine || '—'}    |    Pre-header: ${brief.preheader || '—'}`,
          ]);
          subRow.height = 22;
          subRow.font = { name: 'Microsoft YaHei', size: 9.5, italic: true, color: { argb: 'FF475569' } };
          subRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
          subRow.alignment = { vertical: 'middle', horizontal: 'left' };
          wsBrief.mergeCells(subRow.number, 1, subRow.number, 6);
        }

        currentRow = wsBrief.lastRow ? wsBrief.lastRow.number + 1 : 1;
        applyTableHeaders(currentRow);
        currentRow++;

        const positions = brief.positions && brief.positions.length > 0
          ? brief.positions
          : [
              {
                id: 'pos-1',
                name: 'Hero',
                order: 1,
                content: `主题: ${brief.topic}`,
                productIds: [],
                link: '',
                keyRequirements: '',
              },
            ];

        for (let pIndex = 0; pIndex < positions.length; pIndex++) {
          const pos = positions[pIndex];
          const isFooter = pos.name.toLowerCase().trim() === 'footer';

          // Format CTA string
          let ctaText = '—';
          if (pos.ctas && pos.ctas.length > 0) {
            ctaText = pos.ctas.map((c) => `[${c.text}]${c.link ? ` (${c.link})` : ''}`).join('\n');
          }

          // Reference template strictly exports the template name (NO images per requirement!)
          const templateDisplay = isFooter ? '—' : pos.templateName || '无';

          const rowData = {
            position: isFooter ? 'footer' : pos.name,
            templateName: templateDisplay,
            content: isFooter ? '' : pos.content || '',
            ctaButtons: isFooter ? '' : ctaText,
            link: isFooter ? '' : pos.link || '',
            keyRequirements: isFooter ? '' : pos.keyRequirements || '',
          };

          const row = wsBrief.addRow(rowData);
          row.height = 36;
          row.font = { name: 'Microsoft YaHei', size: 9.5 };
          row.alignment = { vertical: 'top', wrapText: true };

          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
            if (colNumber === 1) {
              cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
              cell.font = { name: 'Microsoft YaHei', bold: true, size: 10 };
            } else if (colNumber === 2) {
              cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            }
          });

          currentRow = row.number;
        }

        if (bIndex < targetBriefs.length - 1) {
          const spacer = wsBrief.addRow(['', '', '', '', '', '']);
          spacer.height = 16;
          currentRow = spacer.number;
        }
      }
    }
  }

  // Determine export filename strictly conforming to rules:
  // "导出的brief，命名为：品牌名+日期。导出日历，命名为：月份 calendar"
  let defaultFilename = `${targetMonth}月 calendar.xlsx`;

  if (target === 'calendar') {
    defaultFilename = `${targetMonth}月 calendar.xlsx`;
  } else if (target === 'brief') {
    let targetBriefs = briefs;
    if (config.selectedBriefIds && config.selectedBriefIds.length > 0) {
      targetBriefs = briefs.filter((b) => config.selectedBriefIds!.includes(b.id));
    }
    if (targetBriefs.length > 0) {
      const b = targetBriefs[0];
      const brand = b.brand || 'EDM';
      const date = b.date || new Date().toISOString().slice(0, 10);
      defaultFilename = targetBriefs.length === 1 ? `${brand}+${date}.xlsx` : `${brand}+${date}等.xlsx`;
    } else {
      defaultFilename = `EDM_Brief_${new Date().toISOString().slice(0, 10)}.xlsx`;
    }
  } else {
    // Both
    defaultFilename = `${targetMonth}月 calendar.xlsx`;
  }

  const finalFilename = config.filename && config.filename.trim() ? config.filename.trim() : defaultFilename;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename.endsWith('.xlsx') ? finalFilename : `${finalFilename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ----------------------------------------------------
// EXCEL IMPORT PARSERS
// ----------------------------------------------------

export interface TopicImportRow extends Topic {
  isValid: boolean;
  errors: string[];
}

export function parseTopicsExcel(fileData: ArrayBuffer): TopicImportRow[] {
  const wb = XLSX.read(fileData, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return rawRows.map((row) => {
    const keys = Object.keys(row);
    const findVal = (target: string): string => {
      const matchKey = keys.find((k) => k.trim().toLowerCase() === target.toLowerCase());
      return matchKey ? String(row[matchKey]).trim() : '';
    };

    const brand = findVal('Brand') || findVal('品牌');
    const category = findVal('Category') || findVal('类别') || '普通';
    const subtopic = findVal('Subtopic') || findVal('子标题') || findVal('副标题');
    const topic = findVal('Topic') || findVal('主题') || findVal('选题');
    const emailType = findVal('Email Type') || findVal('Type') || findVal('邮件类型') || 'Newsletter';
    const marketingAngle = findVal('Marketing Angle') || findVal('Angle') || findVal('切入点');
    const notes = findVal('Notes') || findVal('备注');

    const errors: string[] = [];
    if (!brand) errors.push('缺少品牌 (Brand)');
    if (!topic) errors.push('缺少选题标题 (Topic)');

    const id = 'topic_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const now = new Date().toISOString();

    return {
      id,
      brand,
      category,
      subtopic,
      topic,
      emailType,
      marketingAngle,
      notes,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      isValid: errors.length === 0,
      errors,
    };
  });
}

export interface ProductImportRow extends Product {
  isValid: boolean;
  errors: string[];
}

export function parseProductsExcel(fileData: ArrayBuffer): ProductImportRow[] {
  const wb = XLSX.read(fileData, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return rawRows.map((row, rIdx) => {
    const keys = Object.keys(row);
    const findVal = (target: string): string => {
      const matchKey = keys.find((k) => k.trim().toLowerCase() === target.toLowerCase());
      return matchKey ? String(row[matchKey]).trim() : '';
    };

    const brand = findVal('Brand') || findVal('品牌');
    const productName = findVal('Product Name') || findVal('产品名称') || findVal('Product');
    const sku = findVal('SKU') || findVal('货号');
    const discount = findVal('优惠') || findVal('Discount') || findVal('促销折扣');
    const originalPrice = findVal('原价') || findVal('Original Price') || findVal('吊牌价');
    const price = (findVal('Price') || findVal('活动价') || findVal('现价') || findVal('售价') || '$0.00')
      .replace(/\s+/g, ' ')
      .trim();
    const productUrl = findVal('Product URL') || findVal('产品链接') || findVal('URL') || findVal('Link');
    const productImages = (findVal('Product Images') || findVal('产品图片') || findVal('Images') || findVal('图片'))
      .split(/[\n,;，；]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    const productType = findVal('Product Type') || findVal('产品类型') || findVal('Type');
    const parameters = findVal('产品参数') || findVal('Parameters') || findVal('参数') || findVal('Specifications') || findVal('规格') || findVal('Specs');
    const specifications = parameters;
    const targetUseCases = findVal('Target Use Cases') || findVal('适用场景') || findVal('Use Cases');
    const productStatus = findVal('Product Status') || findVal('状态') || 'Active';

    // Parse dynamic descriptions: 描述1, 描述2, 描述3, or columns with 描述
    const descriptions: Product['descriptions'] = [];
    keys.forEach((k) => {
      const lower = k.trim().toLowerCase();
      if (lower.includes('描述') || lower.startsWith('desc')) {
        const val = String(row[k]).trim();
        if (val) {
          // Check if user prefixed keyword with colon e.g. "长描述：..." or "短描述: ..."
          let keyword = k.trim();
          let content = val;
          const colonMatch = val.match(/^([^：:]{1,10})[：:]([\s\S]+)$/);
          if (colonMatch) {
            keyword = colonMatch[1].trim();
            content = colonMatch[2].trim();
          }
          descriptions.push({
            id: 'desc_' + Math.random().toString(36).substring(2, 7),
            keyword,
            content,
          });
        }
      }
    });

    // Parse selling points (卖点): 支持 卖点A -> 描述1, 描述2, 描述3
    const sellingPoints: NonNullable<Product['sellingPoints']> = [];
    // 1. Check for columns like "卖点A", "卖点B", "卖点1", "卖点2"
    keys.forEach((k) => {
      const trimmedKey = k.trim();
      if (/^卖点[A-Za-z0-9一二三四五六七八九十]/i.test(trimmedKey)) {
        const val = String(row[k]).trim();
        if (val) {
          const descLines = val.split('\n').map((l) => l.trim()).filter(Boolean);
          const descs: { id: string; label: string; text: string }[] = [];
          descLines.forEach((dLine, dIdx) => {
            const descMatch = dLine.match(/^([^：:]{1,15})[：:]([\s\S]+)$/);
            if (descMatch) {
              descs.push({
                id: `spd_${dIdx}_${Math.random().toString(36).substring(2, 6)}`,
                label: descMatch[1].trim(),
                text: descMatch[2].trim(),
              });
            } else {
              descs.push({
                id: `spd_${dIdx}_${Math.random().toString(36).substring(2, 6)}`,
                label: `描述${dIdx + 1}`,
                text: dLine.replace(/^[-•*0-9.]+\s*/, '').trim(),
              });
            }
          });
          sellingPoints.push({
            id: `sp_${sellingPoints.length}_${Math.random().toString(36).substring(2, 6)}`,
            title: trimmedKey,
            descriptions: descs.length > 0 ? descs : [{ id: 'spd_0', label: '描述1', text: val }],
          });
        }
      }
    });

    // 2. If no separate 卖点A/B columns, check for "卖点" or "功能与卖点" or "Features"
    const rawFeatures = findVal('卖点') || findVal('功能与卖点') || findVal('Features') || findVal('Selling Points');
    if (sellingPoints.length === 0 && rawFeatures) {
      const lines = rawFeatures.split('\n').map((l) => l.trim()).filter(Boolean);
      lines.forEach((line, fIdx) => {
        const match = line.match(/^([^(:（]+)(?:[（(]([^)）]+)[)）])?[：:]([\s\S]+)$/);
        if (match) {
          sellingPoints.push({
            id: 'sp_' + fIdx + '_' + Math.random().toString(36).substring(2, 6),
            title: match[1].replace(/^[-•*0-9.]+\s*/, '').trim(),
            descriptions: [
              {
                id: 'spd_1',
                label: match[2] ? match[2].trim() : '描述1',
                text: match[3].trim(),
              },
            ],
          });
        } else {
          sellingPoints.push({
            id: 'sp_' + fIdx + '_' + Math.random().toString(36).substring(2, 6),
            title: line.replace(/^[-•*0-9.]+\s*/, '').trim(),
            descriptions: [
              {
                id: 'spd_1',
                label: '描述1',
                text: line.trim(),
              },
            ],
          });
        }
      });
    }

    // Convert selling points to featuresList for backward compatibility
    const featuresList: Product['featuresList'] = sellingPoints.map((sp) => ({
      id: sp.id,
      name: sp.title,
      descriptions: sp.descriptions.map((d) => ({
        id: d.id,
        style: d.label || '通用描述',
        text: d.text,
      })),
    }));
    const productDescription = descriptions.map((d) => `[${d.keyword}]: ${d.content}`).join('\n');
    const legacySellingPoints = sellingPoints.map((sp) => {
      const text = sp.descriptions.map((d) => d.text).filter(Boolean).join(' ');
      return text ? `${sp.title}: ${text}` : sp.title;
    }).join('\n');

    const errors: string[] = [];
    if (!brand) errors.push('缺少品牌 (Brand)');
    if (!productName) errors.push('缺少产品名称 (Product Name)');

    const id = 'prod_' + Math.random().toString(36).substring(2, 9) + '_' + (Date.now() + rIdx);
    const now = new Date().toISOString();

    return {
      id,
      brand,
      productName,
      sku,
      discount,
      originalPrice,
      price,
      productUrl,
      productType: productType || '常规',
      productDescription,
      features: sellingPoints.map((sp) => sp.title).join('; '),
      keySellingPoints: legacySellingPoints,
      productImages,
      parameters,
      specifications,
      targetUseCases,
      descriptions,
      sellingPoints,
      featuresList,
      productStatus,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      isValid: errors.length === 0,
      errors,
    };
  });
}

export interface CalendarImportRow extends CalendarItem {
  product: string;
  isValid: boolean;
  isDuplicate?: boolean;
  errors: string[];
}

export function parseCalendarExcel(fileData: ArrayBuffer): CalendarImportRow[] {
  const wb = XLSX.read(fileData, { type: 'array' });
  const sheetName = wb.SheetNames.includes('Calendar')
    ? 'Calendar'
    : wb.SheetNames.includes('EDM_Calendar')
    ? 'EDM_Calendar'
    : wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const seenKeys = new Set<string>();

  return rawRows.map((row, idx) => {
    const keys = Object.keys(row);
    const findVal = (target: string): unknown => {
      const matchKey = keys.find((k) => k.trim().toLowerCase() === target.toLowerCase());
      return matchKey ? row[matchKey] : '';
    };

    const brand = String(findVal('Brand') || findVal('品牌')).trim();
    const rawDate = findVal('Date') || findVal('日期');
    const date = normalizeExcelDate(rawDate);
    const topic = String(findVal('Topic') || findVal('选题') || findVal('品牌及对应的选题')).trim();
    const emailType = String(findVal('Email Type') || findVal('Type') || findVal('邮件类型')).trim();
    const marketingAngle = String(findVal('Marketing Angle') || findVal('Angle') || findVal('切入点')).trim();
    const product = String(findVal('Product') || findVal('Products') || findVal('产品')).trim();
    const format = String(findVal('Format') || findVal('形式')).trim(); // Format is optional
    const campaignGoal = String(findVal('Campaign Goal') || findVal('Goal') || findVal('目标')).trim();
    const notes = String(findVal('Notes') || findVal('备注')).trim();
    const statusStr = String(findVal('Status') || findVal('状态')).trim();
    const status = (statusStr as CalendarItem['status']) || 'Planned';

    const errors: string[] = [];
    if (!brand) errors.push('缺少品牌 (Brand)');
    if (!date) errors.push('缺少或无效日期 (Date)');
    if (!topic) errors.push('缺少选题 (Topic)');

    const compositeKey = `${brand.toLowerCase()}_${date}`;
    let isDuplicate = false;
    if (brand && date) {
      if (seenKeys.has(compositeKey)) {
        isDuplicate = true;
        errors.push(`文件内重复记录: 同一品牌同一天仅允许一条排期 (${brand} on ${date})`);
      } else {
        seenKeys.add(compositeKey);
      }
    }

    const id = 'cal_' + Math.random().toString(36).substring(2, 9) + '_' + (Date.now() + idx);
    const now = new Date().toISOString();

    const productNames = product
      ? product.split(/[,;，；]/).map((p) => p.trim()).filter(Boolean)
      : [];

    return {
      id,
      brand,
      date,
      topic,
      emailType,
      marketingAngle,
      product,
      productIds: [],
      productNames,
      format,
      campaignGoal,
      notes,
      status,
      hasBrief: false,
      createdAt: now,
      updatedAt: now,
      isValid: errors.length === 0,
      isDuplicate,
      errors,
    };
  });
}
