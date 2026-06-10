import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller.js';
import { InvoiceService } from './invoice.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { NotificationGateway } from '../notification/notification.gateway.js';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService, PrismaService, NotificationService, NotificationGateway],
  exports: [InvoiceService],
})
export class InvoiceModule {}
