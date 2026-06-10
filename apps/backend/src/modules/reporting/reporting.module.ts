import { Module } from '@nestjs/common';
import { ReportingController } from './reporting.controller.js';
import { ReportingService } from './reporting.service.js';
import { FinanceModule } from '../finance/finance.module.js';

@Module({
  imports: [FinanceModule],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
