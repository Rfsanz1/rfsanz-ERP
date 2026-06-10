import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  @Get()                           getLogs(@Query() q: any)                              { return this.svc.getAuditLog(q); }
  @Get('history/:table/:recordId') getHistory(@Param('table') t: string, @Param('recordId') r: string) { return this.svc.getRecordHistory(t, r); }
}
