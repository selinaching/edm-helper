import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Sparkles, Layers, RotateCcw } from 'lucide-react';
import { DisplayTypeConfig } from '../types';

interface DisplayTypeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayTypes?: DisplayTypeConfig;
  onSaveDisplayTypes: (config: DisplayTypeConfig) => Promise<void>;
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

export const DisplayTypeManagerModal: React.FC<DisplayTypeManagerModalProps> = ({
  isOpen,
  onClose,
  displayTypes,
  onSaveDisplayTypes,
}) => {
  const [activeTab, setActiveTab] = useState<'hero' | 'body'>('hero');

  const [heroTypes, setHeroTypes] = useState<string[]>(
    displayTypes?.heroTypes?.length ? displayTypes.heroTypes : DEFAULT_HERO_TYPES
  );
  const [bodyTypes, setBodyTypes] = useState<string[]>(
    displayTypes?.bodyTypes?.length ? displayTypes.bodyTypes : DEFAULT_BODY_TYPES
  );

  const [newTypeName, setNewTypeName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHeroTypes(
        displayTypes?.heroTypes?.length ? displayTypes.heroTypes : DEFAULT_HERO_TYPES
      );
      setBodyTypes(
        displayTypes?.bodyTypes?.length ? displayTypes.bodyTypes : DEFAULT_BODY_TYPES
      );
      setNewTypeName('');
      setEditingIndex(null);
      setSaveSuccess(false);
    }
  }, [isOpen, displayTypes]);

  if (!isOpen) return null;

  const currentList = activeTab === 'hero' ? heroTypes : bodyTypes;

  const handleAddType = () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    if (currentList.includes(trimmed)) {
      alert(`类型 "${trimmed}" 已存在`);
      return;
    }

    if (activeTab === 'hero') {
      setHeroTypes([...heroTypes, trimmed]);
    } else {
      setBodyTypes([...bodyTypes, trimmed]);
    }
    setNewTypeName('');
  };

  const handleStartEdit = (index: number, val: string) => {
    setEditingIndex(index);
    setEditingValue(val);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed) return;

    if (activeTab === 'hero') {
      const updated = [...heroTypes];
      updated[index] = trimmed;
      setHeroTypes(updated);
    } else {
      const updated = [...bodyTypes];
      updated[index] = trimmed;
      setBodyTypes(updated);
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleDelete = (index: number) => {
    if (activeTab === 'hero') {
      setHeroTypes(heroTypes.filter((_, idx) => idx !== index));
    } else {
      setBodyTypes(bodyTypes.filter((_, idx) => idx !== index));
    }
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleResetDefaults = () => {
    if (!window.confirm('确定恢复默认的展现类型预设吗？')) return;
    if (activeTab === 'hero') {
      setHeroTypes(DEFAULT_HERO_TYPES);
    } else {
      setBodyTypes(DEFAULT_BODY_TYPES);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSaveDisplayTypes({
        heroTypes,
        bodyTypes,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 800);
    } catch (err: unknown) {
      alert('保存展现类型配置失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">自定义板块展现类型</h2>
              <p className="text-xs text-slate-400">
                支持自定义新增、编辑和删除首屏与正文屏的展现类型
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('hero');
                setEditingIndex(null);
              }}
              className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'hero'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>首屏 Hero 展现类型 ({heroTypes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('body');
                setEditingIndex(null);
              }}
              className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'body'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>第2/3/4等正文屏类型 ({bodyTypes.length})</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {activeTab === 'hero'
              ? '⭐ 首屏专属展现类型，如“内容”、“促销”、“新品首发”等。'
              : '📑 第2、3、4屏共用同一套展现类型库，各屏同步保持一致（如“功能属性”、“媒体背书”等）。'}
          </p>
        </div>

        {/* Add Input Bar */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddType();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={
                activeTab === 'hero'
                  ? '输入新首屏展现类型 (如: 节日限时特惠)'
                  : '输入新正文屏展现类型 (如: 权威测评)'
              }
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!newTypeName.trim()}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加类型</span>
            </button>
          </form>
        </div>

        {/* Type Items List */}
        <div className="p-4 max-h-64 overflow-y-auto space-y-2 bg-slate-50/50 flex-1">
          {currentList.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              暂无类型，请在上方输入添加
            </div>
          ) : (
            currentList.map((type, idx) => {
              const isEditing = editingIndex === idx;

              return (
                <div
                  key={`${activeTab}-${idx}`}
                  className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-2xs"
                >
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="flex-1 text-xs border border-indigo-400 rounded px-2 py-1 focus:outline-none font-medium"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(idx)}
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                        title="保存修改"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        className="p-1 rounded text-slate-400 hover:bg-slate-100"
                        title="取消"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{type}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(idx, type)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="修改名称"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="删除类型"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>恢复默认预设</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saveSuccess ? '已保存！' : isSaving ? '保存中...' : '保存配置'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
