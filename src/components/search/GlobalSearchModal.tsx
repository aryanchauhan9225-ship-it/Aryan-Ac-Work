import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, Briefcase, FileText, Building, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../services/formatters';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    data,
    workerSummaries,
    navigateToWorker,
    navigateToProject,
    navigateToBill,
    navigateToCompany,
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const cleanQ = query.trim().toLowerCase();

  const matchedWorkers = cleanQ
    ? workerSummaries.filter(
        (w) =>
          w.name.toLowerCase().includes(cleanQ) ||
          (w.phone && w.phone.includes(cleanQ)) ||
          (w.role && w.role.toLowerCase().includes(cleanQ))
      )
    : [];

  const matchedProjects = cleanQ
    ? data.projects.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQ) ||
          p.company.toLowerCase().includes(cleanQ) ||
          p.site.toLowerCase().includes(cleanQ) ||
          p.workDescription.toLowerCase().includes(cleanQ)
      )
    : [];

  const matchedBills = cleanQ
    ? data.bills.filter(
        (b) =>
          b.billNumber.toLowerCase().includes(cleanQ) ||
          b.company.toLowerCase().includes(cleanQ) ||
          b.projectName.toLowerCase().includes(cleanQ) ||
          b.site.toLowerCase().includes(cleanQ)
      )
    : [];

  const matchedCompanies = cleanQ
    ? data.companies.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQ) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(cleanQ))
      )
    : [];

  const totalResults =
    matchedWorkers.length + matchedProjects.length + matchedBills.length + matchedCompanies.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search workers, projects (e.g. LG), bills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-base font-medium bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-md border border-slate-200 dark:border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="p-4 overflow-y-auto space-y-5">
          {!cleanQ ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Type a search query</p>
              <p className="text-xs mt-1">
                Try searching for worker names, companies like "LG", site locations, or bill numbers
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
              <p className="text-sm font-medium">No records found for "{query}"</p>
              <p className="text-xs mt-1">Check spelling or try a broader keyword.</p>
            </div>
          ) : (
            <>
              {/* Summary match badges */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Matches:
                </span>
                {matchedProjects.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    Projects → {matchedProjects.length}
                  </span>
                )}
                {matchedWorkers.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    Workers → {matchedWorkers.length}
                  </span>
                )}
                {matchedBills.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                    Bills → {matchedBills.length}
                  </span>
                )}
                {matchedCompanies.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    Clients → {matchedCompanies.length}
                  </span>
                )}
              </div>

              {/* Matched Projects */}
              {matchedProjects.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Projects ({matchedProjects.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigateToProject(p.id);
                        }}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-slate-100 dark:border-slate-800/80 cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {p.name}
                            </span>
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {p.company}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                p.status === 'Active'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Site: {p.site} • {formatDate(p.startDate)}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Workers */}
              {matchedWorkers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    <Users className="w-3.5 h-3.5" />
                    <span>Workers ({matchedWorkers.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedWorkers.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigateToWorker(w.id);
                        }}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-slate-100 dark:border-slate-800/80 cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {w.name}
                            </span>
                            {w.role && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                • {w.role}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Phone: {w.phone || 'N/A'} • Due Balance:{' '}
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {formatCurrency(w.currentBalance)}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Bills */}
              {matchedBills.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Bills & Invoices ({matchedBills.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedBills.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigateToBill(b.id);
                        }}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-slate-100 dark:border-slate-800/80 cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {b.billNumber}
                            </span>
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                              {b.company}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Project: {b.projectName} • Date: {formatDate(b.date)} • Amount:{' '}
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatCurrency(b.totalAmount)}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Companies / Clients */}
              {matchedCompanies.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    <Building className="w-3.5 h-3.5" />
                    <span>Companies & Clients ({matchedCompanies.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedCompanies.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigateToCompany(c.id);
                        }}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-slate-100 dark:border-slate-800/80 cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {c.name}
                            </span>
                            {c.contactPerson && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                • {c.contactPerson}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {c.phone ? `Phone: ${c.phone} • ` : ''}Client profile
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
