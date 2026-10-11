import React, { useState } from 'react';
import {
  Building,
  Plus,
  Search,
  Briefcase,
  FileText,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Edit2,
  Trash2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Company, Project, Bill } from '../../types';
import { formatCurrency, formatDate } from '../../services/formatters';

export const CompanyManagement: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const {
    data,
    addCompany,
    updateCompany,
    deleteCompany,
    selectedCompanyId,
    setSelectedCompanyId,
    navigateToProject,
    navigateToBill,
    setActiveTab,
  } = useApp();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // If a company is selected, show company detail page
  const selectedCompany = data.companies.find((c) => c.id === selectedCompanyId);

  // Filtered companies
  const filteredCompanies = data.companies.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  // Calculate stats for a given company name
  const getCompanyStats = (compName: string) => {
    const norm = compName.trim().toLowerCase();
    const projects = data.projects.filter((p) => p.company.trim().toLowerCase() === norm);
    const bills = data.bills.filter((b) => b.company.trim().toLowerCase() === norm);
    const contractValue = projects.reduce((sum, p) => sum + (p.agreedAmount || 0), 0);
    const billedValue = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return { projects, bills, contractValue, billedValue };
  };

  // DETAIL VIEW
  if (selectedCompany) {
    const stats = getCompanyStats(selectedCompany.name);

    return (
      <div className="space-y-6 pb-20 md:pb-8 max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setSelectedCompanyId(null)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mt-0.5"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {selectedCompany.name}
                </h2>
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                  Company
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedCompany.contactPerson && (
                  <span>Contact: {selectedCompany.contactPerson}</span>
                )}
                {selectedCompany.phone && <span>Phone: {selectedCompany.phone}</span>}
                {selectedCompany.address && <span>{selectedCompany.address}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompanyToEdit(selectedCompany)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Company</span>
            </button>
            <button
              onClick={() => setCompanyToDelete(selectedCompany)}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Delete Company"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Company KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Site Projects
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.projects.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {stats.projects.filter((p) => p.status === 'Active').length} currently active
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Contract Value
            </div>
            <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {formatCurrency(stats.contractValue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Agreed site amounts</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Bills Generated
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.bills.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Bills issued</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Total Billed Value
            </div>
            <div className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
              {formatCurrency(stats.billedValue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Billed to company</div>
          </div>
        </div>

        {/* Quick action buttons for this company */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setActiveTab('projects');
              window.dispatchEvent(
                new CustomEvent('open-add-project-for-company', {
                  detail: { companyName: selectedCompany.name },
                })
              );
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Briefcase className="w-4 h-4" />
            <span>+ Create Project for {selectedCompany.name}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('bills');
              window.dispatchEvent(
                new CustomEvent('open-add-bill-for-company', {
                  detail: { companyName: selectedCompany.name },
                })
              );
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>+ Generate Bill for {selectedCompany.name}</span>
          </button>
        </div>

        {/* Projects Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Projects for {selectedCompany.name} ({stats.projects.length})
              </h3>
            </div>
          </div>

          {stats.projects.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No projects recorded for this company yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigateToProject(p.id)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Site: {p.site} • Started: {formatDate(p.startDate)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {formatCurrency(p.agreedAmount)}
                    </div>
                    <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 justify-end">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bills Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Bills Issued to {selectedCompany.name} ({stats.bills.length})
              </h3>
            </div>
          </div>

          {stats.bills.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No bills generated for this company yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.bills.map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigateToBill(b.id)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition-colors"
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
                      Project: {b.projectName} • Date: {formatDate(b.date)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-sm text-slate-900 dark:text-white">
                      {formatCurrency(b.totalAmount)}
                    </div>
                    <span className="text-[11px] text-teal-600 font-semibold flex items-center gap-1 justify-end">
                      <span>View & Print</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit / Delete Modals */}
        {companyToEdit && (
          <CompanyModal
            companyToEdit={companyToEdit}
            onClose={() => setCompanyToEdit(null)}
            onSave={(updates) => {
              updateCompany(companyToEdit.id, updates);
              setCompanyToEdit(null);
            }}
          />
        )}

        {companyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Remove Company Profile?
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Are you sure you want to delete company <strong>{companyToDelete.name}</strong>?
                Existing projects and bills will remain intact.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setCompanyToDelete(null)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteCompany(companyToDelete.id);
                    setCompanyToDelete(null);
                    setSelectedCompanyId(null);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <Building className="w-6 h-6 text-blue-600" />
              <span>Companies</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Company profiles (LG, Voltas, etc.), site contracts & billed totals
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search companies by name or contact person..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Grid of companies */}
      {filteredCompanies.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
          <Building className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            No companies registered
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Add client companies like LG, Voltas, Daikin to track site contracts and bills.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((c) => {
            const stats = getCompanyStats(c.name);

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCompanyId(c.id)}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {c.name}
                    </h3>
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {stats.projects.length} Site{stats.projects.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs text-slate-500">
                    {c.contactPerson && <div>Person: {c.contactPerson}</div>}
                    {c.phone && <div>Phone: {c.phone}</div>}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Contract Value
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {formatCurrency(stats.contractValue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                        Total Billed
                      </div>
                      <div className="font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
                        {formatCurrency(stats.billedValue)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>View Projects & Bills</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <CompanyModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={(companyData) => {
            addCompany(companyData);
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

// Company Modal Sub-Component
interface CompanyModalProps {
  companyToEdit?: Company | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

const CompanyModal: React.FC<CompanyModalProps> = ({ companyToEdit, onClose, onSave }) => {
  const [name, setName] = useState(companyToEdit?.name || '');
  const [contactPerson, setContactPerson] = useState(companyToEdit?.contactPerson || '');
  const [phone, setPhone] = useState(companyToEdit?.phone || '');
  const [email, setEmail] = useState(companyToEdit?.email || '');
  const [address, setAddress] = useState(companyToEdit?.address || '');
  const [notes, setNotes] = useState(companyToEdit?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Company / client name is required.');
      return;
    }

    onSave({
      name: name.trim(),
      contactPerson: contactPerson.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-lg text-slate-900 dark:text-white">
            {companyToEdit ? 'Edit Company' : 'Add Company'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="text-xs text-rose-600 font-bold">{error}</div>}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              placeholder="e.g. LG, Voltas, Daikin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Contact Person / Project Manager
            </label>
            <input
              type="text"
              placeholder="e.g. Mr. Rajesh Verma"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                placeholder="e.g. 9822100000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="e.g. client@lge.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Address / Office Location
            </label>
            <input
              type="text"
              placeholder="e.g. Pune Regional Office"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Materials provided by client"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              Save Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
