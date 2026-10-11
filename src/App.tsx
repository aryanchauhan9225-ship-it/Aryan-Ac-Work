/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { WorkerList } from './components/workers/WorkerList';
import { ProjectList } from './components/projects/ProjectList';
import { BillList } from './components/bills/BillList';
import { MoreHub } from './components/more/MoreHub';
import { QuickEntryModal } from './components/common/QuickEntryModal';
import { FastAddModal } from './components/common/FastAddModal';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { Toast } from './components/common/Toast';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <Header />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'home' && <Dashboard />}
          {activeTab === 'projects' && <ProjectList />}
          {activeTab === 'workers' && <WorkerList />}
          {activeTab === 'bills' && <BillList />}
          {activeTab === 'more' && <MoreHub />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <Navbar />

      {/* Global Modals */}
      <FastAddModal />
      <QuickEntryModal />
      <GlobalSearchModal />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
