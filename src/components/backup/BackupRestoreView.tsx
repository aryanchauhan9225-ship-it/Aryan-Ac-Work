import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowLeft,
  FileJson,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  exportBackupJson,
  validateAndParseBackup,
  BackupValidationResult,
} from '../../services/storage';

interface BackupRestoreViewProps {
  onBack?: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({ onBack }) => {
  const {
    data,
    restoreFromBackup,
    resetAllData,
    loadDemoData,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Export Backup JSON file
  const handleExportBackup = () => {
    try {
      const jsonStr = exportBackupJson(data);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `ARYAN_AC_WORK_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMsg('Complete backup exported successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Failed to export backup: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // 2. Select file for restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateAndParseBackup(content);
      if (!result.valid || !result.data) {
        setErrorMsg(result.error || 'The selected file is not a valid backup file.');
        setValidationResult(null);
      } else {
        setValidationResult(result);
        setShowImportConfirm(true);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the file.');
    };
    reader.readAsText(file);

    // Reset input value so same file can be re-selected if desired
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 3. Confirm Restore
  const handleConfirmRestore = () => {
    if (!validationResult?.data) return;
    restoreFromBackup(validationResult.data);
    setShowImportConfirm(false);
    setValidationResult(null);
    setSuccessMsg('Backup restored successfully! All records updated.');
    setTimeout(() => setSuccessMsg(''), 4000);
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
            <Database className="w-6 h-6 text-blue-600" />
            <span>Backup & Data Safety</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Export backups to keep records safe or restore on another device
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-sm font-bold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Important Storage Notice (Point 28) */}
      <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
          <strong className="block font-bold text-sm mb-0.5">
            Local Device Storage
          </strong>
          Your data is stored locally on this device. Create regular backups to protect your records.
          You can transfer backup files to your phone, Google Drive, or another computer anytime.
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Backup Data */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Backup Data
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Downloads a timestamped backup file containing all {data.workers.length} workers,{' '}
              {data.projects.length} projects, {data.bills.length} bills, and {data.ledger.length}{' '}
              ledger records.
            </p>
          </div>

          <button
            onClick={handleExportBackup}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Backup Data</span>
          </button>
        </div>

        {/* Card 2: Restore Backup */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Restore Backup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Restore your business records from a previously downloaded backup file. You will see a
              confirmation screen with item counts before restoring.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Additional Tools: Demo Data & Clear */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
          Testing & Data Reset Options
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500">
            Need to test workflows with sample contractor records? You can load realistic sample data
            (LG project, Ramesh & Suresh hisaab, bill).
          </div>
          <button
            onClick={loadDemoData}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors whitespace-nowrap"
          >
            Load Sample Records
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-rose-600 dark:text-rose-400">
            Clear all data to start fresh. This removes all stored workers, projects, bills, and ledger
            entries from this device.
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition-colors whitespace-nowrap"
          >
            Clear / Reset All Records
          </button>
        </div>
      </div>

      {/* CONFIRMATION MODAL: Import Backup Preview */}
      {showImportConfirm && validationResult?.summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <FileJson className="w-7 h-7" />
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  Confirm Backup Restore
                </h3>
                <p className="text-xs text-slate-500">
                  Verify the contents before restoring
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Backup file contains:
              </div>
              <ul className="text-sm font-bold text-slate-900 dark:text-white space-y-1">
                <li>• {validationResult.summary.workersCount} Workers</li>
                <li>• {validationResult.summary.projectsCount} Site Projects</li>
                <li>• {validationResult.summary.billsCount} Bills</li>
                <li>• {validationResult.summary.ledgerCount} Ledger Hisaab Transactions</li>
              </ul>
              {validationResult.summary.exportedAt && (
                <div className="text-[11px] text-slate-400 pt-1">
                  Backup Created on: {new Date(validationResult.summary.exportedAt).toLocaleString('en-IN')}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Restoring this file will replace the current active records with the backup file data.
              Do you want to proceed?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowImportConfirm(false);
                  setValidationResult(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                Yes, Restore Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: Reset All Data */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-7 h-7" />
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  Reset All Records?
                </h3>
                <p className="text-xs text-slate-500">
                  Double confirmation required
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              This will permanently remove local business records from this device ({data.workers.length} workers, {data.projects.length} projects, {data.bills.length} bills, and {data.ledger.length} ledger transactions). This action cannot be undone unless you restore from a backup file.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                  setSuccessMsg('All records have been reset to a fresh empty state.');
                  setTimeout(() => setSuccessMsg(''), 4000);
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
