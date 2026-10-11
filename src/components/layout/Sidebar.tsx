import React from 'react';
import {
  Home,
  Briefcase,
  Users,
  FileText,
  Building,
  BarChart3,
  FileSpreadsheet,
  Database,
  Settings,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { useApp, NavTab, MoreSubView } from '../../context/AppContext';
import { formatCurrency } from '../../services/formatters';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    moreSubView,
    setMoreSubView,
    setSelectedWorkerId,
    setSelectedProjectId,
    setSelectedBillId,
    setSelectedCompanyId,
    totalWorkerDues,
    data,
  } = useApp();

  const handleNav = (tab: NavTab, subView: MoreSubView = 'menu') => {
    if (tab === 'workers') setSelectedWorkerId(null);
    if (tab === 'projects') setSelectedProjectId(null);
    if (tab === 'bills') setSelectedBillId(null);
    if (subView !== 'companies') setSelectedCompanyId(null);
    setActiveTab(tab);
    setMoreSubView(subView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const primaryItems = [
    {
      tab: 'home' as NavTab,
      label: 'Dashboard',
      icon: Home,
      isActive: activeTab === 'home',
    },
    {
      tab: 'projects' as NavTab,
      label: 'Projects',
      icon: Briefcase,
      badge: data.projects.filter((p) => p.status === 'Active').length,
      isActive: activeTab === 'projects',
    },
    {
      tab: 'workers' as NavTab,
      label: 'Workers & Hisaab',
      icon: Users,
      badge: data.workers.length,
      isActive: activeTab === 'workers',
    },
    {
      tab: 'bills' as NavTab,
      label: 'Bills',
      icon: FileText,
      badge: data.bills.length,
      isActive: activeTab === 'bills',
    },
  ];

  const moreItems = [
    {
      label: 'Companies',
      icon: Building,
      subView: 'companies' as MoreSubView,
      badge: data.companies.length,
      isActive: activeTab === 'more' && moreSubView === 'companies',
    },
    {
      label: 'Reports',
      icon: BarChart3,
      subView: 'reports' as MoreSubView,
      isActive: activeTab === 'more' && moreSubView === 'reports',
    },
    {
      label: 'Excel Register Export',
      icon: FileSpreadsheet,
      subView: 'excel' as MoreSubView,
      isActive: activeTab === 'more' && moreSubView === 'excel',
    },
    {
      label: 'Backup & Restore',
      icon: Database,
      subView: 'backup' as MoreSubView,
      isActive: activeTab === 'more' && moreSubView === 'backup',
    },
    {
      label: 'Business Settings',
      icon: Settings,
      subView: 'settings' as MoreSubView,
      isActive: activeTab === 'more' && moreSubView === 'settings',
    },
  ];

  return (
    <aside className="no-print hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-[calc(100vh-4rem)] sticky top-16 select-none p-4 justify-between transition-colors">
      <div className="space-y-5">
        {/* Brand Area */}
        <div className="p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white p-1 border border-slate-200/80 dark:border-slate-700 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src="/assets/images/aryan-ac-work-logo.svg"
              alt="ARYAN AC WORK"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 dark:text-white truncate">
              ARYAN AC WORK
            </div>
            <div className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 truncate">
              Cooling &amp; Comfort
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Operations
          </div>
          {primaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.tab}
                onClick={() => handleNav(item.tab)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  item.isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      item.isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      item.isActive
                        ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* More Tools */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Management & Tools
          </div>
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleNav('more', item.subView)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  item.isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      item.isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Dues Widget on Sidebar */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Worker Outstanding</span>
          <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
        </div>
        <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
          {formatCurrency(totalWorkerDues)}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Across {data.workers.filter((w) => w.active).length} active workers
        </div>
      </div>
    </aside>
  );
};
