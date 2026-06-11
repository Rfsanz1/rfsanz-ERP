import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller.js';
import { OrdersPublicController } from './orders-public.controller.js';
import { SalesService } from './sales.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { KledoModule } from '../kledo/kledo.module.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [KledoModule, NotificationModule],
  controllers: [SalesController, OrdersPublicController],
  providers: [SalesService, PrismaService],
  exports: [SalesService],
})
export class SalesModule {}
