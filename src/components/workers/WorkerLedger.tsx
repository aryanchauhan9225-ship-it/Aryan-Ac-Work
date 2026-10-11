import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  DollarSign,
  Plus,
  ArrowDownRight,
  Check,
  Printer,
  Share2,
  Trash2,
  Edit2,
  Calendar,
  Briefcase,
  AlertCircle,
  Phone,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LedgerEntry, LedgerEntryType } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  getCurrentYearMonthString,
} from '../../services/formatters';

interface WorkerLedgerProps {
  workerId: string;
  onBack: () => void;
  onEditWorker: () => void;
}

export const WorkerLedger: React.FC<WorkerLedgerProps> = ({
  workerId,
  onBack,
  onEditWorker,
}) => {
  const {
    data,
    workerSummaries,
    openQuickEntry,
    deleteLedgerEntry,
    updateLedgerEntry,
    setSelectedProjectId,
    setActiveTab,
  } = useApp();

  const worker = workerSummaries.find((w) => w.id === workerId);
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [selectedType, setSelectedType] = useState<'all' | 'earning' | 'advance' | 'payment'>('all');
  const [entryToEdit, setEntryToEdit] = useState<LedgerEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Assigned projects for this worker
  const assignedProjects = useMemo(() => {
    return data.projects.filter((p) => p.assignedWorkerIds?.includes(workerId));
  }, [data.projects, workerId]);

  // All entries for this worker
  const allWorkerEntries = useMemo(() => {
    return data.ledger
      .filter((e) => e.workerId === workerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.ledger, workerId]);

  // Available months from entries
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    // Always include current month
    monthsSet.add(getCurrentYearMonthString());
    allWorkerEntries.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        monthsSet.add(e.date.slice(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [allWorkerEntries]);

  // Filtered entries by selected month and selected type
  const filteredEntries = useMemo(() => {
    return allWorkerEntries.filter((e) => {
      if (selectedMonth !== 'all' && !e.date.startsWith(selectedMonth)) return false;
      if (selectedType !== 'all' && e.type !== selectedType) return false;
      return true;
    });
  }, [allWorkerEntries, selectedMonth, selectedType]);

  // Compute stats for current filter view
  const periodStats = useMemo(() => {
    let earnings = 0;
    let advances = 0;
    let payments = 0;
    let adjustments = 0;

    for (const e of filteredEntries) {
      if (e.type === 'earning') earnings += Number(e.amount) || 0;
      else if (e.type === 'advance') advances += Number(e.amount) || 0;
      else if (e.type === 'payment') payments += Number(e.amount) || 0;
      else if (e.type === 'adjustment') adjustments += Number(e.amount) || 0;
    }

    const net = earnings - (advances + payments) + adjustments;
    return {
      earnings,
      advances,
      payments,
      adjustments,
      net,
    };
  }, [filteredEntries]);

  if (!worker) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Worker record not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"
        >
          Back to Workers
        </button>
      </div>
    );
  }

  const projectMap = new Map(data.projects.map((p) => [p.id, p.name]));

  const handlePrintStatement = () => {
    window.print();
  };

  const handleShareStatement = async () => {
    const textSummary = `*ARYAN AC WORK - Worker Hisaab Statement*\n` +
      `Worker: ${worker.name} (${worker.role || 'AC Technician'})\n` +
      `Period: ${selectedMonth === 'all' ? 'All Records' : formatMonthYear(selectedMonth)}\n` +
      `Total Work/Earning: ${formatCurrency(periodStats.earnings)}\n` +
      `Total Advance Taken: ${formatCurrency(periodStats.advances)}\n` +
      `Total Payment Received: ${formatCurrency(periodStats.payments)}\n` +
      `Current Balance Remaining: ${formatCurrency(worker.currentBalance)}\n\n` +
      `ARYAN AC WORK - Contact: ${data.settings.phonePrimary || ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Hisaab Statement - ${worker.name}`,
          text: textSummary,
        });
      } catch {
        // Fallback to clipboard
        await navigator.clipboard.writeText(textSummary);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
      }
    } else {
      await navigator.clipboard.writeText(textSummary);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-5xl mx-auto">
      {/* PRINT-ONLY STATEMENT FORMAT (Hidden on screen, pristine on print) */}
      <div className="print-only print-page bg-white text-black p-8 font-sans">
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {data.settings.businessName || 'ARYAN AC WORK'}
              </h1>
              <p className="text-xs text-gray-700 font-medium">
                {data.settings.tagline || 'AC Contracting, Installation & Service Specialist'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {data.settings.address} • Phone: {data.settings.phonePrimary}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold uppercase tracking-wider border border-black px-2 py-1">
                Worker Statement
              </span>
              <p className="text-xs text-gray-600 mt-2">
                Date: {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Worker Details in Print */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border border-gray-300 mb-6">
          <div>
            <p className="text-xs uppercase text-gray-500 font-bold">Worker Name</p>
            <p className="text-lg font-bold">{worker.name}</p>
            <p className="text-xs text-gray-700">Role: {worker.role || 'AC Technician'}</p>
            {worker.phone && <p className="text-xs text-gray-700">Phone: {worker.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-gray-500 font-bold">Statement Period</p>
            <p className="text-sm font-bold">
              {selectedMonth === 'all' ? 'All Recorded History' : formatMonthYear(selectedMonth)}
            </p>
            <p className="text-xs uppercase text-gray-500 font-bold mt-2">Overall Balance Due</p>
            <p className="text-xl font-black text-black">
              {formatCurrency(worker.currentBalance)}
            </p>
          </div>
        </div>

        {/* Summary Table */}
        <div className="mb-6">
          <table className="w-full text-left text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-2 border-r border-gray-300 font-bold">Period Work / Earnings</th>
                <th className="p-2 border-r border-gray-300 font-bold">Period Advance Taken</th>
                <th className="p-2 border-r border-gray-300 font-bold">Period Wages Paid</th>
                <th className="p-2 font-bold">Current Remaining Due</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-r border-gray-300 font-bold">
                  {formatCurrency(periodStats.earnings)}
                </td>
                <td className="p-2 border-r border-gray-300 font-bold">
                  {formatCurrency(periodStats.advances)}
                </td>
                <td className="p-2 border-r border-gray-300 font-bold">
                  {formatCurrency(periodStats.payments)}
                </td>
                <td className="p-2 font-bold text-base">
                  {formatCurrency(worker.currentBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Detailed Ledger in Print */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
            Chronological Transaction Ledger
          </h3>
          <table className="w-full text-left text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-2 border-r border-gray-300 font-bold">Date</th>
                <th className="p-2 border-r border-gray-300 font-bold">Type</th>
                <th className="p-2 border-r border-gray-300 font-bold">Project / Site</th>
                <th className="p-2 border-r border-gray-300 font-bold">Notes</th>
                <th className="p-2 text-right font-bold">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((e) => (
                <tr key={e.id} className="border-b border-gray-200">
                  <td className="p-2 border-r border-gray-300">{formatDate(e.date)}</td>
                  <td className="p-2 border-r border-gray-300 font-bold uppercase text-[10px]">
                    {e.type === 'earning'
                      ? 'Work Earning'
                      : e.type === 'advance'
                      ? 'Advance Taken'
                      : e.type === 'payment'
                      ? 'Payment Settled'
                      : 'Adjustment'}
                  </td>
                  <td className="p-2 border-r border-gray-300">
                    {e.projectId ? projectMap.get(e.projectId) || '—' : '—'}
                  </td>
                  <td className="p-2 border-r border-gray-300">{e.note || '—'}</td>
                  <td className="p-2 text-right font-bold">
                    {formatCurrency(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between items-center text-xs text-gray-500">
          <div>Generated by ARYAN AC WORK Register System</div>
          <div>Authorized Signatory / Contractor</div>
        </div>
      </div>

      {/* SCREEN UI */}
      {/* Top Header Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to workers list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {worker.name}
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                {worker.role || 'AC Technician'}
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                  worker.active
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {worker.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
              {worker.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{worker.phone}</span>
                </span>
              )}
              {worker.currentProjectName && (
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Current Site: {worker.currentProjectName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onEditWorker}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={handleShareStatement}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Share Hisaab Summary"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shareSuccess ? 'Copied!' : 'Share Hisaab'}</span>
          </button>
          <button
            onClick={handlePrintStatement}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
            title="Print or Save PDF Statement"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement (PDF)</span>
          </button>
        </div>
      </div>

      {/* Monthly Filter Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Hisaab Period:
          </span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time (Full History)</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthYear(m)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filteredEntries.length} entries
          </span>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Earning */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Work / Earnings
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(periodStats.earnings)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total credit</div>
        </div>

        {/* Total Advance */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Advance Taken
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(periodStats.advances)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cash given earlier</div>
        </div>

        {/* Total Paid */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Wages Paid
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(periodStats.payments)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Settled wage amounts</div>
        </div>

        {/* Remaining Balance */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Current Remaining
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold mt-1 ${
              worker.currentBalance > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatCurrency(worker.currentBalance)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {worker.currentBalance > 0 ? 'Due to worker' : 'Settled in full'}
          </div>
        </div>
      </div>

      {/* SECTION 6: Current Projects */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Current Projects
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {assignedProjects.length} assigned
          </span>
        </div>
        {assignedProjects.length === 0 ? (
          <div className="text-xs text-slate-400 py-3 text-center">
            No projects currently assigned to {worker.name}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignedProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProjectId(p.id);
                  setActiveTab('projects');
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-indigo-400 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {p.company} • Site: {p.site}
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Buttons for this worker */}
      <div className="no-print flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => openQuickEntry('advance', worker.id, worker.currentProjectId)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95 transition-all"
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>+ Add Advance</span>
        </button>

        <button
          onClick={() => openQuickEntry('payment', worker.id, worker.currentProjectId)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 transition-all"
        >
          <Check className="w-4 h-4" />
          <span>+ Record Payment</span>
        </button>

        <button
          onClick={() => openQuickEntry('earning', worker.id, worker.currentProjectId)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Earning</span>
        </button>

        <button
          onClick={handlePrintStatement}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-xs active:scale-95 transition-all ml-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Generate Statement (PDF)</span>
        </button>
      </div>

      {/* Clear Calculation Breakdown Explanation Banner */}
      <div className="no-print p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Hisaab Calculation Breakdown:</span>
          </div>
          <div className="text-slate-700 dark:text-slate-300 mt-1 font-medium">
            Total Earning (<span className="text-blue-700 dark:text-blue-400 font-bold">{formatCurrency(periodStats.earnings)}</span>) − Advance Taken (<span className="text-amber-700 dark:text-amber-400 font-bold">{formatCurrency(periodStats.advances)}</span>) − Wages Paid (<span className="text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(periodStats.payments)}</span>) = Remaining Due (<span className={worker.currentBalance > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-emerald-600 dark:text-emerald-400 font-extrabold'}>{formatCurrency(worker.currentBalance)}</span>)
          </div>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-slate-800 shrink-0">
          Strict separation: advances and payments are subtracted
        </div>
      </div>

      {/* Transaction History Ledger Table/List */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Chronological Hisaab Ledger
          </h3>
          <span className="text-xs text-slate-400">
            {filteredEntries.length} transaction{filteredEntries.length === 1 ? '' : 's'}
          </span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <DollarSign className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No entries recorded for this period
            </p>
            <p className="text-xs mt-1">
              Tap above to record an advance, payment, or contract work earning.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
            {filteredEntries.map((entry) => {
              const project = entry.projectId ? projectMap.get(entry.projectId) : undefined;

              return (
                <div
                  key={entry.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Entry Type Badge / Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 font-bold ${
                        entry.type === 'advance'
                          ? 'bg-amber-500'
                          : entry.type === 'payment'
                          ? 'bg-emerald-600'
                          : entry.type === 'earning'
                          ? 'bg-blue-600'
                          : 'bg-purple-600'
                      }`}
                    >
                      {entry.type === 'advance' ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : entry.type === 'payment' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            entry.type === 'advance'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : entry.type === 'payment'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : entry.type === 'earning'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                              : 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                          }`}
                        >
                          {entry.type === 'advance'
                            ? 'Advance'
                            : entry.type === 'payment'
                            ? 'Payment'
                            : entry.type === 'earning'
                            ? 'Work / Earning'
                            : 'Adjustment'}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {formatDate(entry.date)}
                        </span>
                        {project && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                            {project}
                          </span>
                        )}
                      </div>

                      {entry.note && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amount and Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-base sm:text-lg font-extrabold ${
                          entry.type === 'earning'
                            ? 'text-blue-600 dark:text-blue-400'
                            : entry.type === 'advance'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(entry.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {entry.type === 'earning'
                          ? '+ Added to hisaab'
                          : '- Subtracted from balance'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEntryToEdit(entry)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(entry.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Entry Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Delete Transaction?
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Delete this transaction? This will change the worker's balance.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteLedgerEntry(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {entryToEdit && (
        <EditEntryModal
          entry={entryToEdit}
          onClose={() => setEntryToEdit(null)}
          onSave={(updates) => {
            updateLedgerEntry(entryToEdit.id, updates);
            setEntryToEdit(null);
          }}
          projects={data.projects}
        />
      )}
    </div>
  );
};

// Sub-component: EditEntryModal
interface EditEntryModalProps {
  entry: LedgerEntry;
  onClose: () => void;
  onSave: (updates: Partial<LedgerEntry>) => void;
  projects: any[];
}

const EditEntryModal: React.FC<EditEntryModalProps> = ({
  entry,
  onClose,
  onSave,
  projects,
}) => {
  const [type, setType] = useState<LedgerEntryType>(entry.type);
  const [amount, setAmount] = useState(String(entry.amount));
  const [date, setDate] = useState(entry.date);
  const [projectId, setProjectId] = useState(entry.projectId || '');
  const [note, setNote] = useState(entry.note || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    onSave({
      type,
      amount: num,
      date,
      projectId: projectId || undefined,
      note,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          Edit Hisaab Entry
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LedgerEntryType)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            >
              <option value="advance">Advance</option>
              <option value="payment">Payment</option>
              <option value="earning">Work / Earning</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="">-- None --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
