import { Controller, Get, Post, Put, Body, Query, UseGuards, Request } from '@nestjs/common';
import { WorkflowService } from './workflow.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('workflow')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly svc: WorkflowService) {}

  @Get('config')
  getConfig(@Query('module') module?: string) {
    return this.svc.getWorkflowConfig(module);
  }

  @Put('config')
  updateConfig(@Body() body: any) {
    return this.svc.updateWorkflowConfig(body);
  }

  @Post('request')
  requestApproval(@Body() body: any, @Request() req: any) {
    return this.svc.requestApproval(body, req.user?.userId);
  }

  @Post('approve')
  approve(@Body() body: any, @Request() req: any) {
    return this.svc.approve(body, req.user?.userId);
  }

  @Post('reject')
  reject(@Body() body: any, @Request() req: any) {
    return this.svc.reject(body, req.user?.userId);
  }

  @Get('pending')
  getPending(@Query('role') role?: string) {
    return this.svc.getPendingApprovals(role);
  }
}
