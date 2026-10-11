import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Building,
  Calendar,
  MapPin,
  ArrowRight,
  Filter,
  DollarSign,
  Printer,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Bill, Project } from '../../types';
import { formatCurrency, formatDate } from '../../services/formatters';
import { BillModal } from './BillModal';
import { BillView } from './BillView';

export const BillList: React.FC = () => {
  const {
    data,
    selectedBillId,
    setSelectedBillId,
    isAddBillModalOpen,
    setIsAddBillModalOpen,
    preselectedBillProject,
    setPreselectedBillProject,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Generated' | 'Draft'>('All');
  const [companyFilter, setCompanyFilter] = useState<string>('All');
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);

  if (selectedBillId) {
    return (
      <>
        <BillView
          billId={selectedBillId}
          onBack={() => setSelectedBillId(null)}
          onEdit={() => {
            const b = data.bills.find((item) => item.id === selectedBillId);
            if (b) setBillToEdit(b);
          }}
        />
        <BillModal
          isOpen={billToEdit !== null}
          onClose={() => setBillToEdit(null)}
          billToEdit={billToEdit}
        />
      </>
    );
  }

  const companies = Array.from(new Set(data.bills.map((b) => b.company))).filter(Boolean);

  const filtered = data.bills.filter((b) => {
    const matchSearch =
      b.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.company.toLowerCase().includes(search.toLowerCase()) ||
      b.projectName.toLowerCase().includes(search.toLowerCase()) ||
      b.site.toLowerCase().includes(search.toLowerCase()) ||
      (b.workDescription && b.workDescription.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;
    if (companyFilter !== 'All' && b.company !== companyFilter) return false;
    return true;
  });

  const totalBilledValue = filtered.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bills & Contractor Invoices
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Sequential billing records (ACW-2026-XXX) with PDF generation and printing
          </p>
        </div>

        <button
          onClick={() => {
            setPreselectedBillProject(null);
            setBillToEdit(null);
            setIsAddBillModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Bill</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Bills Issued
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {data.bills.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Total Value Billed
          </div>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            {formatCurrency(totalBilledValue)}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Latest Bill Number
          </div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 truncate">
            {data.bills[0]?.billNumber || 'None yet'}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search bills by number, company, project or site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Generated', 'Draft'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}

          {companies.length > 1 && (
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              <option value="All">All Companies</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Bills Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
          <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            No bills found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {search ? 'Try clearing your search query' : 'Generate your first bill for completed contract work.'}
          </p>
          <button
            onClick={() => {
              setPreselectedBillProject(null);
              setBillToEdit(null);
              setIsAddBillModalOpen(true);
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create Bill</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <div
              key={b.id}
              onClick={() => setSelectedBillId(b.id)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
            >
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                      {b.billNumber}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                      {b.status}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {b.company}
                  </span>
                </div>

                <div className="mt-2.5">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {b.projectName}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{b.site}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Bill Date: {formatDate(b.date)}</span>
                  </div>
                </div>

                {b.workDescription && (
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                    {b.workDescription}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Amount
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {formatCurrency(b.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBillToEdit(b);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 transition-all shadow-2xs hover:shadow-xs active:scale-95"
                  title="Edit this bill and line items"
                >
                  <Edit2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Edit Bill</span>
                </button>
                <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
                  <Printer className="w-3.5 h-3.5" />
                  <span>View & Print</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bill Modal */}
      <BillModal
        isOpen={isAddBillModalOpen || billToEdit !== null}
        onClose={() => {
          setIsAddBillModalOpen(false);
          setBillToEdit(null);
          setPreselectedBillProject(null);
        }}
        billToEdit={billToEdit}
        preselectedProject={preselectedBillProject}
      />
    </div>
  );
};
