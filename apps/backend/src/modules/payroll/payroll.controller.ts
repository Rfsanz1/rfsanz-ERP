import { Controller, Get, Inject, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(@Inject(PayrollService) private readonly svc: PayrollService) {}

  // ─── PERIODS ─────────────────────────────────────────────────────────────
  @Get('periods')
  getPeriods(@Query() q: any) { return this.svc.getPeriods(q); }

  @Post('periods')
  createPeriod(@Body() dto: any) { return this.svc.createPeriod(dto); }

  @Post('periods/:id/calculate')
  calculate(@Param('id') id: string) { return this.svc.calculatePayroll(id); }

  @Post('periods/:id/calculate-all')
  calculateAll(@Param('id') id: string) { return this.svc.calculatePayroll(id); }

  @Post('periods/:id/approve')
  approve(@Param('id') id: string) { return this.svc.approvePayroll(id); }

  @Post('periods/:id/process')
  process(@Param('id') id: string) { return this.svc.processPayment(id); }

  // ─── SLIPS ───────────────────────────────────────────────────────────────
  @Get('slips')
  getSlips(@Query() q: any) { return this.svc.getSlips(q); }

  @Get('slips/:id')
  getSlip(@Param('id') id: string) { return this.svc.getSlip(id); }

  // ─── COMPONENTS ──────────────────────────────────────────────────────────
  @Get('components')
  getComponents() { return this.svc.getComponents(); }

  @Post('components')
  createComponent(@Body() dto: any) { return this.svc.createComponent(dto); }

  @Put('components/:id')
  updateComponent(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateComponent(id, dto);
  }

  // ─── BPJS ────────────────────────────────────────────────────────────────
  @Get('bpjs-config/:empId')
  getBPJSConfig(@Param('empId') id: string) { return this.svc.getBPJSConfig(id); }

  @Post('bpjs-config/:empId')
  upsertBPJS(@Param('empId') id: string, @Body() dto: any) { return this.svc.upsertBPJSConfig(id, dto); }

  // ─── REPORTS ─────────────────────────────────────────────────────────────
  @Get('reports/bpjs/:periodId')
  bpjsReport(@Param('periodId') id: string) { return this.svc.getBPJSReport(id); }

  @Get('reports/pph21/:periodId')
  pph21Report(@Param('periodId') id: string) { return this.svc.getPPh21Report(id); }

  @Get('reports/summary/:periodId')
  summaryReport(@Param('periodId') id: string) { return this.svc.getPPh21Report(id); }

  // ─── BANK EXPORT ──────────────────────────────────────────────────────────
  @Get('periods/:id/bank-export')
  bankExport(@Param('id') id: string, @Query('format') format?: string) {
    return this.svc.bankExport(id, format ?? 'csv');
  }

  // ─── SEND EMAIL SLIPS ─────────────────────────────────────────────────────
  @Post('slips/:id/send-email')
  sendSlipEmail(@Param('id') id: string) { return this.svc.sendSlipEmail(id); }

  @Post('periods/:id/send-emails')
  sendAllEmails(@Param('id') id: string) { return this.svc.sendAllSlipEmails(id); }
}
