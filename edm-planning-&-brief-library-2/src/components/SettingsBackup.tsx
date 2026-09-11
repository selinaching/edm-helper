import React, { useState } from 'react';
import { Download, Upload, RotateCcw, Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, Building, RefreshCw } from 'lucide-react';
import { Brand } from '../types';
import { exportFullDatabaseBackup, restoreFullDatabaseBackup, resetDatabaseToDefault } from '../services/db';

interface SettingsBackupProps {
  brands: Brand[];
  onSaveBrand: (brand: Brand) => Promise<void>;
  onDeleteBrand: (id: string) => Promise<void>;
  onDataRestored: () => Promise<void>;
}

export const SettingsBackup: React.FC<SettingsBackupProps> = ({
  brands,
  onSaveBrand,
  onDeleteBrand,
  onDataRestored,
}) => {
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandColor, setNewBrandColor] = useState('#4f46e5');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Handle Full JSON Backup Export
  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    try {
      const jsonStr = await exportFullDatabaseBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edm_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('导出备份失败: ' + String(err));
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Full JSON Backup Restore
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('警告：恢复备份将覆盖云端现有的品牌、选题、产品、模板和排期记录。确定继续？')) {
      return;
    }

    setIsRestoring(true);
    setRestoreFeedback(null);
    try {
      const text = await file.text();
      await restoreFullDatabaseBackup(text);
      await onDataRestored();
      setRestoreFeedback({
        type: 'success',
        message: '数据库备份已成功恢复至云端！',
      });
    } catch (err) {
      setRestoreFeedback({
        type: 'error',
        message: '恢复备份失败: ' + (err instanceof Error ? err.message : String(err)),
      });
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  // Reset to default sample data
  const handleResetDefaults = async () => {
    if (!confirm('确定将所有集合重置为初始示例数据？所有自建未备份的数据将被覆盖。')) {
      return;
    }

    setIsRestoring(true);
    try {
      await resetDatabaseToDefault();
      await onDataRestored();
      setRestoreFeedback({
        type: 'success',
        message: '数据库已成功恢复为初始示例数据！',
      });
    } catch (err) {
      setRestoreFeedback({
        type: 'error',
        message: '重置失败: ' + String(err),
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    const brandItem: Brand = {
      id: `brand_${Date.now()}`,
      name: newBrandName.trim(),
      color: newBrandColor,
      createdAt: new Date().toISOString(),
    };

    await onSaveBrand(brandItem);
    setNewBrandName('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900">设置与数据库备份 (Settings & Backup)</h1>
          <p className="text-xs text-slate-500">
            多品牌管理、JSON 完整备份导出与恢复，以及持久化云端数据维护。
          </p>
        </div>
      </div>

      {restoreFeedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            restoreFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {restoreFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{restoreFeedback.message}</span>
        </div>
      )}

      {/* Brand Management Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">品牌管理</h2>
        </div>

        {/* Existing Brands List */}
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {brands.map((b) => (
            <div key={b.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 shadow-xs shrink-0"
                  style={{ backgroundColor: b.color || '#4f46e5' }}
                />
                <span className="font-semibold text-xs text-slate-800">{b.name}</span>
                {b.description && (
                  <span className="text-[11px] text-slate-400">({b.description})</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (brands.length <= 1) {
                      alert('必须保留至少一个品牌。');
                      return;
                    }
                    if (confirm(`确定删除品牌「${b.name}」？`)) onDeleteBrand(b.id);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                  title="删除品牌"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Brand Form */}
        <form onSubmit={handleAddBrand} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-2">
          <div className="sm:col-span-6">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">新增品牌名称</label>
            <input
              type="text"
              required
              placeholder="例如：PeakDesign"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">标签颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newBrandColor}
                onChange={(e) => setNewBrandColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
              />
              <span className="text-xs font-mono text-slate-600">{newBrandColor}</span>
            </div>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-3 rounded-md shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增品牌</span>
            </button>
          </div>
        </form>
      </div>

      {/* Full Database Backup & Restore Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">数据库 JSON 备份与恢复</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          保障 EDM 资产库、排期日历及需求单快照的数据安全。一键将全部数据导出为标准 JSON 备份文件，或随时从备份中还原。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export JSON */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-semibold text-xs text-slate-800 block">导出完整数据库备份</span>
              <p className="text-[11px] text-slate-500 mt-1">
                生成包含所有品牌、选题、产品、模板、形式、排期记录及需求单内容的完整快照。
              </p>
            </div>

            <button
              onClick={handleDownloadBackup}
              disabled={isDownloading}
              className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? '正在导出...' : '下载 JSON 备份文件'}</span>
            </button>
          </div>

          {/* Restore JSON */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-semibold text-xs text-slate-800 block">从 JSON 文件恢复</span>
              <p className="text-[11px] text-slate-500 mt-1">
                上传此前下载的 JSON 备份文件，恢复全部数据库集合。
              </p>
            </div>

            <label className="flex items-center justify-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold py-2 px-4 rounded-lg cursor-pointer transition shadow-xs">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>{isRestoring ? '正在恢复...' : '上传并恢复 JSON 备份'}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFile}
                disabled={isRestoring}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Default Data */}
      <div className="bg-rose-50/60 p-5 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-rose-900">重置为初始示例数据</h3>
          <p className="text-[11px] text-rose-700 mt-0.5">
            恢复 FireMaple 与 Sunseeker 的初始户外装备示例选题、产品与排期数据。
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          disabled={isRestoring}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2 px-3.5 rounded-lg shadow-xs transition disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重置示例数据</span>
        </button>
      </div>
    </div>
  );
};
