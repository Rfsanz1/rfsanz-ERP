import { api } from '../api';

export interface FinanceStats {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  outstanding_invoices: number;
  cash_balance: number;
  accounts_payable: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  account: string;
  status: string;
}

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  parent?: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  balance: number;
  currency: string;
}

export interface CashFlow {
  period: string;
  operating: number;
  investing: number;
  financing: number;
  net: number;
}

export const financeService = {
  getStats: () =>
    api.get<FinanceStats>('/finance/stats').then((r) => r.data),

  getJournalEntries: (params?: { page?: number; limit?: number; from?: string; to?: string }) =>
    api.get<{ data: JournalEntry[]; total: number }>('/finance/journal-entries', { params }).then((r) => r.data),

  getChartOfAccounts: () =>
    api.get<ChartOfAccount[]>('/finance/coa').then((r) => r.data),

  getBankAccounts: () =>
    api.get<BankAccount[]>('/finance/bank-accounts').then((r) => r.data),

  getCashFlow: (params?: { year?: number }) =>
    api.get<CashFlow[]>('/finance/cash-flow', { params }).then((r) => r.data),

  getTaxSummary: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get('/finance/reports/tax-summary', { params }).then((r) => r.data),

  getEFakturs: (params?: { status?: string; search?: string; page?: number; limit?: number; dateFrom?: string; dateTo?: string }) =>
    api.get('/finance/reports/efakturs', { params }).then((r) => r.data),

  exportReport: (params: { type: string; format?: 'xlsx' | 'pdf'; date?: string; dateFrom?: string; dateTo?: string }) =>
    api.get('/finance/reports/export', { params, responseType: 'arraybuffer' }).then((r) => r.data),
};
