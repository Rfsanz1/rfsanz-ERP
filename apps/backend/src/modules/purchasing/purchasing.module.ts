import { Module } from '@nestjs/common';
import { PurchasingController } from './purchasing.controller.js';
import { PurchasingService } from './purchasing.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({ controllers: [PurchasingController], providers: [PurchasingService, PrismaService], exports: [PurchasingService] })
export class PurchasingModule {}
