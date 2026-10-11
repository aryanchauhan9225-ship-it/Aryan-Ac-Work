import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Share2,
  Edit2,
  Trash2,
  Check,
  Building,
  MapPin,
  Calendar,
  AlertCircle,
  Wrench,
  FileText,
} from 'lucide-react';
import { Bill } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  formatCurrency,
  formatDate,
  amountToIndianWords,
} from '../../services/formatters';

interface BillViewProps {
  billId: string;
  onBack: () => void;
  onEdit: () => void;
}

export const BillView: React.FC<BillViewProps> = ({
  billId,
  onBack,
  onEdit,
}) => {
  const { data, deleteBill } = useApp();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const bill = data.bills.find((b) => b.id === billId);

  if (!bill) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Bill record not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold"
        >
          Back to Bills
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const textSummary =
      `*INVOICE / BILL: ${bill.billNumber}*\n` +
      `Business: ${data.settings.businessName || 'ARYAN AC WORKS'}\n` +
      `Bill To: ${bill.company}\n` +
      (bill.kindAttn ? `Kind Attn: ${bill.kindAttn}\n` : '') +
      (bill.site ? `Site Name: ${bill.site}\n` : '') +
      `Date: ${formatDate(bill.date)}\n` +
      (bill.poNumber ? `PO No.: ${bill.poNumber}\n` : '') +
      `Total Amount: ${formatCurrency(bill.totalAmount)}\n` +
      `(${amountToIndianWords(bill.totalAmount)})\n\n` +
      `Contact: ${data.settings.phonePrimary || ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bill ${bill.billNumber} - ${bill.company}`,
          text: textSummary,
        });
      } catch {
        await navigator.clipboard.writeText(textSummary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } else {
      await navigator.clipboard.writeText(textSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const lineItems =
    bill.items && bill.items.length > 0
      ? bill.items
      : [
          {
            id: 'item_1',
            description: bill.workDescription || 'AC Installation / Contract Work',
            quantity: 1,
            unit: 'Job',
            rate: bill.subtotal || bill.totalAmount,
            amount: bill.subtotal || bill.totalAmount,
          },
        ];

  const subtotal = bill.subtotal || lineItems.reduce((acc, it) => acc + it.amount, 0);
  const totalInWords = amountToIndianWords(bill.totalAmount);
  const taxLabel = bill.taxLabel || data.settings.taxLabel || 'Service Tax';
  const businessName = data.settings.businessName || 'ARYAN AC WORKS';

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-5xl mx-auto">
      {/* Action Header on Screen */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to bills list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {bill.billNumber}
              </h2>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  bill.status === 'Generated'
                    ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {bill.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Client: {bill.company} • Date: {formatDate(bill.date)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Bill</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied Details!' : 'Share Bill'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            title="Delete bill"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bill Document (A4 Business Bill Matching Paper Reference) */}
      <div className="print-page bg-white text-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-300 shadow-xl dark:border-slate-800 dark:bg-white dark:text-slate-900 font-sans">
        {/* Header Section */}
        <div className="border-b-2 border-slate-900 pb-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1 border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src="/assets/images/aryan-ac-work-logo.svg"
                  alt="ARYAN AC WORK"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 uppercase">
                  {businessName}
                </h1>
                <p className="text-xs font-bold text-blue-900 tracking-wider uppercase mt-0.5">
                  {data.settings.tagline || 'AC Contracting, Installation & Service Specialist'}
                </p>
                <div className="mt-2 text-xs text-slate-700 space-y-0.5">
                  {data.settings.address && <p>{data.settings.address}</p>}
                  {(data.settings.phonePrimary || data.settings.phoneSecondary) && (
                    <p className="font-semibold">
                      Mobile: {data.settings.phonePrimary}
                      {data.settings.phoneSecondary ? ` / ${data.settings.phoneSecondary}` : ''}
                    </p>
                  )}
                  {data.settings.email && <p>Email: {data.settings.email}</p>}
                  <div className="flex flex-wrap gap-4 text-slate-800 font-medium pt-1">
                    {(data.settings.panNumber || bill.panNumber) && (
                      <span>PAN: <strong>{data.settings.panNumber || bill.panNumber}</strong></span>
                    )}
                    {(data.settings.taxNumber || data.settings.gstNumber) && (
                      <span>
                        {data.settings.taxLabel || 'Service Tax'} Reg. No: <strong>{data.settings.taxNumber || data.settings.gstNumber}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-300 min-w-[210px] w-full sm:w-auto">
              <div className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
                RETAIL INVOICE / BILL
              </div>
              <div className="text-xs space-y-1 text-slate-700">
                <div className="flex justify-between gap-2">
                  <span className="font-bold">Invoice No:</span>
                  <span className="font-black text-slate-950">{bill.billNumber}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="font-bold">Invoice Date:</span>
                  <span>{formatDate(bill.date)}</span>
                </div>
                {bill.poNumber && (
                  <div className="flex justify-between gap-2 pt-1 border-t border-slate-200">
                    <span className="font-bold">PO No:</span>
                    <span className="font-semibold">{bill.poNumber}</span>
                  </div>
                )}
                {bill.poDate && (
                  <div className="flex justify-between gap-2">
                    <span className="font-bold">PO Date:</span>
                    <span>{formatDate(bill.poDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recipient and Reference Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-300 text-xs">
          <div>
            <div className="font-black uppercase tracking-wider text-slate-500 mb-1">
              TO:
            </div>
            <div className="text-sm font-black text-slate-950">
              {bill.company}
            </div>
            {bill.site && (
              <div className="mt-1 text-slate-700">
                <span className="font-bold">Site Name:</span> {bill.site}
              </div>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            {bill.kindAttn && (
              <div>
                <span className="font-bold text-slate-500 uppercase">Kind Attn:</span>{' '}
                <strong className="text-slate-900">{bill.kindAttn}</strong>
              </div>
            )}
            {bill.projectName && (
              <div>
                <span className="font-bold text-slate-500 uppercase">Project:</span>{' '}
                <span className="text-slate-800">{bill.projectName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Work Items Table (Columns: SR NO | PARTICULARS | QTY | UNIT | RATE | AMOUNT) */}
        <div className="py-4">
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-900 text-xs font-black uppercase tracking-wider border-b border-slate-300">
                <th className="py-2.5 px-3 border-r border-slate-300 w-14 text-center">SR NO</th>
                <th className="py-2.5 px-4 border-r border-slate-300">PARTICULARS</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-20 text-center">QTY</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-20 text-center">UNIT</th>
                <th className="py-2.5 px-4 border-r border-slate-300 w-28 text-right">RATE</th>
                <th className="py-2.5 px-4 w-32 text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-200">
              {lineItems.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="py-3 px-3 border-r border-slate-300 text-center font-bold text-slate-500 align-top">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4 border-r border-slate-300 align-top">
                    <div className="font-bold text-slate-900 whitespace-pre-wrap">
                      {item.description}
                    </div>
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 text-center font-semibold text-slate-800 align-top">
                    {item.quantity !== undefined ? item.quantity : 1}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 text-center text-slate-700 align-top">
                    {item.unit || 'Nos'}
                  </td>
                  <td className="py-3 px-4 border-r border-slate-300 text-right font-medium text-slate-800 align-top">
                    {formatCurrency(item.rate || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-950 align-top">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Section */}
        <div className="pt-2 border-t-2 border-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            {/* Amount in words and notes */}
            <div className="flex-1 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-300">
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Total Amount (in words):
                </span>
                <span className="block text-xs font-black text-slate-950 uppercase mt-0.5">
                  {totalInWords}
                </span>
              </div>

              {bill.notes && (
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-800">Notes & Terms:</strong> {bill.notes}
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Sub Total:</span>
                <span className="font-black text-slate-900">{formatCurrency(subtotal)}</span>
              </div>

              {bill.taxEnabled && bill.taxAmount ? (
                <div className="flex justify-between text-slate-700">
                  <span>{taxLabel} ({bill.taxRate}%):</span>
                  <span className="font-bold">{formatCurrency(bill.taxAmount)}</span>
                </div>
              ) : null}

              <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
                <span className="font-black text-slate-950 uppercase tracking-tight text-sm">
                  Total Amount:
                </span>
                <span className="text-xl font-black text-slate-950">
                  {formatCurrency(bill.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Signature & Authorized Representative */}
          <div className="pt-12 flex justify-between items-end text-xs">
            <div>
              <p className="text-slate-500 text-[11px]">Subject to local jurisdiction.</p>
              <p className="text-slate-500 text-[11px]">Computer generated bill printed for business record.</p>
            </div>
            <div className="text-right">
              <p className="font-black text-slate-900 uppercase">
                FOR {businessName}
              </p>
              <div className="h-14 border-b border-dashed border-slate-400 w-52 mb-1.5 ml-auto" />
              <p className="font-bold text-slate-700">Proprietor / Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Delete Bill?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete bill <strong>{bill.billNumber}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteBill(bill.id);
                  onBack();
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
