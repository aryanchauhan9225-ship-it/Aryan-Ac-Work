import React, { useMemo } from 'react';
import {
  Briefcase,
  Users,
  TrendingDown,
  FileText,
  UserPlus,
  FolderPlus,
  ArrowDownRight,
  Check,
  Plus,
  Clock,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatCurrency,
  formatDate,
  getTodayDateString,
} from '../../services/formatters';

export const Dashboard: React.FC = () => {
  const {
    data,
    activeProjectsCount,
    activeWorkersCount,
    totalWorkerDues,
    workerSummaries,
    openQuickEntry,
    openAddWorkerModal,
    openAddProjectModal,
    openAddBillModal,
    setActiveTab,
    setSelectedWorkerId,
    setSelectedProjectId,
    setSelectedBillId,
    setSelectedCompanyId,
    setMoreSubView,
  } = useApp();

  // Obvious today date string formatted for India
  const todayDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const todayIso = getTodayDateString();

  // Total billed amount
  const totalBilledValue = useMemo(() => {
    return data.bills.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  }, [data.bills]);

  // Today's actual activity records
  const todayTransactions = useMemo(() => {
    return data.ledger.filter((l) => l.date === todayIso);
  }, [data.ledger, todayIso]);

  const todayActivityLogs = useMemo(() => {
    return data.activityLogs.filter((log) => {
      const logDate = log.timestamp ? log.timestamp.split('T')[0] : '';
      return logDate === todayIso;
    });
  }, [data.activityLogs, todayIso]);

  const hasActivityToday = todayTransactions.length > 0 || todayActivityLogs.length > 0;

  // Format activity timestamp as "Today", "Yesterday", or "DD MMM"
  const formatActivityDay = (timestamp: string): string => {
    if (!timestamp) return 'Recent';
    const logDate = new Date(timestamp);
    const now = new Date();
    const isToday =
      logDate.getDate() === now.getDate() &&
      logDate.getMonth() === now.getMonth() &&
      logDate.getFullYear() === now.getFullYear();
    if (isToday) return 'Today';

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      logDate.getDate() === yesterday.getDate() &&
      logDate.getMonth() === yesterday.getMonth() &&
      logDate.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return 'Yesterday';

    return logDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Click on activity to open the relevant record
  const handleActivityClick = (log: typeof data.activityLogs[0]) => {
    if (log.relatedType === 'worker' && log.relatedId) {
      setSelectedWorkerId(log.relatedId);
      setActiveTab('workers');
    } else if (log.relatedType === 'project' && log.relatedId) {
      setSelectedProjectId(log.relatedId);
      setActiveTab('projects');
    } else if (log.relatedType === 'bill' && log.relatedId) {
      setSelectedBillId(log.relatedId);
      setActiveTab('bills');
    } else if (log.relatedType === 'company' && log.relatedId) {
      setSelectedCompanyId(log.relatedId);
      setMoreSubView('companies');
      setActiveTab('more');
    }
  };

  // Workers with positive balance
  const workersWithDues = useMemo(() => {
    return workerSummaries
      .filter((w) => w.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance);
  }, [workerSummaries]);

  const workerMap = useMemo(() => {
    return new Map(data.workers.map((w) => [w.id, w.name]));
  }, [data.workers]);

  const projectMap = useMemo(() => {
    return new Map(data.projects.map((p) => [p.id, p.name]));
  }, [data.projects]);

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Top Header: Business Name & Today's Obvious Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-1 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/assets/images/aryan-ac-work-logo.svg"
              alt="ARYAN AC WORK Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.settings.businessName || 'ARYAN AC WORK'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Contractor & Thekedar Business Register • Cooling Today, Comfort Tomorrow
            </p>
          </div>
        </div>

        {/* Obvious Today's Date */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 px-3.5 py-1.5 rounded-xl border border-blue-200/70 dark:border-blue-800 text-xs font-bold">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{todayDateFormatted}</span>
        </div>
      </div>

      {/* Simple Summary: 4 Core Cards in Exact Priority Order (Point 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Outstanding Worker Balance (Priority 1: Visually Dominant) */}
        <div
          onClick={() => {
            setSelectedWorkerId(null);
            setActiveTab('workers');
          }}
          className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/40 dark:to-slate-900 border-2 border-rose-300 dark:border-rose-900/80 shadow-sm hover:shadow-md hover:border-rose-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Worker Outstanding
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight truncate">
              {formatCurrency(totalWorkerDues)}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform truncate">
            <span>{workersWithDues.length} with balance due</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
          </div>
        </div>

        {/* 2. Active Projects (Priority 2) */}
        <div
          onClick={() => {
            setSelectedProjectId(null);
            setActiveTab('projects');
          }}
          className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Projects
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeProjectsCount}
            </span>
            <span className="text-xs text-slate-400">
              of {data.projects.length}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            <span>View sites</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* 3. Active Workers (Priority 3) */}
        <div
          onClick={() => {
            setSelectedWorkerId(null);
            setActiveTab('workers');
          }}
          className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Workers
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeWorkersCount}
            </span>
            <span className="text-xs text-slate-400">
              registered
            </span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            <span>Manage hisaab</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* 4. Bills (Priority 4) */}
        <div
          onClick={() => {
            setSelectedBillId(null);
            setActiveTab('bills');
          }}
          className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-400 dark:hover:border-teal-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bills
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {data.bills.length}
            </span>
            <span className="text-xs text-slate-400 truncate">
              ({formatCurrency(totalBilledValue)})
            </span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            <span>View bills</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Quick Actions (Large Mobile-Friendly Touch Buttons) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3.5">
          Quick Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* + Add Worker */}
          <button
            onClick={openAddWorkerModal}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100/90 dark:hover:bg-blue-900/40 active:scale-95 transition-all text-center min-h-[96px]"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold leading-tight">+ Add Worker</span>
          </button>

          {/* + Add Project */}
          <button
            onClick={openAddProjectModal}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-900/60 hover:bg-indigo-100/90 dark:hover:bg-indigo-900/40 active:scale-95 transition-all text-center min-h-[96px]"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <FolderPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold leading-tight">+ Add Project</span>
          </button>

          {/* + Add Earning */}
          <button
            onClick={() => openQuickEntry('earning')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 border border-sky-200/80 dark:border-sky-900/60 hover:bg-sky-100/90 dark:hover:bg-sky-900/40 active:scale-95 transition-all text-center min-h-[96px]"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold leading-tight">+ Add Earning</span>
          </button>

          {/* + Add Advance */}
          <button
            onClick={() => openQuickEntry('advance')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-900/60 hover:bg-amber-100/90 dark:hover:bg-amber-900/40 active:scale-95 transition-all text-center min-h-[96px]"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-2 shadow-sm">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold leading-tight">+ Add Advance</span>
          </button>

          {/* + Record Payment */}
          <button
            onClick={() => openQuickEntry('payment')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-900/60 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/40 active:scale-95 transition-all text-center min-h-[96px]"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Check className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold leading-tight">+ Record Payment</span>
          </button>

          {/* + Create Bill */}
          <button
            onClick={() => openAddBillModal()}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 border border-teal-200/80 dark:border-teal-900/60 hover:bg-teal-100/90 dark:hover:bg-teal-900/40 active:scale-95 transition-all text-center min-h-[96px]"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold leading-tight">+ Create Bill</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Today's Activity & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 14: TODAY'S ACTIVITY */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Today's Activity
              </h2>
            </div>
            {hasActivityToday && (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                {todayTransactions.length + todayActivityLogs.length} entries
              </span>
            )}
          </div>

          <div className="mt-3 flex-1">
            {!hasActivityToday ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No activity recorded today.
                </p>
                <p className="text-xs mt-0.5 text-slate-400">
                  Entries made today will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Render today's financial transactions if any */}
                {todayTransactions.map((t) => {
                  const workerName = workerMap.get(t.workerId) || 'Worker';
                  const projectName = t.projectId ? projectMap.get(t.projectId) : undefined;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedWorkerId(t.workerId);
                        setActiveTab('workers');
                      }}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {workerName} — {t.type === 'payment' ? 'Payment' : t.type === 'advance' ? 'Advance' : 'Earning'} {formatCurrency(t.amount)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {projectName ? `Site: ${projectName} • ` : ''}{t.note || 'Recorded today'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Today
                      </span>
                    </div>
                  );
                })}

                {/* Render today's other logs (like project created, bill generated) */}
                {todayActivityLogs
                  .filter((log) => !todayTransactions.some((t) => t.workerId === log.relatedId && log.action.includes('payment')))
                  .slice(0, 4)
                  .map((log) => (
                    <div
                      key={log.id}
                      onClick={() => handleActivityClick(log)}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {log.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {log.description}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Today
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: RECENT ACTIVITY */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Recent Activity
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Tap to view details
            </span>
          </div>

          <div className="mt-3 flex-1">
            {data.activityLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No activity recorded yet. Entries will appear here as you work.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.activityLogs.slice(0, 7).map((log) => {
                  const dayLabel = formatActivityDay(log.timestamp);
                  return (
                    <div
                      key={log.id}
                      onClick={() => handleActivityClick(log)}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                          {log.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {log.description}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <span>{dayLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
