import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  CheckCircle2,
  Table,
  Layers,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateExcelWorkbook, ExcelExportOptions } from '../../services/excel';
import { getCurrentYearMonthString, formatMonthYear, formatCurrency } from '../../services/formatters';

interface ExcelExportViewProps {
  onBack?: () => void;
}

export const ExcelExportView: React.FC<ExcelExportViewProps> = ({ onBack }) => {
  const { data } = useApp();

  const [periodType, setPeriodType] = useState<'all' | 'current_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setExportDone(false);

    try {
      const options: ExcelExportOptions = {
        periodType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      generateExcelWorkbook(data, options);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 4000);
    } catch (err) {
      console.error('Excel generation error:', err);
      alert('Error generating Excel file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
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
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <span>Automatic Excel Register (.xlsx)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Export complete business records into formatted Excel sheets
          </p>
        </div>
      </div>

      {/* Main Export Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Select Export Period
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPeriodType('all')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                periodType === 'all'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="font-extrabold text-sm">All Recorded Data</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Complete history of workers, projects, bills & ledgers
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPeriodType('current_month')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                periodType === 'current_month'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="font-extrabold text-sm">Current Month</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formatMonthYear(getCurrentYearMonthString())} records only
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPeriodType('custom')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                periodType === 'custom'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="font-extrabold text-sm">Custom Date Range</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pick specific start and end dates
              </div>
            </button>
          </div>
        </div>

        {/* Custom Date Inputs if selected */}
        {periodType === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>
          </div>
        )}

        {/* Workbook Sheets Breakdown (What is included) */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Included Sheets in the Excel (.xlsx) Workbook:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block mb-1">
                Sheet 1: Summary
              </span>
              <span className="text-slate-500">
                Business details, totals, worker dues, active projects & billed values.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block mb-1">
                Sheet 2: Workers
              </span>
              <span className="text-slate-500">
                {data.workers.length} Workers with Phone, Total Earnings, Advance, Paid, Remaining Balance.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block mb-1">
                Sheet 3: Worker Ledger
              </span>
              <span className="text-slate-500">
                {data.ledger.length} Chronological transactions with Date, Worker, Project, Type, Amount, Notes.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block mb-1">
                Sheet 4: Projects
              </span>
              <span className="text-slate-500">
                {data.projects.length} Site contracts (LG, Voltas), Client, Location, Dates, Amount, Assigned Workers.
              </span>
            </div>

            <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block mb-1">
                Sheet 5: Bills
              </span>
              <span className="text-slate-500">
                {data.bills.length} Contractor bills with Bill Number (ACW-2026-XXX), Date, Company, Project, Amount, Status.
              </span>
            </div>
          </div>
        </div>

        {/* Big Export Button */}
        <div className="pt-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            <span>
              {isExporting ? 'Generating Excel Workbook...' : 'Download Excel (.xlsx) Register'}
            </span>
          </button>

          {exportDone && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-bold justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Excel Workbook downloaded successfully!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
