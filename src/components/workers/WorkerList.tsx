import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Briefcase,
  TrendingDown,
  ArrowRight,
  Filter,
  DollarSign,
  ArrowDownRight,
  Check,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Worker } from '../../types';
import { formatCurrency } from '../../services/formatters';
import { WorkerModal } from './WorkerModal';
import { WorkerLedger } from './WorkerLedger';

export const WorkerList: React.FC = () => {
  const {
    workerSummaries,
    selectedWorkerId,
    setSelectedWorkerId,
    openQuickEntry,
    deleteWorker,
    isAddWorkerModalOpen,
    setIsAddWorkerModalOpen,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'dues' | 'active' | 'inactive'>('active');
  const [workerToEdit, setWorkerToEdit] = useState<Worker | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);

  // If a specific worker is selected, render their full Hisaab Ledger!
  if (selectedWorkerId) {
    return (
      <WorkerLedger
        workerId={selectedWorkerId}
        onBack={() => setSelectedWorkerId(null)}
        onEditWorker={() => {
          const w = workerSummaries.find((s) => s.id === selectedWorkerId);
          if (w) setWorkerToEdit(w);
        }}
      />
    );
  }

  // Filtered workers
  const filtered = workerSummaries.filter((w) => {
    const matchSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.phone && w.phone.includes(search)) ||
      (w.role && w.role.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;

    if (filterType === 'dues') return w.currentBalance > 0;
    if (filterType === 'active') return w.active;
    if (filterType === 'inactive') return !w.active;
    return true;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Worker Profiles & Hisaab
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Individual contractor rates, advances, recorded payments & chronological ledgers
          </p>
        </div>

        <button
          onClick={() => setIsAddWorkerModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Worker</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search workers by name, role or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Active ({workerSummaries.filter((w) => w.active).length})
          </button>
          <button
            onClick={() => setFilterType('dues')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'dues'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Outstanding Dues ({workerSummaries.filter((w) => w.currentBalance > 0).length})
          </button>
          <button
            onClick={() => setFilterType('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'inactive'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Show Inactive ({workerSummaries.filter((w) => !w.active).length})
          </button>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Workers ({workerSummaries.length})
          </button>
        </div>
      </div>

      {/* Subtle indicator when inactive workers are hidden */}
      {filterType === 'active' && workerSummaries.some((w) => !w.active) && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <span>
            Showing <strong>{workerSummaries.filter((w) => w.active).length}</strong> active workers. {workerSummaries.filter((w) => !w.active).length} inactive worker(s) hidden to keep list clean.
          </span>
          <button
            onClick={() => setFilterType('inactive')}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-3"
          >
            Show Inactive Workers
          </button>
        </div>
      )}

      {/* Workers Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
          <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            No workers found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {search ? 'Try clearing your search term' : 'Add your first worker to start tracking hisaab.'}
          </p>
          <button
            onClick={() => setIsAddWorkerModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Worker</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <div
              key={w.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      onClick={() => setSelectedWorkerId(w.id)}
                      className="text-base font-extrabold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate"
                    >
                      {w.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        {w.role || 'AC Technician'}
                      </span>
                      {w.active ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions dropdown or edit */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setWorkerToEdit(w)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit worker"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setWorkerToDelete(w)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Remove worker"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact & Site */}
                <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {w.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{w.phone}</span>
                    </div>
                  )}
                  {w.currentProjectName && (
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                      <Briefcase className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Site: {w.currentProjectName}</span>
                    </div>
                  )}
                </div>

                {/* Financial Overview 3-column pill */}
                <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Earned
                    </div>
                    <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                      {formatCurrency(w.totalEarnings)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Advance
                    </div>
                    <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                      {formatCurrency(w.totalAdvance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Paid
                    </div>
                    <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                      {formatCurrency(w.totalPayment)}
                    </div>
                  </div>
                </div>

                {/* Remaining Balance Due Display (Prominent Outstanding) */}
                <div
                  onClick={() => setSelectedWorkerId(w.id)}
                  className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 cursor-pointer hover:bg-slate-200/70 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Outstanding:
                  </span>
                  <span
                    className={`text-base font-black ${
                      w.currentBalance > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {formatCurrency(w.currentBalance)}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => openQuickEntry('advance', w.id, w.currentProjectId)}
                  className="flex-1 py-2 px-2 text-center rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                >
                  + Advance
                </button>
                <button
                  onClick={() => openQuickEntry('payment', w.id, w.currentProjectId)}
                  className="flex-1 py-2 px-2 text-center rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  Record Payment
                </button>
                <button
                  onClick={() => setSelectedWorkerId(w.id)}
                  className="py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-xs"
                >
                  <span>Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Worker Modal */}
      <WorkerModal
        isOpen={isAddWorkerModalOpen || workerToEdit !== null}
        onClose={() => {
          setIsAddWorkerModalOpen(false);
          setWorkerToEdit(null);
        }}
        workerToEdit={workerToEdit}
      />

      {/* Delete Confirmation Modal */}
      {workerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Delete Worker Profile?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <strong>{workerToDelete.name}</strong>? Their
              existing ledger history will remain for auditing.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setWorkerToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteWorker(workerToDelete.id);
                  setWorkerToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Yes, Remove Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
