import React from 'react';
import {
  X,
  ArrowDownRight,
  Check,
  Plus,
  UserPlus,
  FolderPlus,
  FileText,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FastAddModal: React.FC = () => {
  const {
    isFastAddOpen,
    setIsFastAddOpen,
    openQuickEntry,
    openAddWorkerModal,
    openAddProjectModal,
    openAddBillModal,
  } = useApp();

  if (!isFastAddOpen) return null;

  const handleAction = (action: () => void) => {
    setIsFastAddOpen(false);
    action();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Quick Action Entry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an entry to record in seconds
            </p>
          </div>
          <button
            onClick={() => setIsFastAddOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worker Financial Entries */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Worker Transactions
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleAction(() => openQuickEntry('advance'))}
              className="flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-1.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 active:scale-95 transition-all text-left sm:text-center"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold">Worker Advance</div>
                <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 sm:hidden">
                  Give cash advance to worker
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAction(() => openQuickEntry('payment'))}
              className="flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-1.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 active:scale-95 transition-all text-left sm:text-center"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold">Record Payment</div>
                <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 sm:hidden">
                  Settle / record wages paid
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAction(() => openQuickEntry('earning'))}
              className="flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-1.5 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 active:scale-95 transition-all text-left sm:text-center"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold">Worker Earning</div>
                <div className="text-[10px] text-blue-700/80 dark:text-blue-400/80 sm:hidden">
                  Add work rate / credit
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* New Records */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            New Business Records
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => handleAction(() => openAddWorkerModal())}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  New Worker
                </div>
                <div className="text-[11px] text-slate-500">
                  Register technician or helper
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAction(() => openAddProjectModal())}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                <FolderPlus className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  New Project
                </div>
                <div className="text-[11px] text-slate-500">
                  Create contract (LG, Voltas, etc.)
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAction(() => openAddBillModal())}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Create Bill
                </div>
                <div className="text-[11px] text-slate-500">
                  Generate professional contractor invoice
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
