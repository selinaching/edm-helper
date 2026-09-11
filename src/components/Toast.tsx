import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between p-3 rounded-lg shadow-lg border text-sm transition-all duration-200 ${
            t.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : t.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span className="font-medium">{t.message}</span>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 hover:opacity-75 rounded transition text-current opacity-60 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
