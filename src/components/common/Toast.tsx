import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-50 bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 max-w-sm w-[90vw] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 shadow-xl border border-slate-700/50 dark:border-slate-200/50 backdrop-blur-md">
        {toast.type === 'error' ? (
          <AlertCircle className="w-5 h-5 text-rose-400 dark:text-rose-600 shrink-0" />
        ) : toast.type === 'info' ? (
          <Info className="w-5 h-5 text-blue-400 dark:text-blue-600 shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
        )}
        <p className="text-xs sm:text-sm font-bold flex-1 leading-snug">
          {toast.message}
        </p>
      </div>
    </div>
  );
};
