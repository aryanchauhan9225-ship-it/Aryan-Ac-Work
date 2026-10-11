import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, DollarSign, Plus, ArrowDownRight, ArrowUpRight, Calculator } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LedgerEntryType } from '../../types';
import { getTodayDateString, formatCurrency } from '../../services/formatters';

export const QuickEntryModal: React.FC = () => {
  const {
    quickEntryModal,
    closeQuickEntry,
    data,
    addLedgerEntry,
    workerSummaries,
  } = useApp();

  const [workerId, setWorkerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [type, setType] = useState<LedgerEntryType>('advance');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (quickEntryModal.isOpen) {
      setType(quickEntryModal.defaultType || 'advance');
      // Smart default: use preselected, or last used, or first worker
      const defaultWorkerId =
        quickEntryModal.preselectedWorkerId ||
        data.settings.lastUsedWorkerId ||
        (data.workers[0]?.id || '');
      setWorkerId(defaultWorkerId);

      const defaultProjectId =
        quickEntryModal.preselectedProjectId ||
        data.settings.lastUsedProjectId ||
        '';
      setProjectId(defaultProjectId);

      setAmount('');
      setDate(getTodayDateString());
      setNote('');
      setError('');
      setIsSubmitting(false);
      setShowPaymentConfirm(false);
      setShowDiscardConfirm(false);
    }
  }, [quickEntryModal, data.workers, data.settings.lastUsedWorkerId, data.settings.lastUsedProjectId]);

  const handleAttemptClose = () => {
    if (amount.trim() || note.trim()) {
      setShowDiscardConfirm(true);
    } else {
      closeQuickEntry();
    }
  };

  if (!quickEntryModal.isOpen) return null;

  const selectedWorkerSummary = workerSummaries.find((w) => w.id === workerId);

  // Helper to parse numbers even if user types or pastes ₹, commas, or spaces
  const parseCleanAmount = (raw: string): number => {
    if (!raw) return 0;
    const cleaned = raw.replace(/[₹,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Compute forecasted balance
  const parsedAmount = parseCleanAmount(amount);
  const currentBal = selectedWorkerSummary?.currentBalance || 0;
  let forecastedBalance = currentBal;
  if (type === 'earning') {
    forecastedBalance = currentBal + parsedAmount;
  } else if (type === 'advance' || type === 'payment') {
    forecastedBalance = currentBal - parsedAmount;
  }

  const executeSave = (numAmount: number) => {
    setIsSubmitting(true);
    try {
      let defaultNote = note.trim();
      if (!defaultNote) {
        if (type === 'advance') defaultNote = 'Cash advance';
        else if (type === 'payment') defaultNote = 'Payment settlement';
        else if (type === 'earning') defaultNote = 'Contract work earning';
        else defaultNote = 'Ledger adjustment';
      }

      addLedgerEntry({
        workerId,
        projectId: projectId || undefined,
        date,
        type,
        amount: numAmount,
        note: defaultNote,
      });

      closeQuickEntry();
    } catch (err) {
      setError('Failed to record transaction. Please try again.');
      setIsSubmitting(false);
      setShowPaymentConfirm(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!workerId) {
      setError('Select a worker.');
      return;
    }

    const numAmount = parseCleanAmount(amount);
    if (numAmount <= 0) {
      setError('Enter an amount greater than ₹0.');
      return;
    }

    if (!date) {
      setError('Please choose a valid date.');
      return;
    }

    // Confirmation UX for Payment: Ask confirmation before saving payment
    if (type === 'payment' && !showPaymentConfirm) {
      setShowPaymentConfirm(true);
      return;
    }

    executeSave(numAmount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold ${
                type === 'advance'
                  ? 'bg-amber-500'
                  : type === 'payment'
                  ? 'bg-emerald-600'
                  : type === 'earning'
                  ? 'bg-blue-600'
                  : 'bg-purple-600'
              }`}
            >
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {type === 'advance'
                  ? 'Give Worker Advance'
                  : type === 'payment'
                  ? 'Record Worker Payment'
                  : 'Add Work / Earning'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fast chronological ledger entry
              </p>
            </div>
          </div>
          <button
            onClick={handleAttemptClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* Type Selector (Large touch buttons) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Entry Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('advance')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                  type === 'advance'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Advance</span>
              </button>

              <button
                type="button"
                onClick={() => setType('payment')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                  type === 'payment'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setType('earning')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                  type === 'earning'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Work / Earning</span>
              </button>
            </div>
          </div>

          {/* Worker Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Worker *
              </label>
              {data.workers.length > 1 && (
                <span className="text-[11px] text-slate-400">Tap below or pick from list</span>
              )}
            </div>

            {/* Quick Worker Tap Chips for fast 1-tap mobile selection */}
            {data.workers.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
                {data.workers.slice(0, 6).map((w) => {
                  const isSelected = workerId === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWorkerId(w.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {w.name}
                    </button>
                  );
                })}
              </div>
            )}

            {data.workers.length === 0 ? (
              <div className="p-3 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                No workers registered yet. Please add a worker profile first.
              </div>
            ) : (
              <select
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  -- Select Worker --
                </option>
                {data.workers.map((w) => {
                  const summary = workerSummaries.find((s) => s.id === w.id);
                  return (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.role ? `(${w.role})` : ''} - Due:{' '}
                      {formatCurrency(summary?.currentBalance || 0)}
                    </option>
                  );
                })}
              </select>
            )}

            {/* Current Balance & Live Calculation Preview */}
            {selectedWorkerSummary && (
              <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Current Balance Due:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(currentBal)}
                  </span>
                </div>

                {parsedAmount > 0 && (
                  <div className="flex items-center justify-between font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Forecasted Balance:</span>
                    </span>
                    <span
                      className={
                        forecastedBalance > 0
                          ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                          : 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                      }
                    >
                      {formatCurrency(forecastedBalance)}
                    </span>
                  </div>
                )}

                <div className="text-[11px] text-slate-400">
                  {type === 'earning' && 'Work credit will be added to total earnings.'}
                  {type === 'advance' && 'Cash advance will be deducted from worker balance.'}
                  {type === 'payment' && 'Wage payment will be deducted from worker balance.'}
                </div>
              </div>
            )}
          </div>

          {/* Amount (Big numeric input) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                ₹
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-lg font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Enter amount (e.g. 5000 or ₹5,000)
            </p>
          </div>

          {/* Date & Project Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Linked Project (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- None / General Work --</option>
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.company})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Note / Description (Optional)
            </label>
            <input
              type="text"
              placeholder={
                type === 'advance'
                  ? 'e.g. Festival advance, emergency cash'
                  : type === 'payment'
                  ? 'e.g. Cash settled on site, GooglePay'
                  : 'e.g. Agreed rate for 5 duct units installation'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || data.workers.length === 0}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'advance'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                  : type === 'payment'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog for Payment (Point 7) */}
      {showPaymentConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Record payment?
                </h3>
                <p className="text-xs text-slate-500">
                  Please verify payment settlement details
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Worker:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedWorkerSummary?.name || 'Worker'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Amount:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrency(parseCleanAmount(amount))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date:</span>
                <span className="font-bold text-slate-900 dark:text-white">{date ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => executeSave(parseCleanAmount(amount))}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                {isSubmitting ? 'Saving...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Unsaved Changes Dialog (Point 9) */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Discard unsaved changes?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              You entered transaction details that haven't been saved yet. If you leave now, this data will be lost.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  closeQuickEntry();
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
