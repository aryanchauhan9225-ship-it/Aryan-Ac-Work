import React from 'react';
import {
  Building,
  BarChart3,
  FileSpreadsheet,
  Database,
  Settings as SettingsIcon,
  ChevronRight,
  Wrench,
  ShieldCheck,
  User,
  Phone,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CompanyManagement } from '../company/CompanyManagement';
import { ReportsView } from '../reports/ReportsView';
import { ExcelExportView } from '../excel/ExcelExportView';
import { BackupRestoreView } from '../backup/BackupRestoreView';
import { SettingsView } from '../settings/SettingsView';

export const MoreHub: React.FC = () => {
  const { moreSubView, setMoreSubView, data } = useApp();

  if (moreSubView === 'companies') {
    return <CompanyManagement onBack={() => setMoreSubView('menu')} />;
  }

  if (moreSubView === 'reports') {
    return (
      <ReportsView
        onBack={() => setMoreSubView('menu')}
        onOpenExcel={() => setMoreSubView('excel')}
      />
    );
  }

  if (moreSubView === 'excel') {
    return <ExcelExportView onBack={() => setMoreSubView('menu')} />;
  }

  if (moreSubView === 'backup') {
    return <BackupRestoreView onBack={() => setMoreSubView('menu')} />;
  }

  if (moreSubView === 'settings') {
    return <SettingsView onBack={() => setMoreSubView('menu')} />;
  }

  const menuItems = [
    {
      id: 'companies' as const,
      title: 'Companies',
      description: 'Company profiles (LG, Voltas, etc.), site contracts & billed values',
      icon: Building,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60',
    },
    {
      id: 'reports' as const,
      title: 'Reports',
      description: 'Worker statements, site summaries, company breakdowns & monthly hisaab',
      icon: BarChart3,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60',
    },
    {
      id: 'excel' as const,
      title: 'Automatic Excel Register (.xlsx)',
      description: 'Download multi-sheet workbook (Summary, Workers, Ledger, Projects, Bills, Companies)',
      icon: FileSpreadsheet,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      id: 'backup' as const,
      title: 'Backup & Restore',
      description: 'Export all records to a safe file, or restore on another device',
      icon: Database,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60',
    },
    {
      id: 'settings' as const,
      title: 'Business Settings',
      description: 'Business name, owner contact, address, dark mode & GST settings',
      icon: SettingsIcon,
      color: 'text-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-300',
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
      {/* Business Header Card */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-3xl p-6 shadow-md shadow-blue-800/15">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              {data.settings.businessName || 'ARYAN AC WORK'}
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              {data.settings.tagline || 'AC Contracting, Installation & Service Specialist'}
            </p>
          </div>
        </div>

        {(data.settings.ownerName || data.settings.phonePrimary || data.settings.city) && (
          <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-100">
            {data.settings.ownerName && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-300" />
                <span>Proprietor: {data.settings.ownerName}</span>
              </div>
            )}
            {data.settings.phonePrimary && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-300" />
                <span>Contact: {data.settings.phonePrimary}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Menu Grid */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Management & Utilities
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setMoreSubView(item.id)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all text-left flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0 mt-2 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Security reassurance */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-500">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>
          Private Contractor Business System • Version 1.0.0 • Local Storage Persistence Active
        </span>
      </div>
    </div>
  );
};
