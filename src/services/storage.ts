import {
  AppData,
  BusinessSettings,
  Worker,
  Project,
  Company,
  LedgerEntry,
  Bill,
  ActivityLog,
  WorkerSummary,
} from '../types';

const STORAGE_KEY = 'aryan_ac_work_v1_store';

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'ARYAN AC WORK',
  tagline: 'AC Contracting, Installation & Contract Works',
  ownerName: '',
  assistantName: '',
  phonePrimary: '',
  phoneSecondary: '',
  address: '',
  city: '',
  email: '',
  gstNumber: '',
  enableGstBilling: false,
  theme: 'light',
};

export const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'c_1',
    name: 'LG',
    contactPerson: 'Mr. Rajesh Verma (LG Regional)',
    phone: '9822100010',
    email: 'hvac.projects@lge.com',
    address: 'LG Electronics India, Regional Center',
    notes: 'Materials and ducted indoor units provided directly by LG.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c_2',
    name: 'Voltas',
    contactPerson: 'Mr. Arvind Joshi (Service Hub)',
    phone: '9822100020',
    email: 'contractor.support@voltas.com',
    address: 'FC Road Commercial Service Hub, Pune',
    notes: 'Prompt payment upon commissioning certificate handover.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c_3',
    name: 'Daikin',
    contactPerson: 'Daikin Project Coordinator',
    phone: '9822100030',
    email: 'daikin.contracts@daikin.co.in',
    address: 'Viman Nagar Logistics Hub, Pune',
    notes: 'VRV / VRF multi-split installation projects.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c_4',
    name: 'Blue Star',
    contactPerson: 'Blue Star Site Engineer',
    phone: '9822100040',
    email: 'service.bluestar@bluestarindia.com',
    address: 'Chinchwad Commercial Complex',
    notes: 'Commercial ductable & cassette contracts.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c_5',
    name: 'Hitachi',
    contactPerson: 'Hitachi HVAC Support',
    phone: '9822100050',
    notes: 'Commercial & premium retail installations.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c_6',
    name: 'Carrier',
    contactPerson: 'Carrier Client Support',
    phone: '9822100060',
    notes: 'HVAC system contracts.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c_7',
    name: 'Direct Clients / Walk-in',
    contactPerson: 'Direct Site Owners',
    phone: '',
    notes: 'Independent site owners and direct contracting work.',
    createdAt: new Date().toISOString(),
  },
];

const getInitialData = (): AppData => ({
  version: '1.1.0',
  settings: DEFAULT_SETTINGS,
  workers: [],
  projects: [],
  companies: DEFAULT_COMPANIES,
  ledger: [],
  bills: [],
  activityLogs: [],
  historicalBillNumbers: [],
});

export const loadAppData = (): AppData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const sample = getSampleData();
      saveAppData(sample);
      return sample;
    }
    const parsed = JSON.parse(raw) as AppData;

    const workers = Array.isArray(parsed.workers) ? parsed.workers : [];
    const projects = Array.isArray(parsed.projects) ? parsed.projects : [];
    const ledger = Array.isArray(parsed.ledger) ? parsed.ledger : [];
    const bills = Array.isArray(parsed.bills) ? parsed.bills : [];
    let companies = Array.isArray(parsed.companies) && parsed.companies.length > 0
      ? parsed.companies
      : DEFAULT_COMPANIES;

    // Ensure common companies exist even if user loaded older data
    const existingNames = new Set(companies.map((c) => c.name.toLowerCase()));
    const missingCommon = DEFAULT_COMPANIES.filter(
      (dc) => !existingNames.has(dc.name.toLowerCase())
    );
    if (missingCommon.length > 0) {
      companies = [...companies, ...missingCommon];
    }

    // Historical bill numbers
    const histBillNumbers = new Set<string>(
      Array.isArray(parsed.historicalBillNumbers) ? parsed.historicalBillNumbers : []
    );
    bills.forEach((b) => b.billNumber && histBillNumbers.add(b.billNumber));

    return {
      version: parsed.version || '1.1.0',
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      workers,
      projects,
      companies,
      ledger,
      bills,
      activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : [],
      historicalBillNumbers: Array.from(histBillNumbers),
    };
  } catch (err) {
    console.error('Failed to load local storage data:', err);
    return getInitialData();
  }
};

export const saveAppData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to local storage:', err);
  }
};

/**
 * Deterministic balance computation:
 * Balance = Total Earnings - (Total Advance + Total Payment) + Total Adjustments
 */
export const calculateWorkerFinancials = (
  workerId: string,
  entries: LedgerEntry[]
) => {
  let totalEarnings = 0;
  let totalAdvance = 0;
  let totalPayment = 0;
  let totalAdjustment = 0;

  for (const entry of entries) {
    if (entry.workerId === workerId) {
      if (entry.type === 'earning') {
        totalEarnings += Number(entry.amount) || 0;
      } else if (entry.type === 'advance') {
        totalAdvance += Number(entry.amount) || 0;
      } else if (entry.type === 'payment') {
        totalPayment += Number(entry.amount) || 0;
      } else if (entry.type === 'adjustment') {
        totalAdjustment += Number(entry.amount) || 0;
      }
    }
  }

  const currentBalance = totalEarnings - (totalAdvance + totalPayment) + totalAdjustment;

  return {
    totalEarnings,
    totalAdvance,
    totalPayment,
    totalAdjustment,
    currentBalance,
  };
};

export const getWorkerSummary = (
  worker: Worker,
  ledger: LedgerEntry[],
  projects: Project[]
): WorkerSummary => {
  const fin = calculateWorkerFinancials(worker.id, ledger);
  const currentProject = projects.find((p) => p.id === worker.currentProjectId);

  return {
    ...worker,
    ...fin,
    currentProjectName: currentProject ? currentProject.name : undefined,
  };
};

export const getAllWorkerSummaries = (
  workers: Worker[],
  ledger: LedgerEntry[],
  projects: Project[]
): WorkerSummary[] => {
  return workers.map((w) => getWorkerSummary(w, ledger, projects));
};

export const createActivityLog = (
  action: ActivityLog['action'],
  title: string,
  description: string,
  relatedId?: string,
  relatedType?: ActivityLog['relatedType']
): ActivityLog => ({
  id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
  action,
  title,
  description,
  timestamp: new Date().toISOString(),
  relatedId,
  relatedType,
});

/**
 * Realistic Sample Data loader for quick demonstration / initial test
 */
export const getSampleData = (): AppData => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const d1 = `${year}-${month}-02`;
  const d2 = `${year}-${month}-08`;
  const d3 = `${year}-${month}-15`;
  const d4 = `${year}-${month}-24`;

  const companies: Company[] = [
    {
      id: 'c_1',
      name: 'LG',
      contactPerson: 'Mr. Rajesh Verma',
      phone: '9822100010',
      email: 'hvac.projects@lge.com',
      address: 'LG Electronics India, Pune Regional Office',
      notes: 'Materials and ducted indoor units provided directly by LG.',
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    },
    {
      id: 'c_2',
      name: 'Voltas',
      contactPerson: 'Mr. Arvind Joshi',
      phone: '9822100020',
      email: 'contractor.support@voltas.com',
      address: 'FC Road Commercial Service Hub, Pune',
      notes: 'Prompt payment upon commissioning certificate handover.',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ];

  const workers: Worker[] = [
    {
      id: 'w_1',
      name: 'Ramesh Sharma',
      phone: '9822101112',
      role: 'Senior AC Technician',
      notes: 'Expert in VRF & cassette installation',
      currentProjectId: 'p_1',
      active: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'w_2',
      name: 'Suresh Patil',
      phone: '9822102223',
      role: 'AC Fitter',
      notes: 'Copper piping & bracket fitting specialist',
      currentProjectId: 'p_1',
      active: true,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'w_3',
      name: 'Amit Kumar',
      phone: '9822103334',
      role: 'Helper',
      notes: 'General assistance and site handling',
      currentProjectId: 'p_2',
      active: true,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'w_4',
      name: 'Dinesh Yadav',
      phone: '9822104445',
      role: 'Electrician & Welder',
      notes: 'Outdoor cabling and nitrogen testing',
      currentProjectId: 'p_2',
      active: true,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ];

  const projects: Project[] = [
    {
      id: 'p_1',
      name: 'AC Installation – Magarpatta IT Park',
      company: 'LG',
      companyId: 'c_1',
      site: 'Magarpatta City, Tower 5, Pune',
      workDescription: 'Installation of 8 LG Inverter Ducted units and copper piping with insulation',
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-28`,
      agreedAmount: 95000,
      status: 'Active',
      assignedWorkerIds: ['w_1', 'w_2'],
      notes: 'Company supplied units; pressure test completed successfully.',
      createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    },
    {
      id: 'p_2',
      name: 'Showroom Cassette AC Setup',
      company: 'Voltas',
      companyId: 'c_2',
      site: 'FC Road Commercial Complex, Pune',
      workDescription: 'Installation of 4 Cassette AC units and drainage lines',
      startDate: `${year}-${month}-05`,
      endDate: `${year}-${month}-18`,
      agreedAmount: 52000,
      status: 'Completed',
      assignedWorkerIds: ['w_3', 'w_4'],
      notes: 'Commissioning done and handover signed by client.',
      createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
    },
  ];

  const ledger: LedgerEntry[] = [
    // Ramesh: 18000 earning, 5000 advance, 10000 payment -> remaining 3000
    {
      id: 'led_1',
      workerId: 'w_1',
      projectId: 'p_1',
      date: d1,
      type: 'earning',
      amount: 18000,
      note: 'Agreed contract rate for Magarpatta site',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'led_2',
      workerId: 'w_1',
      projectId: 'p_1',
      date: d2,
      type: 'advance',
      amount: 5000,
      note: 'Advance taken for family festival expenses',
      createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    },
    {
      id: 'led_3',
      workerId: 'w_1',
      projectId: 'p_1',
      date: d3,
      type: 'payment',
      amount: 10000,
      note: 'Cash payment handed over on site',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    // Suresh: 15000 earning, 4000 advance -> remaining 11000
    {
      id: 'led_4',
      workerId: 'w_2',
      projectId: 'p_1',
      date: d1,
      type: 'earning',
      amount: 15000,
      note: 'Piping work and bracket installation charge',
      createdAt: new Date(Date.now() - 24 * 86400000).toISOString(),
    },
    {
      id: 'led_5',
      workerId: 'w_2',
      projectId: 'p_1',
      date: d2,
      type: 'advance',
      amount: 4000,
      note: 'Mid-month advance cash',
      createdAt: new Date(Date.now() - 17 * 86400000).toISOString(),
    },
    // Amit: 10000 earning, 2000 advance, 6000 payment -> remaining 2000
    {
      id: 'led_6',
      workerId: 'w_3',
      projectId: 'p_2',
      date: d1,
      type: 'earning',
      amount: 10000,
      note: 'Helper wages for FC Road showroom work',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'led_7',
      workerId: 'w_3',
      projectId: 'p_2',
      date: d2,
      type: 'advance',
      amount: 2000,
      note: 'Travel and food advance',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 'led_8',
      workerId: 'w_3',
      projectId: 'p_2',
      date: d3,
      type: 'payment',
      amount: 6000,
      note: 'Payment settled after site completion',
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    // Dinesh: 12000 earning, 3000 advance, 9000 payment -> remaining 0
    {
      id: 'led_9',
      workerId: 'w_4',
      projectId: 'p_2',
      date: d1,
      type: 'earning',
      amount: 12000,
      note: 'Electrical wiring and brazing contract fee',
      createdAt: new Date(Date.now() - 19 * 86400000).toISOString(),
    },
    {
      id: 'led_10',
      workerId: 'w_4',
      projectId: 'p_2',
      date: d2,
      type: 'advance',
      amount: 3000,
      note: 'Advance for tool repairs',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: 'led_11',
      workerId: 'w_4',
      projectId: 'p_2',
      date: d4,
      type: 'payment',
      amount: 9000,
      note: 'Final settlement paid in full',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ];

  const bills: Bill[] = [
    {
      id: 'b_1',
      billNumber: `ACW-${year}-001`,
      date: `${year}-${month}-20`,
      company: 'Voltas',
      companyId: 'c_2',
      projectId: 'p_2',
      projectName: 'Showroom Cassette AC Setup',
      site: 'FC Road Commercial Complex, Pune',
      workDescription:
        'Complete installation and commissioning of 4 Nos. Cassette AC units including copper piping and nitrogen testing.',
      subtotal: 52000,
      totalAmount: 52000,
      notes: 'Material provided by client. Labor, tools, and brazing completed. Warranty: 90 days on installation workmanship.',
      status: 'Generated',
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
  ];

  const activityLogs: ActivityLog[] = [
    createActivityLog(
      'bill_generated',
      'Bill ACW-' + year + '-001 Generated',
      'Bill of ₹52,000 generated for Voltas (Showroom Cassette AC Setup)',
      'b_1',
      'bill'
    ),
    createActivityLog(
      'payment_recorded',
      'Payment Recorded for Dinesh Yadav',
      '₹9,000 final settlement paid',
      'w_4',
      'worker'
    ),
    createActivityLog(
      'advance_added',
      'Advance Added for Ramesh Sharma',
      '₹5,000 cash advance given',
      'w_1',
      'worker'
    ),
    createActivityLog(
      'project_created',
      'Project Created: Magarpatta IT Park',
      'Client: LG | Value: ₹95,000',
      'p_1',
      'project'
    ),
  ];

  return {
    version: '1.1.0',
    settings: DEFAULT_SETTINGS,
    workers,
    projects,
    companies,
    ledger,
    bills,
    activityLogs,
    historicalBillNumbers: [`ACW-${year}-001`],
  };
};

export const exportBackupJson = (data: AppData): string => {
  const exportPayload: AppData = {
    ...data,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportPayload, null, 2);
};

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
  data?: AppData;
  summary?: {
    workersCount: number;
    projectsCount: number;
    companiesCount: number;
    billsCount: number;
    ledgerCount: number;
    exportedAt?: string;
  };
}

export const validateAndParseBackup = (jsonString: string): BackupValidationResult => {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'File is not a valid JSON object.' };
    }

    const workers = Array.isArray(parsed.workers) ? parsed.workers : [];
    const projects = Array.isArray(parsed.projects) ? parsed.projects : [];
    const companies = Array.isArray(parsed.companies) ? parsed.companies : [];
    const bills = Array.isArray(parsed.bills) ? parsed.bills : [];
    const ledger = Array.isArray(parsed.ledger) ? parsed.ledger : [];
    const historicalBillNumbers = Array.isArray(parsed.historicalBillNumbers)
      ? parsed.historicalBillNumbers
      : [];

    const data: AppData = {
      version: parsed.version || '1.1.0',
      exportedAt: parsed.exportedAt,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      workers,
      projects,
      companies,
      bills,
      ledger,
      activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : [],
      historicalBillNumbers,
    };

    return {
      valid: true,
      data,
      summary: {
        workersCount: workers.length,
        projectsCount: projects.length,
        companiesCount: companies.length,
        billsCount: bills.length,
        ledgerCount: ledger.length,
        exportedAt: parsed.exportedAt,
      },
    };
  } catch (err) {
    return {
      valid: false,
      error: 'Invalid file format: ' + (err instanceof Error ? err.message : 'Unknown JSON error'),
    };
  }
};
