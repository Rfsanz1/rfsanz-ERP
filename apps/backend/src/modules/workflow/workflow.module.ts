import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller.js';
import { WorkflowService } from './workflow.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  controllers: [WorkflowController],
  providers: [WorkflowService, PrismaService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
