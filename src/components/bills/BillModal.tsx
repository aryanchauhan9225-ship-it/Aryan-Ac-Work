import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { Bill, BillItem, BillStatus, Project } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  generateNextBillNumber,
  getTodayDateString,
  formatCurrency,
  amountToIndianWords,
} from '../../services/formatters';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billToEdit?: Bill | null;
  preselectedProject?: Project | null;
}

interface LineItemState {
  id: string;
  description: string;
  quantity: number | string;
  unit: string;
  rate: number | string;
  amount: number;
}

const COMMON_UNITS = [
  'Nos',
  'Set',
  'Job',
  'Meter',
  'Feet',
  'Rmt',
  'Sq.ft',
  'Point',
  'Lot',
  'Coil',
  'Hours',
  'Visit',
  'Kg',
];

export const BillModal: React.FC<BillModalProps> = ({
  isOpen,
  onClose,
  billToEdit,
  preselectedProject,
}) => {
  const { data, addBill, updateBill } = useApp();

  const availableCompanies = React.useMemo(() => {
    const list = new Set<string>([
      'LG',
      'Voltas',
      'Daikin',
      'Blue Star',
      'Hitachi',
      'Carrier',
      'Direct / Walk-in',
      ...data.companies.map((c) => c.name),
    ]);
    return Array.from(list).filter(Boolean);
  }, [data.companies]);

  const [billNumber, setBillNumber] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [company, setCompany] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [site, setSite] = useState('');
  const [kindAttn, setKindAttn] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState('');
  const [items, setItems] = useState<LineItemState[]>([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<BillStatus>('Generated');
  const [taxLabel, setTaxLabel] = useState(data.settings.taxLabel || 'Service Tax');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState('18');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LineItemState | null>(null);

  useEffect(() => {
    const allKnown = Array.from(
      new Set([
        ...data.bills.map((b) => b.billNumber),
        ...(data.historicalBillNumbers || []),
      ])
    );

    if (billToEdit) {
      setBillNumber(billToEdit.billNumber);
      setDate(billToEdit.date);
      setCompany(billToEdit.company);
      setProjectId(billToEdit.projectId || '');
      setProjectName(billToEdit.projectName);
      setSite(billToEdit.site || '');
      setKindAttn(billToEdit.kindAttn || '');
      setPoNumber(billToEdit.poNumber || '');
      setPoDate(billToEdit.poDate || '');
      setNotes(billToEdit.notes || '');
      setStatus(billToEdit.status);
      setTaxLabel(billToEdit.taxLabel || data.settings.taxLabel || 'Service Tax');
      setTaxEnabled(!!billToEdit.taxEnabled);
      setTaxRate(billToEdit.taxRate ? String(billToEdit.taxRate) : '18');

      if (billToEdit.items && billToEdit.items.length > 0) {
        setItems(
          billToEdit.items.map((it, idx) => ({
            id: it.id || `item_${idx}_${Date.now()}`,
            description: it.description || '',
            quantity: it.quantity !== undefined ? it.quantity : 1,
            unit: it.unit || 'Nos',
            rate: it.rate !== undefined ? it.rate : 0,
            amount: Number(it.amount) || (Number(it.quantity) || 1) * (Number(it.rate) || 0),
          }))
        );
      } else {
        const singleAmt = billToEdit.subtotal || billToEdit.totalAmount || 0;
        setItems([
          {
            id: 'item_1',
            description: billToEdit.workDescription || 'AC Installation / Contract Work',
            quantity: 1,
            unit: 'Job',
            rate: singleAmt,
            amount: singleAmt,
          },
        ]);
      }
    } else if (preselectedProject) {
      const nextNum = generateNextBillNumber(allKnown);
      setBillNumber(nextNum);
      setDate(getTodayDateString());
      setCompany(preselectedProject.company);
      setProjectId(preselectedProject.id);
      setProjectName(preselectedProject.name);
      setSite(preselectedProject.site || '');
      setKindAttn('');
      setPoNumber('');
      setPoDate('');
      setNotes('Payment terms: Net 15 days from bill date.');
      setStatus('Generated');
      setTaxLabel(data.settings.taxLabel || 'Service Tax');
      setTaxEnabled(data.settings.enableGstBilling);
      setTaxRate('18');

      const projAmt = preselectedProject.agreedAmount || 0;
      setItems([
        {
          id: 'item_1',
          description: preselectedProject.workDescription || `${preselectedProject.name} AC Work`,
          quantity: 1,
          unit: 'Job',
          rate: projAmt,
          amount: projAmt,
        },
      ]);
    } else {
      const nextNum = generateNextBillNumber(allKnown);
      setBillNumber(nextNum);
      setDate(getTodayDateString());
      setCompany(data.settings.lastUsedCompany || data.projects[0]?.company || 'LG');
      setProjectId('');
      setProjectName('');
      setSite('');
      setKindAttn('');
      setPoNumber('');
      setPoDate('');
      setNotes('Payment terms: Net 15 days from bill date.');
      setStatus('Generated');
      setTaxLabel(data.settings.taxLabel || 'Service Tax');
      setTaxEnabled(data.settings.enableGstBilling);
      setTaxRate('18');
      setItems([
        {
          id: 'item_1',
          description: 'AC Installation / Contract Work',
          quantity: 1,
          unit: 'Nos',
          rate: '',
          amount: 0,
        },
      ]);
    }
    setError('');
    setIsSubmitting(false);
    setShowDiscardConfirm(false);
    setItemToDelete(null);
  }, [
    billToEdit,
    preselectedProject,
    isOpen,
    data.bills,
    data.historicalBillNumbers,
    data.settings.enableGstBilling,
    data.settings.lastUsedCompany,
    data.settings.taxLabel,
  ]);

  if (!isOpen) return null;

  // Safe numerical calculations avoiding NaN
  const getItemAmount = (it: LineItemState): number => {
    const q = typeof it.quantity === 'number' ? it.quantity : (it.quantity === '' ? 0 : parseFloat(String(it.quantity)) || 0);
    const r = typeof it.rate === 'number' ? it.rate : (it.rate === '' ? 0 : parseFloat(String(it.rate)) || 0);
    return Math.round(q * r * 100) / 100;
  };

  const calculatedSubtotal = items.reduce((sum, it) => sum + getItemAmount(it), 0);
  const taxRateNum = parseFloat(taxRate) || 0;
  const calculatedTaxAmount = taxEnabled ? Math.round((calculatedSubtotal * taxRateNum) / 100) : 0;
  const calculatedTotalAmount = calculatedSubtotal + calculatedTaxAmount;
  const calculatedWords = amountToIndianWords(calculatedTotalAmount);

  const hasUnsavedChanges = billToEdit
    ? JSON.stringify(items) !== JSON.stringify(billToEdit.items || []) ||
      notes !== (billToEdit.notes || '') ||
      poNumber !== (billToEdit.poNumber || '') ||
      kindAttn !== (billToEdit.kindAttn || '')
    : items.some((it) => it.description.trim() || Number(it.rate) > 0) || company.trim().length > 0;

  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleProjectSelect = (projId: string) => {
    setProjectId(projId);
    const p = data.projects.find((proj) => proj.id === projId);
    if (p) {
      setCompany(p.company);
      setProjectName(p.name);
      setSite(p.site || '');
      if (p.workDescription && items.length === 1 && !items[0].description) {
        updateItem(items[0].id, 'description', p.workDescription);
      }
    }
  };

  const updateItem = (id: string, field: keyof LineItemState, value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          const qVal = field === 'quantity' ? value : it.quantity;
          const rVal = field === 'rate' ? value : it.rate;
          const q = typeof qVal === 'number' ? qVal : (qVal === '' ? 0 : parseFloat(String(qVal)) || 0);
          const r = typeof rVal === 'number' ? rVal : (rVal === '' ? 0 : parseFloat(String(rVal)) || 0);
          updated.amount = Math.round(q * r * 100) / 100;
        }
        return updated;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        description: '',
        quantity: 1,
        unit: 'Nos',
        rate: '',
        amount: 0,
      },
    ]);
  };

  const requestRemoveItem = (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;

    const hasContent = item.description.trim().length > 0 || (item.rate !== '' && Number(item.rate) > 0);
    if (!hasContent) {
      if (items.length <= 1) {
        setItems([
          {
            id: `item_${Date.now()}`,
            description: '',
            quantity: 1,
            unit: 'Nos',
            rate: '',
            amount: 0,
          },
        ]);
      } else {
        setItems((prev) => prev.filter((it) => it.id !== id));
      }
      return;
    }

    setItemToDelete(item);
  };

  const confirmRemoveItem = () => {
    if (!itemToDelete) return;
    if (items.length <= 1) {
      setItems([
        {
          id: `item_${Date.now()}`,
          description: '',
          quantity: 1,
          unit: 'Nos',
          rate: '',
          amount: 0,
        },
      ]);
    } else {
      setItems((prev) => prev.filter((it) => it.id !== itemToDelete.id));
    }
    setItemToDelete(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedNum = billNumber.trim();
    if (!trimmedNum) {
      setError('Bill / Invoice number is required.');
      return;
    }

    const isDuplicate = data.bills.some(
      (b) => b.billNumber.toLowerCase() === trimmedNum.toLowerCase() && b.id !== billToEdit?.id
    );
    if (isDuplicate) {
      setError(`Bill number "${trimmedNum}" is already in use. Bill numbers must be unique.`);
      return;
    }

    if (!company.trim()) {
      setError('Company / recipient name is required.');
      return;
    }

    if (items.length === 0 || calculatedSubtotal <= 0) {
      setError('Please add at least one work item with quantity and rate greater than ₹0.');
      return;
    }

    setIsSubmitting(true);

    const billPayload: Omit<Bill, 'id' | 'createdAt'> = {
      billNumber: trimmedNum,
      date,
      company: company.trim(),
      projectId: projectId || undefined,
      projectName: projectName.trim() || 'AC Installation & Service Work',
      site: site.trim() || 'Project Site',
      kindAttn: kindAttn.trim() || undefined,
      poNumber: poNumber.trim() || undefined,
      poDate: poDate || undefined,
      items: items.map((it) => {
        const qNum = typeof it.quantity === 'number' ? it.quantity : (it.quantity === '' ? 0 : parseFloat(String(it.quantity)) || 0);
        const rNum = typeof it.rate === 'number' ? it.rate : (it.rate === '' ? 0 : parseFloat(String(it.rate)) || 0);
        const amt = Math.round(qNum * rNum * 100) / 100;
        return {
          id: it.id,
          description: it.description.trim() || 'AC Contract Item',
          quantity: qNum,
          unit: it.unit.trim() || 'Nos',
          rate: rNum,
          amount: amt,
        };
      }),
      workDescription: items.map((it) => it.description.trim()).filter(Boolean).join('; ') || 'AC Contract Work',
      subtotal: calculatedSubtotal,
      taxLabel: taxLabel.trim() || 'Service Tax',
      taxEnabled,
      taxRate: taxEnabled ? taxRateNum : undefined,
      taxAmount: taxEnabled ? calculatedTaxAmount : undefined,
      totalAmount: calculatedTotalAmount,
      notes: notes.trim() || undefined,
      status,
    };

    try {
      if (billToEdit) {
        updateBill(billToEdit.id, billPayload);
      } else {
        addBill(billPayload);
      }
      onClose();
    } catch {
      setError('Failed to save bill. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-3xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {billToEdit ? `Edit Bill — ${billToEdit.billNumber}` : 'Create Contractor Bill (ARYAN AC WORKS)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Printable A4 contractor bill matching original business format
              </p>
            </div>
          </div>
          <button
            onClick={handleAttemptClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Invoice No & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Invoice No. *
              </label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Invoice Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Recipient & Site */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                TO: Company / Client Name *
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="e.g. LG Electronics / Client Name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  list="bill-companies"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <datalist id="bill-companies">
                  {availableCompanies.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Link to Project (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="">-- No project link (Standalone bill) --</option>
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.company} • {p.site})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Site Name and Kind Attn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Site Name / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Pune / Hadapsar / Viman Nagar"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Kind Attn (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Mr. Rajesh Verma / Project Head"
                value={kindAttn}
                onChange={(e) => setKindAttn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* PO No. and PO Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                PO No. (Purchase Order #)
              </label>
              <input
                type="text"
                placeholder="e.g. PO/2026/9821"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                PO Date
              </label>
              <input
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Work Items Table Section (SR NO | PARTICULARS | QTY | UNIT | RATE | AMOUNT) */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Work Items Table ({items.length} item{items.length === 1 ? '' : 's'})
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enter work descriptions, quantities, units and rates. Line amounts calculate automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs active:scale-95 transition-all self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider">
                      <th className="p-2.5 text-center w-16">SR NO</th>
                      <th className="p-2.5 min-w-[220px]">PARTICULARS</th>
                      <th className="p-2.5 w-24 text-center">QTY</th>
                      <th className="p-2.5 w-28 text-center">UNIT</th>
                      <th className="p-2.5 w-28 text-right">RATE (₹)</th>
                      <th className="p-2.5 w-32 text-right">AMOUNT (₹)</th>
                      <th className="p-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        {/* SR NO with reorder controls */}
                        <td className="p-2 text-center align-middle">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-extrabold text-slate-700 dark:text-slate-300 text-xs w-4">
                              {idx + 1}
                            </span>
                            {items.length > 1 && (
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveItem(idx, 'up')}
                                  className="p-0.5 rounded text-slate-400 hover:text-teal-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                                  title="Move row up"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === items.length - 1}
                                  onClick={() => moveItem(idx, 'down')}
                                  className="p-0.5 rounded text-slate-400 hover:text-teal-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                                  title="Move row down"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* PARTICULARS (Work Description) */}
                        <td className="p-2.5 align-middle">
                          <input
                            type="text"
                            placeholder="e.g. Copper piping with insulation / Cassette unit installation"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                          />
                        </td>

                        {/* QTY */}
                        <td className="p-2.5 align-middle">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-center font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>

                        {/* UNIT */}
                        <td className="p-2.5 align-middle">
                          <input
                            type="text"
                            list="unit-options"
                            placeholder="Nos, Set, Job..."
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-center font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>

                        {/* RATE */}
                        <td className="p-2.5 align-middle text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-right font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>

                        {/* AMOUNT (Automatically Calculated) */}
                        <td className="p-2.5 align-middle text-right font-extrabold text-slate-900 dark:text-white text-xs whitespace-nowrap">
                          {formatCurrency(getItemAmount(item))}
                        </td>

                        {/* Actions */}
                        <td className="p-2.5 align-middle text-center">
                          <button
                            type="button"
                            onClick={() => requestRemoveItem(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={items.length === 1 ? 'Clear item' : 'Delete item'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Actions */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Item</span>
                </button>

                {/* Common Unit Pills */}
                <div className="flex items-center gap-1 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-400 mr-1">Suggested Units:</span>
                  {COMMON_UNITS.slice(0, 7).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => {
                        const targetId = items[items.length - 1]?.id;
                        if (targetId) updateItem(targetId, 'unit', u);
                      }}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:text-teal-600 text-[10px] font-bold transition-colors"
                      title={`Set unit of last row to ${u}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <datalist id="unit-options">
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>

          {/* Subtotal, Tax and Total Calculation Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Sub Total (Sum of Line Items):
              </span>
              <span className="font-extrabold text-base text-slate-900 dark:text-white">
                {formatCurrency(calculatedSubtotal)}
              </span>
            </div>

            {/* Configurable Tax Section */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tax-toggle"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <label htmlFor="tax-toggle" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Apply Tax ({taxLabel || 'Service Tax'})
                  </label>
                </div>

                {taxEnabled && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tax Label"
                      value={taxLabel}
                      onChange={(e) => setTaxLabel(e.target.value)}
                      className="w-28 px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="w-14 px-2 py-1 text-xs font-bold text-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                )}
              </div>

              {taxEnabled && (
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 pl-6">
                  <span>Calculated {taxLabel}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(calculatedTaxAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Total and Total in Words */}
            <div className="pt-3 border-t-2 border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white block">
                  Total Bill Amount:
                </span>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 italic block mt-0.5">
                  {calculatedWords}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                  {formatCurrency(calculatedTotalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Notes & Terms (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Payment due within 15 days; workmanship guaranteed"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Bill Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Generated')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    status === 'Generated'
                      ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Generated / Final
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Draft')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    status === 'Draft'
                      ? 'bg-slate-700 text-white border-slate-800 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Draft
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-500/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : billToEdit ? 'Save Changes' : 'Generate Bill'}
            </button>
          </div>
        </form>
      </div>

      {/* Discard Confirmation Dialog */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Discard unsaved bill?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              You have unsaved changes to this bill. If you leave now, these changes will be lost.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Dialog */}
      {itemToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Remove Line Item?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to remove item{' '}
              <strong className="text-slate-900 dark:text-white">
                "{itemToDelete.description || 'this item'}"
              </strong>
              {itemToDelete.amount > 0 ? (
                <>
                  {' '}
                  valued at{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {formatCurrency(itemToDelete.amount)}
                  </strong>
                </>
              ) : null}
              ? This action will automatically renumber remaining items.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveItem}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Remove Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
