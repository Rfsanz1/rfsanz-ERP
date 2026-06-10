import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller.js';
import { OrdersPublicController } from './orders-public.controller.js';
import { SalesService } from './sales.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { KledoModule } from '../kledo/kledo.module.js';
import { NotificationService } from '../notification/notification.service.js';
import { NotificationGateway } from '../notification/notification.gateway.js';

@Module({
  imports: [KledoModule],
  controllers: [SalesController, OrdersPublicController],
  providers: [SalesService, PrismaService, NotificationService, NotificationGateway],
  exports: [SalesService],
})
export class SalesModule {}
