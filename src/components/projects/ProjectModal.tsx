import React, { useState, useEffect } from 'react';
import { X, Briefcase, Building, MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import { Project, ProjectStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../services/formatters';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
}

const DEFAULT_COMMON_COMPANIES = [
  'LG',
  'Voltas',
  'Daikin',
  'Blue Star',
  'Hitachi',
  'Carrier',
  'Direct / Walk-in',
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projectToEdit,
}) => {
  const { data, addProject, updateProject } = useApp();

  // Combine default common companies with all saved companies from data
  const availableCompanies = React.useMemo(() => {
    const list = new Set<string>([
      ...DEFAULT_COMMON_COMPANIES,
      ...data.companies.map((c) => c.name),
    ]);
    return Array.from(list).filter(Boolean);
  }, [data.companies]);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('LG');
  const [customCompany, setCustomCompany] = useState('');
  const [site, setSite] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState('');
  const [agreedAmount, setAgreedAmount] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Active');
  const [assignedWorkerIds, setAssignedWorkerIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      if (availableCompanies.includes(projectToEdit.company)) {
        setCompany(projectToEdit.company);
        setCustomCompany('');
      } else {
        setCompany('Other');
        setCustomCompany(projectToEdit.company);
      }
      setSite(projectToEdit.site);
      setWorkDescription(projectToEdit.workDescription || '');
      setStartDate(projectToEdit.startDate || getTodayDateString());
      setEndDate(projectToEdit.endDate || '');
      setAgreedAmount(projectToEdit.agreedAmount ? String(projectToEdit.agreedAmount) : '');
      setStatus(projectToEdit.status);
      setAssignedWorkerIds(projectToEdit.assignedWorkerIds || []);
      setNotes(projectToEdit.notes || '');
    } else {
      setName('');
      setCompany(data.settings.lastUsedCompany || 'LG');
      setCustomCompany('');
      setSite('');
      setWorkDescription('');
      setStartDate(getTodayDateString());
      setEndDate('');
      setAgreedAmount('');
      setStatus('Active');
      setAssignedWorkerIds([]);
      setNotes('');
    }
    setError('');
    setShowDiscardConfirm(false);
  }, [projectToEdit, isOpen, availableCompanies, data.settings.lastUsedCompany]);

  if (!isOpen) return null;

  const hasUnsavedChanges = projectToEdit
    ? name !== projectToEdit.name || site !== projectToEdit.site || workDescription !== (projectToEdit.workDescription || '')
    : name.trim().length > 0 || site.trim().length > 0 || workDescription.trim().length > 0;

  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const toggleWorker = (id: string) => {
    setAssignedWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((wId) => wId !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    const finalCompany = company === 'Other' ? customCompany.trim() : company;
    if (!finalCompany) {
      setError('Company name is required.');
      return;
    }

    if (!site.trim()) {
      setError('Site / location is required.');
      return;
    }

    const numAmount = agreedAmount ? parseFloat(agreedAmount) : undefined;

    const projectData = {
      name: name.trim(),
      company: finalCompany,
      site: site.trim(),
      workDescription: workDescription.trim(),
      startDate,
      endDate: endDate || undefined,
      agreedAmount: isNaN(numAmount as number) ? undefined : numAmount,
      status,
      assignedWorkerIds,
      notes: notes.trim() || undefined,
    };

    if (projectToEdit) {
      updateProject(projectToEdit.id, projectData);
    } else {
      addProject(projectData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {projectToEdit ? 'Edit Site Project' : 'Create New Site Project'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track client contracts, assigned workers & site scope
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Project / Site Name *
            </label>
            <input
              type="text"
              placeholder="e.g. AC Installation – XYZ Site"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Company Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Company *
              </label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableCompanies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Other">+ Type Other / New Company...</option>
              </select>
            </div>

            {company === 'Other' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Specify Company Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter company name"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Site / Location *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Pune, Hadapsar"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {company === 'Other' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Site / Location *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Pune, Hadapsar"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Work Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Work Description / Scope
            </label>
            <textarea
              rows={2}
              placeholder="e.g. AC installation and related contract work (VRF piping, indoor unit bracket mounting)"
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Dates & Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Contract Amount (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 80000"
                value={agreedAmount}
                onChange={(e) => setAgreedAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Project Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Active', 'Completed', 'On Hold', 'Archived'] as ProjectStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    status === st
                      ? st === 'Active'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : st === 'Completed'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : st === 'Archived'
                        ? 'bg-slate-700 text-white border-slate-800 shadow-sm'
                        : 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned Workers checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Assigned Workers ({assignedWorkerIds.length} selected)
            </label>
            {data.workers.length === 0 ? (
              <p className="text-xs text-slate-400 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                No workers registered yet.
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                {data.workers.map((w) => {
                  const isChecked = assignedWorkerIds.includes(w.id);
                  return (
                    <label
                      key={w.id}
                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleWorker(w.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {w.name}
                      </span>
                      {w.role && (
                        <span className="text-[11px] text-slate-400">
                          ({w.role})
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Internal Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Copper pipes supplied by LG, scaffold arranged by site manager"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 active:scale-95 transition-all"
            >
              {projectToEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>

      {/* Discard Unsaved Changes Dialog (Point 9) */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Discard unsaved changes?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              You have unsaved changes in this project form. If you leave now, your changes will be lost.
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
                  onClose();
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
