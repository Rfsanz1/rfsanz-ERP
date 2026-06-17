import { Module } from '@nestjs/common';
import { RecruitmentController } from './recruitment.controller.js';
import { RecruitmentService } from './recruitment.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({ controllers: [RecruitmentController], providers: [RecruitmentService, PrismaService], exports: [RecruitmentService] })
export class RecruitmentModule {}
