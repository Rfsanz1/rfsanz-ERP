import { Controller, Get, Put, Post, Delete, Body, Param, Inject, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(@Inject(SettingsService) private readonly svc: SettingsService) {}

  @Get()
  getAll() {
    return this.svc.getAll();
  }

  @Put()
  update(@Body() dto: Record<string, string>) {
    return this.svc.update(dto);
  }

  // ─── DOCUMENT NUMBERS ───────────────────────────────────────────────────────
  @Get('document-numbers')
  getDocumentNumbers() {
    return this.svc.getDocumentNumbers();
  }

  @Put('document-numbers/:module')
  updateDocumentNumber(@Param('module') module: string, @Body() dto: any) {
    return this.svc.updateDocumentNumber(module, dto);
  }

  // ─── SMTP ───────────────────────────────────────────────────────────────────
  @Get('smtp')
  getSmtp() {
    return this.svc.getSmtp();
  }

  @Put('smtp')
  updateSmtp(@Body() dto: any) {
    return this.svc.updateSmtp(dto);
  }

  @Post('smtp/test')
  testSmtp(@Body() dto: { to: string }) {
    return this.svc.testSmtp(dto.to);
  }

  // ─── FISCAL YEAR ────────────────────────────────────────────────────────────
  @Get('fiscal-year')
  getFiscalYear() {
    return this.svc.getFiscalYear();
  }

  @Put('fiscal-year')
  updateFiscalYear(@Body() dto: { startMonth: number; startYear: number }) {
    return this.svc.updateFiscalYear(dto);
  }

  // ─── COMPANY PROFILE ────────────────────────────────────────────────────────
  @Get('company')
  getCompanyProfile() {
    return this.svc.getCompanyProfile();
  }

  @Put('company')
  updateCompanyProfile(@Body() dto: any) {
    return this.svc.updateCompanyProfile(dto);
  }

  // ─── INVOICE TEMPLATES ──────────────────────────────────────────────────────
  @Get('templates')
  getTemplates() {
    return this.svc.getTemplates();
  }

  @Get('templates/:type')
  getTemplate(@Param('type') type: string) {
    return this.svc.getTemplate(type);
  }

  @Put('templates/:type')
  updateTemplate(@Param('type') type: string, @Body() dto: any) {
    return this.svc.updateTemplate(type, dto);
  }

  // ─── WORKFLOW ───────────────────────────────────────────────────────────────
  @Get('workflow')
  getWorkflow() {
    return this.svc.getWorkflow();
  }

  @Put('workflow')
  updateWorkflow(@Body() dto: any) {
    return this.svc.updateWorkflow(dto);
  }

  // ─── DEFAULT ACCOUNTS ───────────────────────────────────────────────────────
  @Get('default-accounts')
  getDefaultAccounts() {
    return this.svc.getDefaultAccounts();
  }

  @Put('default-accounts')
  updateDefaultAccounts(@Body() dto: any) {
    return this.svc.updateDefaultAccounts(dto);
  }

  // ─── TAXES ──────────────────────────────────────────────────────────────────
  @Get('taxes')
  getTaxes() {
    return this.svc.getTaxes();
  }

  @Post('taxes')
  createTax(@Body() dto: any) {
    return this.svc.createTax(dto);
  }

  @Put('taxes/:id')
  updateTax(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateTax(id, dto);
  }

  @Delete('taxes/:id')
  deleteTax(@Param('id') id: string) {
    return this.svc.deleteTax(id);
  }

  // ─── CURRENCIES ─────────────────────────────────────────────────────────────
  @Get('currencies')
  getCurrencies() {
    return this.svc.getCurrencies();
  }

  @Post('currencies')
  createCurrency(@Body() dto: any) {
    return this.svc.createCurrency(dto);
  }

  @Put('currencies/:id')
  updateCurrency(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateCurrency(id, dto);
  }

  @Delete('currencies/:id')
  deleteCurrency(@Param('id') id: string) {
    return this.svc.deleteCurrency(id);
  }

  @Post('currencies/update-rates')
  updateCurrencyRates() {
    return this.svc.updateCurrencyRates();
  }

  // ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
  @Get('notifications')
  getNotifications() {
    return this.svc.getNotifications();
  }

  @Put('notifications')
  updateNotifications(@Body() dto: any) {
    return this.svc.updateNotifications(dto);
  }
}
