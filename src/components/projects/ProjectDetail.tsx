import React, { useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Building,
  MapPin,
  Calendar,
  Users,
  FileText,
  Clock,
  Edit2,
  Trash2,
  Plus,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Printer,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProjectStatus } from '../../types';
import {
  formatCurrency,
  formatDate,
} from '../../services/formatters';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  onEdit: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  projectId,
  onBack,
  onEdit,
}) => {
  const {
    data,
    workerSummaries,
    openQuickEntry,
    openAddBillModal,
    updateProject,
    deleteProject,
    setActiveTab,
    setSelectedBillId,
    setSelectedWorkerId,
  } = useApp();

  const [activeTab, setActiveSubTab] = useState<'overview' | 'workers' | 'billing' | 'activity'>('overview');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [completeConfirm, setCompleteConfirm] = useState(false);

  const project = data.projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Project record not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  // Assigned workers
  const assignedWorkers = workerSummaries.filter((w) =>
    (project.assignedWorkerIds || []).includes(w.id)
  );

  // Bills linked to this project
  const linkedBills = data.bills.filter((b) => b.projectId === projectId);
  const totalBilled = linkedBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

  // Ledger history on this project
  const projectLedger = data.ledger.filter((l) => l.projectId === projectId);
  const workerMap = new Map(data.workers.map((w) => [w.id, w.name]));

  // Financial breakdown linked to this project (Prompt Requirements 7 & 8)
  const workerEarningsOnProject = projectLedger
    .filter((l) => l.type === 'earning')
    .reduce((acc, l) => acc + l.amount, 0);

  const advancesOnProject = projectLedger
    .filter((l) => l.type === 'advance')
    .reduce((acc, l) => acc + l.amount, 0);

  const paymentsOnProject = projectLedger
    .filter((l) => l.type === 'payment')
    .reduce((acc, l) => acc + l.amount, 0);

  // Simple Approx Margin calculation (Prompt Requirement 8)
  const hasMarginData = totalBilled > 0 && workerEarningsOnProject > 0;
  const approxMargin = totalBilled - workerEarningsOnProject;
  const approxMarginPercent = totalBilled > 0 ? Math.round((approxMargin / totalBilled) * 100) : 0;

  const handleStatusChange = (newStatus: ProjectStatus) => {
    if (newStatus === 'Completed' && project.status !== 'Completed') {
      setCompleteConfirm(true);
    } else {
      updateProject(project.id, { status: newStatus });
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-5xl mx-auto">
      {/* PRINT-ONLY PROJECT STATEMENT */}
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
                {data.settings.address} • Contact: {data.settings.phonePrimary}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold uppercase tracking-wider border border-black px-2 py-1">
                Project Statement
              </span>
              <p className="text-xs text-gray-600 mt-2">
                Date: {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border border-gray-300 mb-6">
          <div>
            <p className="text-xs uppercase text-gray-500 font-bold">Project Name</p>
            <p className="text-lg font-bold">{project.name}</p>
            <p className="text-xs text-gray-700">Client / Company: {project.company}</p>
            <p className="text-xs text-gray-700">Site Location: {project.site}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-gray-500 font-bold">Status: {project.status}</p>
            <p className="text-sm">
              Start: {formatDate(project.startDate)} {project.endDate ? `• End: ${formatDate(project.endDate)}` : ''}
            </p>
            <p className="text-xs uppercase text-gray-500 font-bold mt-2">Contract Agreed Value</p>
            <p className="text-xl font-black text-black">
              {formatCurrency(project.agreedAmount)}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2">Scope & Work Description</h3>
          <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded border border-gray-300 whitespace-pre-wrap">
            {project.workDescription}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
            Assigned Workers ({assignedWorkers.length})
          </h3>
          <div className="text-xs text-gray-700">
            {assignedWorkers.map((w) => `${w.name} (${w.role || 'AC Technician'})`).join(', ') || 'None assigned'}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
            Billing Summary (Total Billed: {formatCurrency(totalBilled)})
          </h3>
          <table className="w-full text-left text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-2 border-r border-gray-300 font-bold">Bill #</th>
                <th className="p-2 border-r border-gray-300 font-bold">Date</th>
                <th className="p-2 border-r border-gray-300 font-bold">Description</th>
                <th className="p-2 text-right font-bold">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {linkedBills.map((b) => (
                <tr key={b.id} className="border-b border-gray-200">
                  <td className="p-2 border-r border-gray-300 font-bold">{b.billNumber}</td>
                  <td className="p-2 border-r border-gray-300">{formatDate(b.date)}</td>
                  <td className="p-2 border-r border-gray-300">{b.workDescription}</td>
                  <td className="p-2 text-right font-bold">{formatCurrency(b.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCREEN UI */}
      {/* Top Banner */}
      <div className="no-print bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mt-0.5"
            title="Back to projects"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {project.name}
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                {project.company}
              </span>

              {/* Status selector directly on banner */}
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                className={`text-xs font-bold px-2 py-0.5 rounded-full border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                  project.status === 'Active'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : project.status === 'Completed'
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                    : project.status === 'Archived'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                }`}
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{project.site}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Started: {formatDate(project.startDate)}</span>
              </span>
              {project.agreedAmount ? (
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Agreed Rate: {formatCurrency(project.agreedAmount)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintStatement}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            title="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS ROW FOR THIS PROJECT */}
      <div className="no-print flex flex-wrap items-center gap-2.5">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-100 transition-all"
        >
          <Users className="w-3.5 h-3.5" />
          <span>+ Add / Assign Worker</span>
        </button>

        <button
          onClick={() => openQuickEntry('earning', undefined, project.id)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Work Earning</span>
        </button>

        <button
          onClick={() => openAddBillModal(project)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 hover:bg-teal-100 transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>+ Create Bill</span>
        </button>
      </div>

      {/* Tabs Row */}
      <div className="no-print flex border-b border-slate-200 dark:border-slate-800 gap-2">
        {(
          [
            { id: 'overview', label: 'Overview & Scope' },
            { id: 'workers', label: `Assigned Workers (${assignedWorkers.length})` },
            { id: 'billing', label: `Billing & Bills (${linkedBills.length})` },
            { id: 'activity', label: `Ledger Records (${projectLedger.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Scope */}
      {activeTab === 'overview' && (
        <div className="no-print space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Company / Client
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                {project.company}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Site: {project.site}</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Contract Agreed Amount
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                {formatCurrency(project.agreedAmount)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Total Billed: {formatCurrency(totalBilled)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Schedule
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                Start: {formatDate(project.startDate)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                End: {project.endDate ? formatDate(project.endDate) : 'In progress'}
              </div>
            </div>
          </div>

          {/* PROJECT FINANCIAL SUMMARY & APPROX. MARGIN (Prompt Requirements 7 & 8) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Project Financial Summary</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comparing company billing records with worker financial hisaab on this site
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 self-start sm:self-auto">
                Site Ledger: {projectLedger.length} transaction{projectLedger.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Company Billing Records */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                    Company Billing Records
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    Client: {project.company}
                  </span>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Project Contract Amount:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {project.agreedAmount ? formatCurrency(project.agreedAmount) : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Total Billed Amount:</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                      {formatCurrency(totalBilled)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Bills Generated:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {linkedBills.length} bill{linkedBills.length === 1 ? '' : 's'} issued
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Worker Financial Records */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Worker Financial Records
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {assignedWorkers.length} Worker{assignedWorkers.length === 1 ? '' : 's'} Assigned
                  </span>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Worker Earnings linked to Project:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400">
                      {formatCurrency(workerEarningsOnProject)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Advances linked to Project:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(advancesOnProject)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Payments linked to Project:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(paymentsOnProject)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Approx. Margin (Prompt Requirement 8) */}
            <div className="pt-2">
              {hasMarginData ? (
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Approx. Margin
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                          {approxMarginPercent}% of Billed Value
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Project Bill Amount ({formatCurrency(totalBilled)}) minus Worker Cost ({formatCurrency(workerEarningsOnProject)})
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(approxMargin)}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-emerald-100 dark:border-emerald-900/30">
                    * Clearly labeled "Approx. Margin": This is an operational indicator (Bill Amount − Worker Cost) and is NOT a complete accounting/net profit calculation. It excludes materials, travel, transport, taxes, and general company overhead.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>
                    <strong>Approx. Margin:</strong> Metric will appear automatically once both project bills and worker earnings are recorded.
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {totalBilled === 0 ? 'No bills yet' : 'No worker earnings linked yet'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Work Description Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Work Description & Scope
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {project.workDescription || 'No work description specified.'}
            </p>

            {project.notes && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Site Notes:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {project.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Workers */}
      {activeTab === 'workers' && (
        <div className="no-print space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Workers registered to work on this project
            </p>
            <button
              onClick={onEdit}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Assign / Edit Workers
            </button>
          </div>

          {assignedWorkers.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
              <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold">No workers assigned to this site yet.</p>
              <button
                onClick={onEdit}
                className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Assign Workers
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignedWorkers.map((w) => (
                <div
                  key={w.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4
                      onClick={() => setSelectedWorkerId(w.id)}
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer"
                    >
                      {w.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {w.role || 'AC Technician'} • {w.phone || 'No phone'}
                    </p>
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">
                      Due Balance: {formatCurrency(w.currentBalance)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openQuickEntry('advance', w.id, project.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                    >
                      Advance
                    </button>
                    <button
                      onClick={() => setSelectedWorkerId(w.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                    >
                      Ledger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Billing */}
      {activeTab === 'billing' && (
        <div className="no-print space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Total Bills Issued: <strong className="text-slate-900 dark:text-white">{formatCurrency(totalBilled)}</strong>
            </div>
            <button
              onClick={() => {
                setActiveTab('bills');
                window.dispatchEvent(
                  new CustomEvent('open-add-bill-for-project', { detail: { project } })
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Bill For This Project</span>
            </button>
          </div>

          {linkedBills.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
              <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold">No bills generated for this project yet.</p>
              <p className="text-xs mt-0.5">
                Generate an official printable bill when work is completed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-2">
              {linkedBills.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBillId(b.id);
                    setActiveTab('bills');
                  }}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {b.billNumber}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                        {b.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Billed to: {b.company} • Date: {formatDate(b.date)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(b.totalAmount)}
                    </div>
                    <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 justify-end">
                      <span>View & Print</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Ledger Activity on Site */}
      {activeTab === 'activity' && (
        <div className="no-print space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Worker advances, payments and rates charged for this site
            </span>
          </div>

          {projectLedger.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
              <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold">No transactions recorded for this site.</p>
              <p className="text-xs mt-0.5">
                When adding an advance or work earning, choose this project from the dropdown.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-2">
              {projectLedger.map((l) => (
                <div
                  key={l.id}
                  className="p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {workerMap.get(l.workerId) || 'Worker'} -{' '}
                      <span className="capitalize">{l.type}</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {formatDate(l.date)} {l.note ? `• ${l.note}` : ''}
                    </div>
                  </div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {formatCurrency(l.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal when Marking as Completed */}
      {completeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Mark Project Completed?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please confirm that site work, installation, and client handover for{' '}
              <strong>{project.name}</strong> have finished.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCompleteConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateProject(project.id, {
                    status: 'Completed',
                    endDate: project.endDate || new Date().toISOString().slice(0, 10),
                  });
                  setCompleteConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirm Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Delete Project?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <strong>{project.name}</strong>?
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
                  deleteProject(project.id);
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
