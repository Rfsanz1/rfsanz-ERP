import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FinanceController } from './finance.controller.js';
import { FinanceService } from './finance.service.js';
import { AccountService } from './account.service.js';
import { JournalService } from './journal.service.js';
import { LedgerService } from './ledger.service.js';
import { FinancialReportService } from './financial-report.service.js';
import { AutoJournalService } from './auto-journal.service.js';
import { ARAgingService } from './ar-aging.service.js';
import { APAgingService } from './ap-aging.service.js';
import { BudgetService } from './budget.service.js';
import { CreditLimitService } from './credit-limit.service.js';
import { JournalRecurringService } from './journal-recurring.service.js';
import { JournalRecurringCronService } from './journal-recurring-cron.service.js';
import { TaxService } from './tax.service.js';
import { BankReconService } from './bank-recon.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  imports: [ScheduleModule],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    AccountService,
    JournalService,
    LedgerService,
    FinancialReportService,
    AutoJournalService,
    ARAgingService,
    APAgingService,
    BudgetService,
    CreditLimitService,
    JournalRecurringService,
    JournalRecurringCronService,
    TaxService,
    BankReconService,
    PrismaService,
  ],
  exports: [
    FinanceService,
    AccountService,
    JournalService,
    LedgerService,
    FinancialReportService,
    AutoJournalService,
    ARAgingService,
    APAgingService,
    BudgetService,
    CreditLimitService,
    JournalRecurringService,
    TaxService,
    BankReconService,
  ],
})
export class FinanceModule {}
