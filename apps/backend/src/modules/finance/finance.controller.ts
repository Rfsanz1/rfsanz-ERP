import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, Inject, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { BankReconService } from './bank-recon.service.js';
import { Response } from 'express';
import { FinanceService } from './finance.service.js';
import { AccountService } from './account.service.js';
import { JournalService } from './journal.service.js';
import { LedgerService } from './ledger.service.js';
import { FinancialReportService } from './financial-report.service.js';
import { ARAgingService } from './ar-aging.service.js';
import { APAgingService } from './ap-aging.service.js';
import { BudgetService } from './budget.service.js';
import { CreditLimitService } from './credit-limit.service.js';
import { JournalRecurringService } from './journal-recurring.service.js';
import { TaxService } from './tax.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(
    @Inject(BankReconService) private readonly bankReconSvc: BankReconService,
    @Inject(FinanceService) private readonly svc: FinanceService,
    @Inject(AccountService) private readonly accountSvc: AccountService,
    @Inject(JournalService) private readonly journalSvc: JournalService,
    @Inject(LedgerService) private readonly ledgerSvc: LedgerService,
    @Inject(FinancialReportService) private readonly reportSvc: FinancialReportService,
    @Inject(ARAgingService) private readonly arAgingSvc: ARAgingService,
    @Inject(APAgingService) private readonly apAgingSvc: APAgingService,
    @Inject(BudgetService) private readonly budgetSvc: BudgetService,
    @Inject(CreditLimitService) private readonly creditSvc: CreditLimitService,
    @Inject(JournalRecurringService) private readonly recurringSvc: JournalRecurringService,
    @Inject(TaxService) private readonly taxSvc: TaxService,
  ) {}

  // ─── Stats ────────────────────────────────────────────────────────────
  @Get('stats') getStats() { return this.svc.getStats(); }

  // ─── Legacy journal entries (ChartOfAccount) ─────────────────────────
  @Get('journal-entries') getJournals(@Query() q: any) { return this.svc.getJournalEntries(q); }
  @Post('journal-entries') createJournalEntry(@Body() dto: any) { return this.svc.createJournalEntry(dto); }

  // ─── Legacy COA ───────────────────────────────────────────────────────
  @Get('coa') getCoa(@Query() q: any) { return this.svc.getCoa(q); }
  @Post('coa') createCoa(@Body() dto: any) { return this.svc.createCoa(dto); }
  @Put('coa/:id') updateCoa(@Param('id') id: string, @Body() dto: any) { return this.svc.updateCoa(id, dto); }

  // ─── Bank & Cash ──────────────────────────────────────────────────────
  @Get('bank-accounts') getBankAccounts() { return this.svc.getBankAccounts(); }
  @Get('bank-transactions') getBankTx(@Query() q: any) { return this.svc.getBankTransactions(q); }
  @Post('bank-transactions') createBankTx(@Body() dto: any) { return this.svc.createBankTransaction(dto); }
  @Post('bank-transactions/receive') createBankReceive(@Body() dto: any) { return this.svc.createBankReceive(dto); }
  @Post('bank-transactions/payment') createBankPayment(@Body() dto: any) { return this.svc.createBankPayment(dto); }
  @Post('bank-transactions/transfer') transferBankFunds(@Body() dto: any) { return this.svc.transferBankFunds(dto); }
  @Get('cash-transactions') getCashTx(@Query() q: any) { return this.svc.getCashTransactions(q); }
  @Post('cash-transactions') createCashTx(@Body() dto: any) { return this.svc.createCashTransaction(dto); }
  @Post('cash-transactions/receive') createCashReceive(@Body() dto: any) { return this.svc.createCashReceive(dto); }
  @Post('cash-transactions/payment') createCashPayment(@Body() dto: any) { return this.svc.createCashPayment(dto); }
  @Get('money-transactions') getMoneyTransactions(@Query() q: any) { return this.svc.getMoneyTransactions(q); }
  @Get('cash-flow') getCashFlow(@Query() q: any) { return this.svc.getCashFlow(q); }

  // ─── Accounts (Chart of Accounts — double entry) ─────────────────────
  @Get('accounts') getAccounts(@Query() q: any) { return this.accountSvc.findAll(q); }
  @Get('accounts/tree') getAccountTree() { return this.accountSvc.getTree(); }
  @Get('accounts/:id') getAccount(@Param('id') id: string) { return this.accountSvc.findOne(id); }
  @Post('accounts') createAccount(@Body() dto: any) { return this.accountSvc.create(dto); }
  @Put('accounts/:id') updateAccount(@Param('id') id: string, @Body() dto: any) { return this.accountSvc.update(id, dto); }
  @Delete('accounts/:id') removeAccount(@Param('id') id: string) { return this.accountSvc.remove(id); }

  // ─── Journals (double entry) ──────────────────────────────────────────
  @Get('journals') getJournalList(@Query() q: any) { return this.journalSvc.findAll(q); }
  @Get('journals/:id') getJournal(@Param('id') id: string) { return this.journalSvc.findOne(id); }
  @Post('journals') createJournal(@Body() dto: any) { return this.journalSvc.createJournal(dto); }
  @Post('journals/:id/post') postJournal(@Param('id') id: string) { return this.journalSvc.postJournal(id); }
  @Post('journals/:id/cancel') cancelJournal(@Param('id') id: string) { return this.journalSvc.cancelJournal(id); }
  @Post('journals/:id/reverse') reverseJournal(@Param('id') id: string) { return this.journalSvc.reverseJournal(id); }

  // ─── Ledger ───────────────────────────────────────────────────────────
  @Get('ledger/:accountId') getGeneralLedger(@Param('accountId') accountId: string, @Query() q: any) {
    return this.ledgerSvc.getGeneralLedger(accountId, q.dateFrom, q.dateTo);
  }
  @Get('trial-balance') getTrialBalance(@Query() q: any) {
    return this.ledgerSvc.getTrialBalance(q.dateFrom, q.dateTo);
  }

  // ─── Financial Reports ────────────────────────────────────────────────
  @Get('reports/balance-sheet') getBalanceSheet(@Query() q: any) { return this.reportSvc.getBalanceSheet(q.asOf || q.date); }
  @Get('reports/income-statement') getIncomeStatement(@Query() q: any) { return this.reportSvc.getIncomeStatement(q.startDate || q.dateFrom, q.endDate || q.dateTo, q.compare === 'true' || q.compare === true); }
  @Get('reports/cash-flow') getCashFlowReport(@Query() q: any) { return this.reportSvc.getCashFlow(q.startDate || q.dateFrom, q.endDate || q.dateTo); }
  @Get('reports/equity-statement') getEquityStatement(@Query() q: any) { return this.reportSvc.getStatementOfEquity(q.startDate || q.dateFrom, q.endDate || q.dateTo); }
  @Get('reports/executive-summary') getExecutiveSummary(@Query() q: any) { return this.reportSvc.getExecutiveSummary(q.startDate || q.dateFrom, q.endDate || q.dateTo); }
  @Get('reports/tax-summary') getTaxSummary(@Query() q: any) { return this.taxSvc.getTaxSummary(q); }
  @Get('reports/efakturs') getEfakturs(@Query() q: any) { return this.taxSvc.getEFakturs(q); }
  @Get('reports/efakturs/export') async exportEfakturs(@Query() q: any, @Res({ passthrough: true }) res: Response) {
    const { buffer, filename } = await this.taxSvc.exportEFaktursCsv(q);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Buffer.from(buffer as any));
  }
  @Get('reports/export') async exportReport(@Query() q: any, @Res({ passthrough: true }) res: Response) {
    const compare = q.compare === 'true' || q.compare === true;
    const { buffer, filename, contentType } = await this.reportSvc.exportReport(q.type, q.format, q.date, q.dateFrom, q.dateTo, compare);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Buffer.from(buffer as any));
  }

  // ─── AR/AP Aging ─────────────────────────────────────────────────────
  @Get('ar-aging') getARAgingReport(@Query() q: any) { return this.arAgingSvc.getARAgingReport(q.asOf ? new Date(q.asOf) : undefined, q.branchId); }
  @Get('ap-aging') getAPAgingReport(@Query() q: any) { return this.apAgingSvc.getAPAgingReport(q.asOf ? new Date(q.asOf) : undefined, q.branchId); }

  // ─── Credit Limit ─────────────────────────────────────────────────────
  @Get('credit-limits') getCreditLimits(@Query() q: any) { return this.creditSvc.getCreditLimits(q); }
  @Post('credit-limits/:customerId/set') setCreditLimit(@Param('customerId') id: string, @Body() dto: { creditLimit: number }) {
    return this.creditSvc.setCreditLimit(id, dto.creditLimit);
  }
  @Post('credit-limits/:customerId/check') checkCredit(@Param('customerId') id: string, @Body() dto: { amount: number }) {
    return this.creditSvc.checkCreditLimit(id, dto.amount);
  }
  @Post('credit-limits/bulk') setBulkCreditLimit(@Body() dto: { items: { customerId: string; creditLimit: number }[] }) {
    return this.creditSvc.setBulkCreditLimit(dto.items);
  }

  // ─── Recurring Journals ───────────────────────────────────────────────
  @Get('journals/recurring') getRecurringJournals(@Query() q: any) { return this.recurringSvc.findAll(q); }
  @Get('journals/recurring/:id') getRecurringJournal(@Param('id') id: string) { return this.recurringSvc.findOne(id); }
  @Post('journals/recurring') createRecurringJournal(@Body() dto: any) { return this.recurringSvc.create(dto); }
  @Put('journals/recurring/:id') updateRecurringJournal(@Param('id') id: string, @Body() dto: any) { return this.recurringSvc.update(id, dto); }
  @Delete('journals/recurring/:id') deleteRecurringJournal(@Param('id') id: string) { return this.recurringSvc.remove(id); }
  @Post('journals/recurring/:id/run') runRecurringJournal(@Param('id') id: string) { return this.recurringSvc.runDueRecurring(id); }
  @Post('journals/recurring/run') runDueRecurringJournals() { return this.recurringSvc.runDueRecurring(); }

  // ─── Budget ───────────────────────────────────────────────────────────
  @Get('budgets') getBudgets(@Query() q: any) { return this.budgetSvc.getBudgets(q); }
  @Get('budgets/:id') getBudget(@Param('id') id: string) { return this.budgetSvc.getBudget(id); }
  @Post('budgets') createBudget(@Body() dto: any) { return this.budgetSvc.createBudget(dto); }
  @Put('budgets/:id') updateBudget(@Param('id') id: string, @Body() dto: any) { return this.budgetSvc.updateBudget(id, dto); }
  @Post('budgets/:id/approve') approveBudget(@Param('id') id: string) { return this.budgetSvc.approveBudget(id); }
  @Get('budgets/:id/vs-actual') getBudgetVsActual(@Param('id') id: string) { return this.budgetSvc.getBudgetVsActual(id); }
  @Post('budgets/check-availability') checkBudget(@Body() dto: { accountId: string; amount: number; bulan: number; tahun: number }) {
    return this.budgetSvc.checkBudgetAvailability(dto.accountId, dto.amount, dto.bulan, dto.tahun);
  }

  // ─── Fixed Assets ─────────────────────────────────────────────────────
  @Get('fixed-assets') getAssets(@Query() q: any) { return { redirect: '/api/assets', q }; }

  // ─── Bank Account CRUD ─────────────────────────────────────────────────
  @Post('bank-accounts')
  createBankAccount(@Body() dto: any) { return this.svc.createBankAccount(dto); }

  @Put('bank-accounts/:id')
  updateBankAccount(@Param('id') id: string, @Body() dto: any) { return this.svc.updateBankAccount(id, dto); }

  @Delete('bank-accounts/:id')
  deleteBankAccount(@Param('id') id: string) { return this.svc.deleteBankAccount(id); }

  @Post('send-money') sendMoney(@Body() dto: any) { return this.svc.sendMoney(dto); }
  @Post('receive-money') receiveMoney(@Body() dto: any) { return this.svc.receiveMoney(dto); }

  // ─── Bank Reconciliation ───────────────────────────────────────────────
  @Get('bank-reconciliations')
  getReconciliations(@Query() q: any) { return this.svc.getBankReconciliations(q); }

  @Get('bank-reconciliations/:id')
  getReconciliation(@Param('id') id: string) { return this.svc.getBankReconciliation(id); }

  @Get('bank-reconciliation/:accountId')
  getReconciliationByAccount(@Param('accountId') accountId: string) { return this.svc.getBankReconciliationsByAccount(accountId); }

  @Post('bank-reconciliations')
  createReconciliation(@Body() dto: any) { return this.svc.createBankReconciliation(dto); }

  @Put('bank-reconciliations/:id')
  updateReconciliation(@Param('id') id: string, @Body() dto: any) { return this.svc.updateBankReconciliation(id, dto); }

  @Post('bank-reconciliations/import-csv')
  importBankCsv(@Body() dto: any) { return this.svc.importBankCsv(dto); }

  @Post('bank-reconciliations/:id/match')
  matchBankTransaction(@Param('id') id: string, @Body() dto: any) { return this.svc.matchBankTransaction(id, dto); }

  @Post('bank-reconciliations/:id/auto-match')
  autoMatchBankReconciliation(@Param('id') id: string) { return this.svc.autoMatchBankReconciliation(id); }

  @Post('bank-reconciliations/:id/complete')
  completeBankReconciliation(@Param('id') id: string) { return this.svc.completeBankReconciliation(id); }

  // ─── Bank Import & Reconciliation (new) ───────────────────────────────
  @Post('bank/import-mutasi')
  importMutasi(@Body() body: any) {
    return this.bankReconSvc.importMutasi(body.bankAccountId, body.csvContent, body.format || 'general');
  }

  @Post('bank/auto-match')
  autoMatch(@Query('bankAccountId') bankAccountId: string) {
    return this.bankReconSvc.autoMatch(bankAccountId);
  }

  @Patch('bank/transactions/:id/match')
  matchTransaction(@Param('id') id: string, @Body() body: any) {
    return this.bankReconSvc.matchTransaction(id, body.journalLineId);
  }

  @Patch('bank/transactions/:id/unmatch')
  unmatchTransaction(@Param('id') id: string) {
    return this.bankReconSvc.unmatchTransaction(id);
  }

  @Get('bank/transactions')
  getBankImportedTransactions(@Query() q: any) {
    return this.bankReconSvc.getTransactions(q.bankAccountId, q.status, q.from, q.to, q.page, q.limit);
  }

  @Get('bank/reconciliation-summary')
  getReconciliationSummary(@Query() q: any) {
    return this.bankReconSvc.getReconciliationSummary(q.bankAccountId, q.from, q.to);
  }

  // ─── COA delete ────────────────────────────────────────────────────────
  @Delete('coa/:id')
  deleteCoa(@Param('id') id: string) { return this.svc.deleteCoa(id); }

  // ─── Profit & Loss alias ───────────────────────────────────────────────
  @Get('reports/profit-loss')
  getProfitLoss(@Query() q: any) { return this.reportSvc.getIncomeStatement(q.dateFrom, q.dateTo, q.compare === 'true' || q.compare === true); }

  @Get('reports/profit-loss/pdf')
  async getProfitLossPdf(@Query() q: any, @Res({ passthrough: true }) res: Response) {
    const { buffer, filename, contentType } = await this.reportSvc.exportReport('profit-loss', 'pdf', undefined, q.dateFrom, q.dateTo);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Buffer.from(buffer as any));
  }

  @Get('reports/profit-loss/excel')
  async getProfitLossExcel(@Query() q: any, @Res({ passthrough: true }) res: Response) {
    const { buffer, filename, contentType } = await this.reportSvc.exportReport('profit-loss', 'xlsx', undefined, q.dateFrom, q.dateTo);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Buffer.from(buffer as any));
  }
}
