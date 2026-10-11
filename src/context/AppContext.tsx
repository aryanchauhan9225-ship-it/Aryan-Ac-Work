import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  AppData,
  Worker,
  Project,
  Company,
  LedgerEntry,
  Bill,
  BusinessSettings,
  WorkerSummary,
  ActivityLog,
} from '../types';
import {
  loadAppData,
  saveAppData,
  getAllWorkerSummaries,
  createActivityLog,
  getSampleData,
  DEFAULT_SETTINGS,
} from '../services/storage';

export type NavTab = 'home' | 'projects' | 'workers' | 'bills' | 'more';
export type MoreSubView = 'menu' | 'companies' | 'reports' | 'excel' | 'backup' | 'settings';

interface AppContextType {
  data: AppData;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  moreSubView: MoreSubView;
  setMoreSubView: (view: MoreSubView) => void;
  selectedWorkerId: string | null;
  setSelectedWorkerId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedBillId: string | null;
  setSelectedBillId: (id: string | null) => void;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isFastAddOpen: boolean;
  setIsFastAddOpen: (open: boolean) => void;
  isAddWorkerModalOpen: boolean;
  setIsAddWorkerModalOpen: (open: boolean) => void;
  openAddWorkerModal: () => void;
  isAddProjectModalOpen: boolean;
  setIsAddProjectModalOpen: (open: boolean) => void;
  openAddProjectModal: () => void;
  isAddBillModalOpen: boolean;
  setIsAddBillModalOpen: (open: boolean) => void;
  openAddBillModal: (forProject?: Project) => void;
  preselectedBillProject: Project | null;
  setPreselectedBillProject: (project: Project | null) => void;
  quickEntryModal: {
    isOpen: boolean;
    defaultType?: 'earning' | 'advance' | 'payment' | 'adjustment';
    preselectedWorkerId?: string;
    preselectedProjectId?: string;
  };
  openQuickEntry: (
    defaultType?: 'earning' | 'advance' | 'payment' | 'adjustment',
    workerId?: string,
    projectId?: string
  ) => void;
  closeQuickEntry: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  // Computed helpers
  workerSummaries: WorkerSummary[];
  totalWorkerDues: number;
  totalEarningsAll: number;
  totalAdvancesAll: number;
  totalPaymentsAll: number;
  activeProjectsCount: number;
  activeWorkersCount: number;
  toast: { id: number; message: string; type?: 'success' | 'info' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  // Actions
  addWorker: (workerData: Omit<Worker, 'id' | 'createdAt'>) => string;
  updateWorker: (id: string, updates: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;
  addLedgerEntry: (entryData: Omit<LedgerEntry, 'id' | 'createdAt'>) => string;
  updateLedgerEntry: (id: string, updates: Partial<LedgerEntry>) => void;
  deleteLedgerEntry: (id: string) => void;
  addProject: (projectData: Omit<Project, 'id' | 'createdAt'>) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  archiveProject: (id: string) => void;
  deleteProject: (id: string) => void;
  addCompany: (companyData: Omit<Company, 'id' | 'createdAt'>) => string;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addBill: (billData: Omit<Bill, 'id' | 'createdAt'>) => string;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  updateSettings: (settingsUpdates: Partial<BusinessSettings>) => void;
  loadDemoData: () => void;
  clearDemoData: () => void;
  resetAllData: () => void;
  restoreFromBackup: (backupData: AppData) => void;
  navigateToWorker: (workerId: string) => void;
  navigateToProject: (projectId: string) => void;
  navigateToBill: (billId: string) => void;
  navigateToCompany: (companyId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [moreSubView, setMoreSubView] = useState<MoreSubView>('menu');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFastAddOpen, setIsFastAddOpen] = useState(false);
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [preselectedBillProject, setPreselectedBillProject] = useState<Project | null>(null);

  // Success Feedback Toast System
  const [toast, setToast] = useState<{ id: number; message: string; type?: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.id === id ? null : cur));
    }, 2800);
  };

  const openAddWorkerModal = () => {
    setSelectedWorkerId(null);
    setActiveTab('workers');
    setIsAddWorkerModalOpen(true);
  };

  const openAddProjectModal = () => {
    setSelectedProjectId(null);
    setActiveTab('projects');
    setIsAddProjectModalOpen(true);
  };

  const openAddBillModal = (forProject?: Project) => {
    setSelectedBillId(null);
    setPreselectedBillProject(forProject || null);
    setActiveTab('bills');
    setIsAddBillModalOpen(true);
  };

  const [quickEntryModal, setQuickEntryModal] = useState<{
    isOpen: boolean;
    defaultType?: 'earning' | 'advance' | 'payment' | 'adjustment';
    preselectedWorkerId?: string;
    preselectedProjectId?: string;
  }>({ isOpen: false });

  // Dark mode state synced with HTML element class
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      data.settings.theme === 'dark' ||
      (data.settings.theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: next ? 'dark' : 'light',
      },
    }));
  };

  const openQuickEntry = (
    defaultType?: 'earning' | 'advance' | 'payment' | 'adjustment',
    workerId?: string,
    projectId?: string
  ) => {
    // Smart default fallback to last used
    const chosenWorkerId = workerId || data.settings.lastUsedWorkerId || (data.workers[0]?.id || '');
    const chosenProjectId = projectId || data.settings.lastUsedProjectId || (data.projects[0]?.id || '');

    setQuickEntryModal({
      isOpen: true,
      defaultType,
      preselectedWorkerId: chosenWorkerId,
      preselectedProjectId: chosenProjectId,
    });
  };

  const closeQuickEntry = () => {
    setQuickEntryModal({ isOpen: false });
  };

  // Computations
  const workerSummaries = useMemo(() => {
    return getAllWorkerSummaries(data.workers, data.ledger, data.projects);
  }, [data.workers, data.ledger, data.projects]);

  const totalWorkerDues = useMemo(() => {
    return workerSummaries.reduce((sum, w) => sum + Math.max(0, w.currentBalance), 0);
  }, [workerSummaries]);

  const { totalEarningsAll, totalAdvancesAll, totalPaymentsAll } = useMemo(() => {
    let earn = 0;
    let adv = 0;
    let pay = 0;
    for (const item of data.ledger) {
      if (item.type === 'earning') earn += Number(item.amount) || 0;
      else if (item.type === 'advance') adv += Number(item.amount) || 0;
      else if (item.type === 'payment') pay += Number(item.amount) || 0;
    }
    return {
      totalEarningsAll: earn,
      totalAdvancesAll: adv,
      totalPaymentsAll: pay,
    };
  }, [data.ledger]);

  const activeProjectsCount = useMemo(() => {
    return data.projects.filter((p) => p.status === 'Active').length;
  }, [data.projects]);

  const activeWorkersCount = useMemo(() => {
    return data.workers.filter((w) => w.active).length;
  }, [data.workers]);

  // Actions
  const addWorker = (workerData: Omit<Worker, 'id' | 'createdAt'>): string => {
    const id = 'w_' + Date.now();
    const newWorker: Worker = {
      ...workerData,
      id,
      createdAt: new Date().toISOString(),
    };
    const log = createActivityLog(
      'worker_added',
      `Worker Added: ${newWorker.name}`,
      `Role: ${newWorker.role || 'AC Technician'} | Phone: ${newWorker.phone || 'N/A'}`,
      id,
      'worker'
    );
    setData((prev) => ({
      ...prev,
      workers: [newWorker, ...prev.workers],
      settings: {
        ...prev.settings,
        lastUsedWorkerId: id,
      },
      activityLogs: [log, ...prev.activityLogs].slice(0, 100),
    }));
    showToast('Worker added successfully.');
    return id;
  };

  const updateWorker = (id: string, updates: Partial<Worker>) => {
    setData((prev) => {
      const updatedWorkers = prev.workers.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      );
      const worker = updatedWorkers.find((w) => w.id === id);
      const log = createActivityLog(
        'worker_updated',
        `Worker Updated: ${worker?.name || id}`,
        `Profile details modified`,
        id,
        'worker'
      );
      return {
        ...prev,
        workers: updatedWorkers,
        activityLogs: [log, ...prev.activityLogs].slice(0, 100),
      };
    });
    showToast('Worker profile updated.');
  };

  const deleteWorker = (id: string) => {
    setData((prev) => {
      const worker = prev.workers.find((w) => w.id === id);
      const updatedWorkers = prev.workers.filter((w) => w.id !== id);
      const updatedProjects = prev.projects.map((p) => ({
        ...p,
        assignedWorkerIds: (p.assignedWorkerIds || []).filter((wId) => wId !== id),
      }));
      return {
        ...prev,
        workers: updatedWorkers,
        projects: updatedProjects,
        activityLogs: [
          createActivityLog(
            'worker_deleted',
            `Worker Removed: ${worker?.name || id}`,
            `Profile removed from active records`,
            id,
            'worker'
          ),
          ...prev.activityLogs,
        ].slice(0, 100),
      };
    });
    if (selectedWorkerId === id) {
      setSelectedWorkerId(null);
    }
    showToast('Worker removed.');
  };

  const addLedgerEntry = (entryData: Omit<LedgerEntry, 'id' | 'createdAt'>): string => {
    const id = 'led_' + Date.now();
    const newEntry: LedgerEntry = {
      ...entryData,
      id,
      createdAt: new Date().toISOString(),
    };

    const worker = data.workers.find((w) => w.id === entryData.workerId);
    let actionType: ActivityLog['action'] = 'earning_added';
    let titlePrefix = 'Work Earning Added';

    if (entryData.type === 'advance') {
      actionType = 'advance_added';
      titlePrefix = 'Advance Given';
    } else if (entryData.type === 'payment') {
      actionType = 'payment_recorded';
      titlePrefix = 'Payment Recorded';
    } else if (entryData.type === 'adjustment') {
      actionType = 'adjustment_added';
      titlePrefix = 'Adjustment Recorded';
    }

    const log = createActivityLog(
      actionType,
      `${titlePrefix}: ₹${Number(entryData.amount).toLocaleString('en-IN')}`,
      `Worker: ${worker?.name || 'Worker'} | Note: ${entryData.note || 'None'}`,
      entryData.workerId,
      'worker'
    );

    setData((prev) => ({
      ...prev,
      ledger: [newEntry, ...prev.ledger],
      settings: {
        ...prev.settings,
        lastUsedWorkerId: entryData.workerId,
        lastUsedProjectId: entryData.projectId || prev.settings.lastUsedProjectId,
      },
      activityLogs: [log, ...prev.activityLogs].slice(0, 100),
    }));

    if (entryData.type === 'payment') {
      showToast('Payment recorded successfully.');
    } else if (entryData.type === 'advance') {
      showToast('Advance recorded successfully.');
    } else if (entryData.type === 'earning') {
      showToast('Work earning recorded successfully.');
    } else {
      showToast('Adjustment recorded successfully.');
    }

    return id;
  };

  const updateLedgerEntry = (id: string, updates: Partial<LedgerEntry>) => {
    setData((prev) => ({
      ...prev,
      ledger: prev.ledger.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  };

  const deleteLedgerEntry = (id: string) => {
    const entry = data.ledger.find((l) => l.id === id);
    const worker = data.workers.find((w) => w.id === entry?.workerId);
    const log = createActivityLog(
      'entry_deleted',
      `Transaction Deleted: ₹${entry?.amount ? Number(entry.amount).toLocaleString('en-IN') : 0}`,
      `Type: ${entry?.type || 'entry'} | Worker: ${worker?.name || 'Worker'}`,
      entry?.workerId,
      'worker'
    );

    setData((prev) => ({
      ...prev,
      ledger: prev.ledger.filter((l) => l.id !== id),
      activityLogs: [log, ...prev.activityLogs].slice(0, 100),
    }));
  };

  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>): string => {
    const id = 'p_' + Date.now();
    const newProject: Project = {
      ...projectData,
      id,
      createdAt: new Date().toISOString(),
    };

    // Also ensure company is registered in companies list
    let updatedCompanies = [...data.companies];
    const compName = projectData.company.trim();
    if (compName && !updatedCompanies.some((c) => c.name.toLowerCase() === compName.toLowerCase())) {
      updatedCompanies.push({
        id: 'c_' + Date.now(),
        name: compName,
        createdAt: new Date().toISOString(),
      });
    }

    const log = createActivityLog(
      'project_created',
      `Project Created: ${newProject.name}`,
      `Client: ${newProject.company} | Site: ${newProject.site}`,
      id,
      'project'
    );

    setData((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
      companies: updatedCompanies,
      settings: {
        ...prev.settings,
        lastUsedProjectId: id,
        lastUsedCompany: projectData.company,
      },
      activityLogs: [log, ...prev.activityLogs].slice(0, 100),
    }));

    showToast('Project created successfully.');
    return id;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setData((prev) => {
      const updatedProjects = prev.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      const proj = updatedProjects.find((p) => p.id === id);
      const log = createActivityLog(
        'project_updated',
        `Project Updated: ${proj?.name || id}`,
        `Status: ${proj?.status}`,
        id,
        'project'
      );
      return {
        ...prev,
        projects: updatedProjects,
        activityLogs: [log, ...prev.activityLogs].slice(0, 100),
      };
    });
    if (updates.status === 'Completed') {
      showToast('Project marked as Completed.');
    } else {
      showToast('Project updated successfully.');
    }
  };

  const archiveProject = (id: string) => {
    updateProject(id, { status: 'Archived' });
  };

  const deleteProject = (id: string) => {
    const proj = data.projects.find((p) => p.id === id);
    const log = createActivityLog(
      'project_deleted',
      `Project Removed: ${proj?.name || id}`,
      `Client: ${proj?.company || 'Client'}`,
      id,
      'project'
    );
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
      activityLogs: [log, ...prev.activityLogs].slice(0, 100),
    }));
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
  };

  // Company Actions
  const addCompany = (companyData: Omit<Company, 'id' | 'createdAt'>): string => {
    const id = 'c_' + Date.now();
    const newCompany: Company = {
      ...companyData,
      id,
      createdAt: new Date().toISOString(),
    };
    const log = createActivityLog(
      'company_added',
      `Client Added: ${newCompany.name}`,
      newCompany.contactPerson ? `Contact: ${newCompany.contactPerson}` : 'New client profile',
      id,
      'company'
    );
    setData((prev) => ({
      ...prev,
      companies: [newCompany, ...prev.companies],
      activityLogs: [log, ...prev.activityLogs].slice(0, 100),
    }));
    return id;
  };

  const updateCompany = (id: string, updates: Partial<Company>) => {
    setData((prev) => {
      const updated = prev.companies.map((c) => (c.id === id ? { ...c, ...updates } : c));
      const comp = updated.find((c) => c.id === id);
      const log = createActivityLog(
        'company_updated',
        `Client Updated: ${comp?.name || id}`,
        'Company record updated',
        id,
        'company'
      );
      return {
        ...prev,
        companies: updated,
        activityLogs: [log, ...prev.activityLogs].slice(0, 100),
      };
    });
  };

  const deleteCompany = (id: string) => {
    const comp = data.companies.find((c) => c.id === id);
    const log = createActivityLog(
      'company_deleted',
      `Client Deleted: ${comp?.name || id}`,
      'Company profile removed',
      id,
      'company'
    );
    setData((prev) => ({
      ...prev,
      companies: prev.companies.filter((c) => c.id !== id),
      activityLogs: [log, ...prev.activityLogs].slice(0, 100),
    }));
    if (selectedCompanyId === id) {
      setSelectedCompanyId(null);
    }
  };

  // Bill Actions
  const addBill = (billData: Omit<Bill, 'id' | 'createdAt'>): string => {
    const id = 'b_' + Date.now();
    const newBill: Bill = {
      ...billData,
      id,
      createdAt: new Date().toISOString(),
    };

    const log = createActivityLog(
      'bill_generated',
      `Bill Generated: ${newBill.billNumber}`,
      `Client: ${newBill.company} | Total: ₹${Number(newBill.totalAmount).toLocaleString('en-IN')}`,
      id,
      'bill'
    );

    setData((prev) => {
      const hist = new Set(prev.historicalBillNumbers || []);
      hist.add(newBill.billNumber);

      let updatedCompanies = [...prev.companies];
      const compName = newBill.company.trim();
      if (compName && !updatedCompanies.some((c) => c.name.toLowerCase() === compName.toLowerCase())) {
        updatedCompanies.push({
          id: 'c_' + Date.now(),
          name: compName,
          createdAt: new Date().toISOString(),
        });
      }

      return {
        ...prev,
        bills: [newBill, ...prev.bills],
        companies: updatedCompanies,
        historicalBillNumbers: Array.from(hist),
        settings: {
          ...prev.settings,
          lastUsedCompany: newBill.company,
          lastUsedProjectId: newBill.projectId || prev.settings.lastUsedProjectId,
        },
        activityLogs: [log, ...prev.activityLogs].slice(0, 100),
      };
    });

    showToast('Bill generated successfully.');
    return id;
  };

  const updateBill = (id: string, updates: Partial<Bill>) => {
    setData((prev) => {
      const updatedBills = prev.bills.map((b) => (b.id === id ? { ...b, ...updates } : b));
      const hist = new Set(prev.historicalBillNumbers || []);
      if (updates.billNumber) hist.add(updates.billNumber);

      return {
        ...prev,
        bills: updatedBills,
        historicalBillNumbers: Array.from(hist),
      };
    });
    showToast('Bill updated successfully.');
  };

  const deleteBill = (id: string) => {
    const bill = data.bills.find((b) => b.id === id);
    const log = createActivityLog(
      'bill_deleted',
      `Bill Deleted: ${bill?.billNumber || id}`,
      `Client: ${bill?.company || 'Client'} | Total: ₹${Number(bill?.totalAmount || 0).toLocaleString('en-IN')}`,
      id,
      'bill'
    );

    setData((prev) => {
      // Historical bill number is intentionally retained so it is NEVER reused!
      const hist = new Set(prev.historicalBillNumbers || []);
      if (bill?.billNumber) hist.add(bill.billNumber);

      return {
        ...prev,
        bills: prev.bills.filter((b) => b.id !== id),
        historicalBillNumbers: Array.from(hist),
        activityLogs: [log, ...prev.activityLogs].slice(0, 100),
      };
    });

    if (selectedBillId === id) {
      setSelectedBillId(null);
    }
  };

  const updateSettings = (settingsUpdates: Partial<BusinessSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settingsUpdates },
    }));
  };

  const loadDemoData = () => {
    const sample = getSampleData();
    setData(sample);
  };

  const clearDemoData = () => {
    // Clear demo workers w_1 to w_4, p_1, p_2, b_1, c_1, c_2
    setData((prev) => ({
      ...prev,
      workers: prev.workers.filter((w) => !w.id.startsWith('w_')),
      projects: prev.projects.filter((p) => !p.id.startsWith('p_')),
      companies: prev.companies.filter((c) => !c.id.startsWith('c_')),
      ledger: prev.ledger.filter((l) => !l.id.startsWith('led_')),
      bills: prev.bills.filter((b) => !b.id.startsWith('b_')),
    }));
  };

  const resetAllData = () => {
    const fresh: AppData = {
      version: '1.1.0',
      settings: DEFAULT_SETTINGS,
      workers: [],
      projects: [],
      companies: [],
      ledger: [],
      bills: [],
      activityLogs: [],
      historicalBillNumbers: [],
    };
    setData(fresh);
    setSelectedWorkerId(null);
    setSelectedProjectId(null);
    setSelectedBillId(null);
    setSelectedCompanyId(null);
  };

  const restoreFromBackup = (backupData: AppData) => {
    const log = createActivityLog(
      'backup_restored',
      'Backup Restored Successfully',
      `Restored ${backupData.workers.length} workers, ${backupData.projects.length} projects, ${backupData.bills.length} bills`
    );
    setData({
      ...backupData,
      activityLogs: [log, ...(backupData.activityLogs || [])].slice(0, 100),
    });
    setSelectedWorkerId(null);
    setSelectedProjectId(null);
    setSelectedBillId(null);
    setSelectedCompanyId(null);
    showToast('Backup restored successfully.');
  };

  const navigateToWorker = (workerId: string) => {
    setSelectedWorkerId(workerId);
    setActiveTab('workers');
  };

  const navigateToProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('projects');
  };

  const navigateToBill = (billId: string) => {
    setSelectedBillId(billId);
    setActiveTab('bills');
  };

  const navigateToCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setMoreSubView('companies');
    setActiveTab('more');
  };

  return (
    <AppContext.Provider
      value={{
        data,
        activeTab,
        setActiveTab,
        moreSubView,
        setMoreSubView,
        selectedWorkerId,
        setSelectedWorkerId,
        selectedProjectId,
        setSelectedProjectId,
        selectedBillId,
        setSelectedBillId,
        selectedCompanyId,
        setSelectedCompanyId,
        isSearchOpen,
        setIsSearchOpen,
        isFastAddOpen,
        setIsFastAddOpen,
        isAddWorkerModalOpen,
        setIsAddWorkerModalOpen,
        openAddWorkerModal,
        isAddProjectModalOpen,
        setIsAddProjectModalOpen,
        openAddProjectModal,
        isAddBillModalOpen,
        setIsAddBillModalOpen,
        openAddBillModal,
        preselectedBillProject,
        setPreselectedBillProject,
        quickEntryModal,
        openQuickEntry,
        closeQuickEntry,
        darkMode,
        toggleDarkMode,
        workerSummaries,
        totalWorkerDues,
        totalEarningsAll,
        totalAdvancesAll,
        totalPaymentsAll,
        activeProjectsCount,
        activeWorkersCount,
        toast,
        showToast,
        addWorker,
        updateWorker,
        deleteWorker,
        addLedgerEntry,
        updateLedgerEntry,
        deleteLedgerEntry,
        addProject,
        updateProject,
        archiveProject,
        deleteProject,
        addCompany,
        updateCompany,
        deleteCompany,
        addBill,
        updateBill,
        deleteBill,
        updateSettings,
        loadDemoData,
        clearDemoData,
        resetAllData,
        restoreFromBackup,
        navigateToWorker,
        navigateToProject,
        navigateToBill,
        navigateToCompany,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
