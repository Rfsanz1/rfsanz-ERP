import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { CostingService } from './costing.service.js';
import { LandedCostService } from './landed-cost.service.js';
import { ValuationService } from './valuation.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { SettingsModule } from '../settings/settings.module.js';
import { FinanceModule } from '../finance/finance.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { ReorderCronService } from './reorder-cron.service.js';

@Module({
  imports: [SettingsModule, FinanceModule, ScheduleModule.forRoot()],
  controllers: [InventoryController],
  providers: [InventoryService, CostingService, LandedCostService, ValuationService, PrismaService, ReorderCronService],
  exports: [InventoryService, CostingService, LandedCostService, ValuationService],
})
export class InventoryModule {}
