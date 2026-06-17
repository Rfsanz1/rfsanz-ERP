import { Injectable, Inject } from '@nestjs/common';
import { FinancialReportService } from '../finance/financial-report.service.js';
import { LedgerService } from '../finance/ledger.service.js';

@Injectable()
export class ReportingService {
  constructor(
    @Inject(FinancialReportService) private readonly reportSvc: FinancialReportService,
    @Inject(LedgerService) private readonly ledgerSvc: LedgerService,
  ) {}

  getLabaRugi(dateFrom: string, dateTo: string) {
    return this.reportSvc.getIncomeStatement(dateFrom, dateTo, false);
  }

  getNeraca(date?: string) {
    return this.reportSvc.getBalanceSheet(date);
  }

  getArusKas(dateFrom: string, dateTo: string) {
    return this.reportSvc.getCashFlow(dateFrom, dateTo);
  }

  getBukuBesar(accountId: string, dateFrom?: string, dateTo?: string) {
    return this.ledgerSvc.getGeneralLedger(accountId, dateFrom, dateTo);
  }

  getTrialBalance(dateFrom?: string, dateTo?: string) {
    return this.ledgerSvc.getTrialBalance(dateFrom, dateTo);
  }

  exportReport(report: string, format: string, dateFrom?: string, dateTo?: string, date?: string) {
    return this.reportSvc.exportReport(report, format, date, dateFrom, dateTo);
  }
}
