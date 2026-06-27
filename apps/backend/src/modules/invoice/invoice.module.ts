import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller.js';
import { InvoiceService } from './invoice.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { NotificationModule } from '../notification/notification.module.js';
import { KledoModule } from '../kledo/kledo.module.js';

@Module({
  imports: [NotificationModule, KledoModule],
  controllers: [InvoiceController],
  providers: [InvoiceService, PrismaService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
