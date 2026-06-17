import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportingService } from './reporting.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('reporting')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('reporting')
export class ReportingController {
  constructor(private readonly svc: ReportingService) {}

  @Get('laba-rugi')
  getLabaRugi(@Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.svc.getLabaRugi(from || '2026-01-01', to || today);
  }

  @Get('neraca')
  getNeraca(@Query('date') date?: string) {
    return this.svc.getNeraca(date);
  }

  @Get('arus-kas')
  getArusKas(@Query('from') from: string, @Query('to') to: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.svc.getArusKas(from || '2026-01-01', to || today);
  }

  @Get('buku-besar')
  getBukuBesar(
    @Query('accountId') accountId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.svc.getBukuBesar(accountId, from, to);
  }

  @Get('trial-balance')
  getTrialBalance(@Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.getTrialBalance(from, to);
  }

  @Get('export')
  async exportReport(
    @Query('report') report: string,
    @Query('format') format: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('date') date?: string,
    @Res() res?: Response,
  ) {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.svc.exportReport(report, format || 'excel', from || '2026-01-01', to || today, date);
    const ext = (format || 'excel') === 'pdf' ? 'pdf' : 'xlsx';
    const ct = ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    res!.setHeader('Content-Type', ct);
    res!.setHeader('Content-Disposition', `attachment; filename="${report}_${from || today}.${ext}"`);
    res!.send(result);
  }
}
