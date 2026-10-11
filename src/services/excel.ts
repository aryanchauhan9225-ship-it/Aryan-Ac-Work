import * as XLSX from 'xlsx';
import { AppData, LedgerEntry, Company } from '../types';
import { formatDate, formatNumber } from './formatters';
import { getAllWorkerSummaries } from './storage';

export interface ExcelExportOptions {
  periodType: 'all' | 'current_month' | 'custom';
  startDate?: string;
  endDate?: string;
}

export const generateExcelWorkbook = (
  appData: AppData,
  options: ExcelExportOptions
): void => {
  const { settings, workers, projects, bills, ledger, companies = [] } = appData;

  // Filter ledger and bills if period specified
  let filteredLedger = [...ledger];
  let filteredBills = [...bills];
  let periodLabel = 'All Recorded Data';
  let filePeriodSlug = 'All_Data';

  if (options.periodType === 'current_month') {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    filteredLedger = ledger.filter((l) => l.date.startsWith(currentYearMonth));
    filteredBills = bills.filter((b) => b.date.startsWith(currentYearMonth));
    const monthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    periodLabel = `Month: ${monthName}`;
    filePeriodSlug = monthName.replace(/\s+/g, '_');
  } else if (options.periodType === 'custom' && options.startDate && options.endDate) {
    filteredLedger = ledger.filter(
      (l) => l.date >= options.startDate! && l.date <= options.endDate!
    );
    filteredBills = bills.filter(
      (b) => b.date >= options.startDate! && b.date <= options.endDate!
    );
    periodLabel = `Period: ${formatDate(options.startDate)} to ${formatDate(options.endDate)}`;
    filePeriodSlug = `${options.startDate}_to_${options.endDate}`;
  }

  // Calculate totals
  let totalEarnings = 0;
  let totalAdvance = 0;
  let totalPayment = 0;
  let totalAdjustment = 0;

  for (const entry of filteredLedger) {
    if (entry.type === 'earning') totalEarnings += Number(entry.amount) || 0;
    else if (entry.type === 'advance') totalAdvance += Number(entry.amount) || 0;
    else if (entry.type === 'payment') totalPayment += Number(entry.amount) || 0;
    else if (entry.type === 'adjustment') totalAdjustment += Number(entry.amount) || 0;
  }

  const totalOutstandingBalance =
    totalEarnings - (totalAdvance + totalPayment) + totalAdjustment;

  const totalBillsAmount = filteredBills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);

  // Worker summaries for worker sheet
  const workerSummaries = getAllWorkerSummaries(workers, ledger, projects);

  // Quick lookup maps
  const workerMap = new Map(workers.map((w) => [w.id, w.name]));
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  // 1. SHEET 1: SUMMARY
  const summaryData = [
    ['ARYAN AC WORK - BUSINESS & HISAAB REGISTER', ''],
    ['Report Generated Date:', new Date().toLocaleString('en-IN')],
    ['Report Period:', periodLabel],
    ['Business Owner:', settings.ownerName || 'ARYAN AC WORK'],
    ['Primary Contact:', settings.phonePrimary || '—'],
    ['Secondary Contact:', settings.phoneSecondary || '—'],
    ['Location / City:', settings.city || '—'],
    ['Workshop / Address:', settings.address || '—'],
    ['', ''],
    ['METRIC', 'VALUE'],
    ['Total Registered Companies / Clients', companies.length],
    ['Total Projects', projects.length],
    ['Active Projects', projects.filter((p) => p.status === 'Active').length],
    ['Completed Projects', projects.filter((p) => p.status === 'Completed').length],
    ['On Hold Projects', projects.filter((p) => p.status === 'On Hold').length],
    ['Total Registered Workers', workers.length],
    ['Total Worker Earnings / Work Value (₹)', totalEarnings],
    ['Total Worker Advances Paid (₹)', totalAdvance],
    ['Total Worker Wages Settled (₹)', totalPayment],
    ['Total Outstanding Worker Dues (₹)', totalOutstandingBalance],
    ['Total Bills Generated Count', filteredBills.length],
    ['Total Billed Value (₹)', totalBillsAmount],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 32 }];

  // 2. SHEET 2: WORKERS
  const workerHeaders = [
    'Worker Name',
    'Phone',
    'Role / Trade',
    'Current Project',
    'Total Earnings (₹)',
    'Total Advance (₹)',
    'Total Paid (₹)',
    'Balance Due (₹)',
    'Status',
  ];

  const workerRows = workerSummaries.map((w) => [
    w.name,
    w.phone || '—',
    w.role || '—',
    w.currentProjectName || 'None',
    w.totalEarnings,
    w.totalAdvance,
    w.totalPayment,
    w.currentBalance,
    w.active ? 'Active' : 'Inactive',
  ]);

  const wsWorkers = XLSX.utils.aoa_to_sheet([workerHeaders, ...workerRows]);
  wsWorkers['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 24 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
  ];

  // 3. SHEET 3: WORKER LEDGER (Chronological)
  const ledgerHeaders = [
    'Date',
    'Worker Name',
    'Project',
    'Entry Type',
    'Amount (₹)',
    'Notes / Description',
  ];

  const sortedLedger = [...filteredLedger].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const ledgerRows = sortedLedger.map((l: LedgerEntry) => {
    let typeDisplay = 'Earning / Work';
    if (l.type === 'advance') typeDisplay = 'Advance Taken';
    else if (l.type === 'payment') typeDisplay = 'Payment Settled';
    else if (l.type === 'adjustment') typeDisplay = 'Adjustment';

    return [
      l.date,
      workerMap.get(l.workerId) || 'Unknown Worker',
      l.projectId ? projectMap.get(l.projectId) || '—' : '—',
      typeDisplay,
      Number(l.amount) || 0,
      l.note || '',
    ];
  });

  const wsLedger = XLSX.utils.aoa_to_sheet([ledgerHeaders, ...ledgerRows]);
  wsLedger['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 28 },
    { wch: 18 },
    { wch: 16 },
    { wch: 40 },
  ];

  // 4. SHEET 4: PROJECTS
  const projectHeaders = [
    'Project Name',
    'Company / Client',
    'Site Location',
    'Start Date',
    'End Date',
    'Agreed Value (₹)',
    'Status',
    'Assigned Workers',
    'Work Description',
  ];

  const projectRows = projects.map((p) => {
    const assignedNames = (p.assignedWorkerIds || [])
      .map((id) => workerMap.get(id))
      .filter(Boolean)
      .join(', ');

    return [
      p.name,
      p.company,
      p.site,
      p.startDate || '—',
      p.endDate || '—',
      p.agreedAmount || 0,
      p.status,
      assignedNames || 'None',
      p.workDescription,
    ];
  });

  const wsProjects = XLSX.utils.aoa_to_sheet([projectHeaders, ...projectRows]);
  wsProjects['!cols'] = [
    { wch: 30 },
    { wch: 18 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 30 },
    { wch: 40 },
  ];

  // 5. SHEET 5: BILLS
  const billHeaders = [
    'Bill Number',
    'Date',
    'Company / Client',
    'Project',
    'Site Location',
    'Kind Attn',
    'PO Number',
    'PO Date',
    'Subtotal (₹)',
    'Tax Applied',
    'Total Amount (₹)',
    'Status',
    'Work Items / Scope',
    'Notes',
  ];

  const sortedBills = [...filteredBills].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const billRows = sortedBills.map((b) => [
    b.billNumber,
    b.date,
    b.company,
    b.projectName,
    b.site,
    b.kindAttn || '—',
    b.poNumber || '—',
    b.poDate || '—',
    b.subtotal || b.totalAmount,
    b.taxEnabled ? `${b.taxLabel || 'Tax'} (${b.taxRate}%)` : 'None',
    b.totalAmount,
    b.status,
    b.items && b.items.length > 0
      ? b.items.map((it) => `${it.description} [${it.quantity} ${it.unit} @ ₹${it.rate}]`).join('; ')
      : b.workDescription,
    b.notes || '',
  ]);

  const wsBills = XLSX.utils.aoa_to_sheet([billHeaders, ...billRows]);
  wsBills['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 28 },
    { wch: 22 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 45 },
    { wch: 30 },
  ];

  // 6. SHEET 6: COMPANIES / CLIENTS
  const companyHeaders = [
    'Company Name',
    'Contact Person',
    'Phone',
    'Email',
    'Address',
    'Total Projects',
    'Total Bills',
    'Total Contract Value (₹)',
    'Total Billed Amount (₹)',
  ];

  const companyRows = companies.map((c) => {
    const compProjects = projects.filter(
      (p) => p.company.trim().toLowerCase() === c.name.trim().toLowerCase()
    );
    const compBills = bills.filter(
      (b) => b.company.trim().toLowerCase() === c.name.trim().toLowerCase()
    );
    const contractVal = compProjects.reduce((sum, p) => sum + (p.agreedAmount || 0), 0);
    const billedVal = compBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return [
      c.name,
      c.contactPerson || '—',
      c.phone || '—',
      c.email || '—',
      c.address || '—',
      compProjects.length,
      compBills.length,
      contractVal,
      billedVal,
    ];
  });

  const wsCompanies = XLSX.utils.aoa_to_sheet([companyHeaders, ...companyRows]);
  wsCompanies['!cols'] = [
    { wch: 22 },
    { wch: 22 },
    { wch: 16 },
    { wch: 24 },
    { wch: 32 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 24 },
  ];

  // Create workbook and append all 6 sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  XLSX.utils.book_append_sheet(wb, wsWorkers, 'Workers');
  XLSX.utils.book_append_sheet(wb, wsLedger, 'Worker Ledger');
  XLSX.utils.book_append_sheet(wb, wsProjects, 'Projects');
  XLSX.utils.book_append_sheet(wb, wsBills, 'Bills');
  XLSX.utils.book_append_sheet(wb, wsCompanies, 'Companies');

  // Generate filename: ARYAN_AC_WORK_<Period>.xlsx
  const filename = `ARYAN_AC_WORK_${filePeriodSlug}.xlsx`;

  // Trigger browser download
  XLSX.writeFile(wb, filename);
};
