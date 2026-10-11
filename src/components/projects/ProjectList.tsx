import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  FolderPlus,
  Search,
  Building,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Filter,
  DollarSign,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus } from '../../types';
import { formatCurrency, formatDate } from '../../services/formatters';
import { ProjectModal } from './ProjectModal';
import { ProjectDetail } from './ProjectDetail';

export const ProjectList: React.FC = () => {
  const {
    data,
    selectedProjectId,
    setSelectedProjectId,
    isAddProjectModalOpen,
    setIsAddProjectModalOpen,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ProjectStatus>('All');
  const [companyFilter, setCompanyFilter] = useState<string>('All');
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // If a specific project is selected, render detailed view
  if (selectedProjectId) {
    return (
      <ProjectDetail
        projectId={selectedProjectId}
        onBack={() => setSelectedProjectId(null)}
        onEdit={() => {
          const p = data.projects.find((proj) => proj.id === selectedProjectId);
          if (p) setProjectToEdit(p);
        }}
      />
    );
  }

  // Extract unique companies for filtering
  const companies = Array.from(new Set(data.projects.map((p) => p.company))).filter(Boolean);

  // Filtered projects
  const filtered = data.projects
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase()) ||
        p.site.toLowerCase().includes(search.toLowerCase()) ||
        (p.workDescription && p.workDescription.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (companyFilter !== 'All' && p.company !== companyFilter) return false;
      return true;
    })
    .sort((a, b) => {
      // Prioritize Active projects first, followed by On Hold, Completed, Archived
      const order: Record<ProjectStatus, number> = {
        Active: 1,
        'On Hold': 2,
        Completed: 3,
        Archived: 4,
      };
      const diff = (order[a.status] || 99) - (order[b.status] || 99);
      if (diff !== 0) return diff;
      return (
        new Date(b.createdAt || b.startDate || 0).getTime() -
        new Date(a.createdAt || a.startDate || 0).getTime()
      );
    });

  const workerMap = new Map(data.workers.map((w) => [w.id, w.name]));

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Site Projects & Contracts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage commercial and client contracts (LG, Voltas, etc.), assigned crew & billings
          </p>
        </div>

        <button
          onClick={() => setIsAddProjectModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name, company (e.g. LG), site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Status buttons */}
          {(['All', 'Active', 'Completed', 'On Hold', 'Archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}

          {/* Company filter */}
          {companies.length > 1 && (
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              <option value="All">All Clients</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
          <Briefcase className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            No projects found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {search ? 'Try adjusting your search criteria' : 'Create your first AC site contract project.'}
          </p>
          <button
            onClick={() => setIsAddProjectModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const assignedCount = p.assignedWorkerIds?.length || 0;
            const assignedNames = (p.assignedWorkerIds || [])
              .map((id) => workerMap.get(id))
              .filter(Boolean);

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
                onClick={() => setSelectedProjectId(p.id)}
              >
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                      {p.company}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'Active'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : p.status === 'Completed'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {p.name}
                  </h3>

                  <div className="mt-2 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.site}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Started: {formatDate(p.startDate)}</span>
                    </div>
                  </div>

                  {p.workDescription && (
                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                      {p.workDescription}
                    </p>
                  )}

                  {/* Assigned crew preview */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{assignedCount} Worker{assignedCount === 1 ? '' : 's'}</span>
                    </span>
                    {p.agreedAmount ? (
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(p.agreedAmount)}
                      </span>
                    ) : null}
                  </div>
                  {assignedNames.length > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {assignedNames.join(', ')}
                    </p>
                  )}
                </div>

                {/* Footer action */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>View Project Details</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={isAddProjectModalOpen || projectToEdit !== null}
        onClose={() => {
          setIsAddProjectModalOpen(false);
          setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
      />
    </div>
  );
};
