import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JournalRecurringService } from './journal-recurring.service.js';

@Injectable()
export class JournalRecurringCronService {
  private readonly logger = new Logger(JournalRecurringCronService.name);

  constructor(private readonly recurringService: JournalRecurringService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleCron() {
    this.logger.debug('Menjalankan recurring journal harian');
    try {
      await this.recurringService.runDueRecurring();
    } catch (error) {
      this.logger.error('Recurring journal cron gagal', error as Error);
    }
  }
}
