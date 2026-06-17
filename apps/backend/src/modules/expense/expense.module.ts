import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller.js';
import { ExpenseService } from './expense.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  controllers: [ExpenseController],
  providers: [ExpenseService, PrismaService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
