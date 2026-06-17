import { Module } from '@nestjs/common';
import { HelpdeskController } from './helpdesk.controller.js';
import { HelpdeskService } from './helpdesk.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({ controllers: [HelpdeskController], providers: [HelpdeskService, PrismaService], exports: [HelpdeskService] })
export class HelpdeskModule {}
