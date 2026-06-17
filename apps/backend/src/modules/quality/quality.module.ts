import { Module } from '@nestjs/common';
import { QualityController } from './quality.controller.js';
import { QualityService } from './quality.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({ controllers: [QualityController], providers: [QualityService, PrismaService], exports: [QualityService] })
export class QualityModule {}
