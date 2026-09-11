import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Sliders, Check, X } from 'lucide-react';
import { EDMFormat } from '../types';

interface FormatManagerProps {
  formats: EDMFormat[];
  onSaveFormat: (format: EDMFormat) => Promise<void>;
  onDeleteFormat: (id: string) => Promise<void>;
}

export const FormatManager: React.FC<FormatManagerProps> = ({
  formats,
  onSaveFormat,
  onDeleteFormat,
}) => {
  const [newFormatName, setNewFormatName] = useState('');
  const [newFormatDesc, setNewFormatDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormatName.trim()) return;

    const item: EDMFormat = {
      id: `fmt_${Date.now()}`,
      name: newFormatName.trim(),
      description: newFormatDesc.trim(),
      order: formats.length + 1,
    };

    await onSaveFormat(item);
    setNewFormatName('');
    setNewFormatDesc('');
  };

  const handleStartEdit = (f: EDMFormat) => {
    setEditingId(f.id);
    setEditName(f.name);
    setEditDesc(f.description || '');
  };

  const handleSaveEdit = async (id: string) => {
    const existing = formats.find((f) => f.id === id);
    if (!existing) return;

    await onSaveFormat({
      ...existing,
      name: editName.trim(),
      description: editDesc.trim(),
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900">EDM 形式管理 (Content Formats)</h1>
          <p className="text-xs text-slate-500">
            维护排期与需求单中使用的 EDM 内容形式分类（如新品发布、促销折扣、科普故事等）。
          </p>
        </div>
      </div>

      {/* Add New Format Form */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          新增 EDM 形式
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">形式名称</label>
            <input
              type="text"
              required
              placeholder="例如：VIP 优先购"
              value={newFormatName}
              onChange={(e) => setNewFormatName(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">说明与适用场景</label>
            <input
              type="text"
              placeholder="简要说明此形式的目的与特点..."
              value={newFormatDesc}
              onChange={(e) => setNewFormatDesc(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-2 px-3 rounded-md shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增形式</span>
            </button>
          </div>
        </form>
      </div>

      {/* Format List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {formats.map((f) => {
            const isEditing = editingId === f.id;

            return (
              <div
                key={f.id}
                className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                {isEditing ? (
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-xs border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-sky-500 font-semibold"
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="text-xs border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">{f.name}</span>
                    {f.description && (
                      <span className="text-[11px] text-slate-500">{f.description}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(f.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="保存"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                        title="取消"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(f)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="编辑"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定删除形式「${f.name}」？`)) onDeleteFormat(f.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
