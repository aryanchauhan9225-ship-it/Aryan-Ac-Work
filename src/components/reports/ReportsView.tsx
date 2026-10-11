import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Users,
  Briefcase,
  Building,
  Printer,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  getCurrentYearMonthString,
} from '../../services/formatters';

interface ReportsViewProps {
  onBack?: () => void;
  onOpenExcel?: () => void;
}

type ReportType = 'monthly' | 'worker' | 'project' | 'company';

export const ReportsView: React.FC<ReportsViewProps> = ({ onBack, onOpenExcel }) => {
  const { data, workerSummaries } = useApp();

  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonthString());
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  const companies = Array.from(
    new Set([...data.projects.map((p) => p.company), ...data.bills.map((b) => b.company)])
  ).filter(Boolean);

  // Available months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(getCurrentYearMonthString());
    data.ledger.forEach((l) => {
      if (l.date && l.date.length >= 7) set.add(l.date.slice(0, 7));
    });
    data.bills.forEach((b) => {
      if (b.date && b.date.length >= 7) set.add(b.date.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [data.ledger, data.bills]);

  // Calculations for Monthly Report
  const monthlyData = useMemo(() => {
    const monthLedger = data.ledger.filter((l) => l.date.startsWith(selectedMonth));
    const monthBills = data.bills.filter((b) => b.date.startsWith(selectedMonth));

    let earnings = 0;
    let advances = 0;
    let payments = 0;
    for (const l of monthLedger) {
      if (l.type === 'earning') earnings += Number(l.amount) || 0;
      else if (l.type === 'advance') advances += Number(l.amount) || 0;
      else if (l.type === 'payment') payments += Number(l.amount) || 0;
    }

    const outstanding = earnings - (advances + payments);
    const totalBilled = monthBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    return {
      monthLedger,
      monthBills,
      earnings,
      advances,
      payments,
      outstanding,
      totalBilled,
    };
  }, [data.ledger, data.bills, selectedMonth]);

  // Calculations for Company Report
  const companyReportData = useMemo(() => {
    const targetComp = selectedCompany;
    const comps = targetComp === 'all' ? companies : [targetComp];

    return comps.map((comp) => {
      const compProjects = data.projects.filter((p) => p.company === comp);
      const compBills = data.bills.filter((b) => b.company === comp);
      const billedSum = compBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const agreedSum = compProjects.reduce((sum, p) => sum + (p.agreedAmount || 0), 0);

      return {
        company: comp,
        projectsCount: compProjects.length,
        billsCount: compBills.length,
        agreedSum,
        billedSum,
      };
    });
  }, [companies, selectedCompany, data.projects, data.bills]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <span>Business Reports & Summary</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Filtered statements for workers, sites, clients, and monthly cash flow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenExcel && (
            <button
              onClick={onOpenExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Export</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="no-print flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'monthly', label: 'Monthly Summary' },
            { id: 'worker', label: 'Worker Statement' },
            { id: 'project', label: 'Project Report' },
            { id: 'company', label: 'Company / Client Report' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              reportType === t.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* REPORT 1: MONTHLY SUMMARY */}
      {reportType === 'monthly' && (
        <div className="space-y-4">
          <div className="no-print flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Month:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthYear(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly KPI Cards (Section 13) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Earnings (Month)
              </div>
              <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {formatCurrency(monthlyData.earnings)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Advances (Month)
              </div>
              <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrency(monthlyData.advances)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Payments (Month)
              </div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(monthlyData.payments)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Outstanding (Month)
              </div>
              <div
                className={`text-xl font-extrabold mt-1 ${
                  monthlyData.outstanding > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatCurrency(monthlyData.outstanding)}
              </div>
            </div>
          </div>

          {/* Monthly Transaction Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">
              Monthly Transactions ({formatMonthYear(selectedMonth)})
            </h3>
            {monthlyData.monthLedger.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No ledger transactions recorded for {formatMonthYear(selectedMonth)}.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {monthlyData.monthLedger.map((l) => {
                  const worker = data.workers.find((w) => w.id === l.workerId);
                  return (
                    <div key={l.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {worker?.name || 'Worker'}
                        </span>
                        <span className="text-slate-400 ml-2">
                          ({l.type}) • {formatDate(l.date)}
                        </span>
                        {l.note && <p className="text-slate-500 mt-0.5">{l.note}</p>}
                      </div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {formatCurrency(l.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORT 2: WORKER REPORT */}
      {reportType === 'worker' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">
              Worker Balance Summary Register
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-2.5">Worker Name</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Total Earnings</th>
                  <th className="py-2.5">Total Advance</th>
                  <th className="py-2.5">Total Paid</th>
                  <th className="py-2.5 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {workerSummaries.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-bold text-slate-900 dark:text-white">{w.name}</td>
                    <td className="py-3 text-slate-500">{w.role || 'AC Technician'}</td>
                    <td className="py-3 font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(w.totalEarnings)}
                    </td>
                    <td className="py-3 font-semibold text-amber-600 dark:text-amber-400">
                      {formatCurrency(w.totalAdvance)}
                    </td>
                    <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(w.totalPayment)}
                    </td>
                    <td className="py-3 text-right font-extrabold text-rose-600 dark:text-rose-400">
                      {formatCurrency(w.currentBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: PROJECT REPORT */}
      {reportType === 'project' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">
              Site Projects Report
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-2.5">Project</th>
                  <th className="py-2.5">Company</th>
                  <th className="py-2.5">Site</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Agreed Value</th>
                  <th className="py-2.5 text-right">Billed Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.projects.map((p) => {
                  const projectBills = data.bills.filter((b) => b.projectId === p.id);
                  const billedTotal = projectBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{p.company}</td>
                      <td className="py-3 text-slate-500">{p.site}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(p.agreedAmount)}
                      </td>
                      <td className="py-3 text-right font-extrabold text-teal-600 dark:text-teal-400">
                        {formatCurrency(billedTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: COMPANY REPORT */}
      {reportType === 'company' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">
              Company / Client Accounts Breakdown
            </h3>
            {companyReportData.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No company records available.
              </p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-2.5">Company / Client</th>
                    <th className="py-2.5">Projects Count</th>
                    <th className="py-2.5">Bills Generated</th>
                    <th className="py-2.5">Contract Value</th>
                    <th className="py-2.5 text-right">Total Billed Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {companyReportData.map((c) => (
                    <tr key={c.company} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{c.company}</td>
                      <td className="py-3 text-slate-500">{c.projectsCount}</td>
                      <td className="py-3 text-slate-500">{c.billsCount}</td>
                      <td className="py-3 font-semibold">{formatCurrency(c.agreedSum)}</td>
                      <td className="py-3 text-right font-extrabold text-teal-600 dark:text-teal-400">
                        {formatCurrency(c.billedSum)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
