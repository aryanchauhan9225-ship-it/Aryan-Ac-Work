import React from 'react';
import {
  Home,
  Briefcase,
  Users,
  FileText,
  Menu,
} from 'lucide-react';
import { useApp, NavTab } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setSelectedWorkerId,
    setSelectedProjectId,
    setSelectedBillId,
    setMoreSubView,
    totalWorkerDues,
    data,
  } = useApp();

  const handleTabClick = (tab: NavTab) => {
    // Reset any open sub-views when tapping navigation tabs
    if (tab === 'workers') setSelectedWorkerId(null);
    if (tab === 'projects') setSelectedProjectId(null);
    if (tab === 'bills') setSelectedBillId(null);
    if (tab === 'more') setMoreSubView('menu');
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems: { tab: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number }[] = [
    { tab: 'home', label: 'Home', icon: Home },
    {
      tab: 'projects',
      label: 'Projects',
      icon: Briefcase,
      badge: data.projects.filter((p) => p.status === 'Active').length || undefined,
    },
    {
      tab: 'workers',
      label: 'Workers',
      icon: Users,
      badge: totalWorkerDues > 0 ? 'Dues' : undefined,
    },
    { tab: 'bills', label: 'Bills', icon: FileText, badge: data.bills.length || undefined },
    { tab: 'more', label: 'More', icon: Menu },
  ];

  return (
    <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] shadow-lg shadow-black/5">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;

          return (
            <button
              key={item.tab}
              onClick={() => handleTabClick(item.tab)}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                />
                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full text-white ${
                      item.badge === 'Dues'
                        ? 'bg-rose-500'
                        : 'bg-blue-600 dark:bg-blue-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] leading-tight tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-5 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
