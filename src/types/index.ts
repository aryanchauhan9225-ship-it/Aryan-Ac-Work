export type WorkerRole =
  | 'Senior AC Technician'
  | 'AC Technician'
  | 'AC Fitter'
  | 'Helper'
  | 'Copper Piping Specialist'
  | 'Welder'
  | 'Electrician'
  | 'Contractor'
  | 'Other';

export type LedgerEntryType = 'earning' | 'advance' | 'payment' | 'adjustment';

export interface LedgerEntry {
  id: string;
  workerId: string;
  projectId?: string;
  date: string; // YYYY-MM-DD
  type: LedgerEntryType;
  amount: number;
  note: string;
  createdAt: string;
}

export interface Worker {
  id: string;
  name: string;
  phone?: string;
  role?: WorkerRole | string;
  notes?: string;
  currentProjectId?: string;
  active: boolean;
  createdAt: string;
}

export type ProjectStatus = 'Active' | 'Completed' | 'On Hold' | 'Archived';

export interface Project {
  id: string;
  name: string;
  company: string; // e.g. LG, Voltas, Daikin, etc.
  companyId?: string;
  site: string; // e.g. Pune, Hadapsar, Viman Nagar
  workDescription: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  agreedAmount?: number;
  status: ProjectStatus;
  assignedWorkerIds: string[];
  notes?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string; // e.g. LG, Voltas, Blue Star
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export type BillStatus = 'Draft' | 'Generated';

export interface BillItem {
  id: string;
  description: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount: number;
}

export interface Bill {
  id: string;
  billNumber: string; // e.g. ACW-2026-001
  date: string; // YYYY-MM-DD
  poNumber?: string;
  poDate?: string;
  kindAttn?: string;
  company: string;
  companyId?: string;
  projectId?: string;
  projectName: string;
  site: string;
  workDescription: string;
  items?: BillItem[];
  subtotal: number;
  taxLabel?: string; // e.g. "Service Tax" or "GST"
  taxEnabled?: boolean;
  taxRate?: number; // e.g. 18%
  taxAmount?: number;
  panNumber?: string;
  totalAmount: number;
  notes?: string;
  status: BillStatus;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  ownerName: string;
  assistantName: string;
  phonePrimary: string;
  phoneSecondary?: string;
  address: string;
  city: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  taxLabel?: string;
  taxNumber?: string;
  enableGstBilling: boolean;
  theme: 'light' | 'dark' | 'system';
  lastUsedWorkerId?: string;
  lastUsedProjectId?: string;
  lastUsedCompany?: string;
}

export type ActivityAction =
  | 'worker_added'
  | 'worker_updated'
  | 'worker_deleted'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'company_added'
  | 'company_updated'
  | 'company_deleted'
  | 'advance_added'
  | 'payment_recorded'
  | 'earning_added'
  | 'adjustment_added'
  | 'entry_deleted'
  | 'bill_generated'
  | 'bill_updated'
  | 'bill_deleted'
  | 'backup_restored';

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  title: string;
  description: string;
  timestamp: string;
  relatedId?: string;
  relatedType?: 'worker' | 'project' | 'bill' | 'company';
}

export interface AppData {
  version: string;
  exportedAt?: string;
  settings: BusinessSettings;
  workers: Worker[];
  projects: Project[];
  companies: Company[];
  ledger: LedgerEntry[];
  bills: Bill[];
  activityLogs: ActivityLog[];
  historicalBillNumbers?: string[];
}

export interface WorkerSummary extends Worker {
  totalEarnings: number;
  totalAdvance: number;
  totalPayment: number;
  totalAdjustment: number;
  currentBalance: number; // Earnings - (Advance + Payment) + Adjustment
  currentProjectName?: string;
}
