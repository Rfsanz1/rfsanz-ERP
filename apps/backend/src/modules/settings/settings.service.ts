import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class SettingsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getAll() {
    const settings = await this.prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
    return Object.fromEntries(settings.map(s => [s.key, s.value]));
  }

  async update(data: Record<string, string>) {
    const ops = Object.entries(data).map(([key, value]) =>
      this.prisma.appSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
    );
    await Promise.all(ops);
    return this.getAll();
  }

  async get(key: string) {
    const s = await this.prisma.appSetting.findUnique({ where: { key } });
    return s?.value ?? null;
  }

  // ─── DOCUMENT NUMBERS ───────────────────────────────────────────────────────
  async getDocumentNumbers() {
    const configs = await this.prisma.documentNumberConfig.findMany({ orderBy: { docType: 'asc' } });
    return { data: configs, message: 'success' };
  }

  async updateDocumentNumber(docType: string, dto: { prefix?: string; separator?: string; useYear?: boolean; useMonth?: boolean; padLength?: number; lastSeq?: number }) {
    const data = await this.prisma.documentNumberConfig.upsert({
      where: { docType },
      update: dto,
      create: { docType, prefix: dto.prefix ?? '', separator: dto.separator ?? '/', useYear: dto.useYear ?? true, useMonth: dto.useMonth ?? true, padLength: dto.padLength ?? 4, lastSeq: dto.lastSeq ?? 0 },
    });
    return { data, message: 'Konfigurasi nomor dokumen berhasil diupdate' };
  }

  // ─── SMTP ──────────────────────────────────────────────────────────────────
  async getSmtp() {
    const smtp = await this.prisma.smtpSetting.findFirst();
    if (!smtp) return { data: null, message: 'SMTP belum dikonfigurasi' };
    const { password, ...safe } = smtp as any;
    return { data: { ...safe, passwordSet: !!password }, message: 'success' };
  }

  async updateSmtp(dto: { host: string; port: number; username: string; password?: string; fromEmail: string; fromName?: string; secure?: boolean }) {
    const existing = await this.prisma.smtpSetting.findFirst();
    const data = existing
      ? await this.prisma.smtpSetting.update({ where: { id: existing.id }, data: dto })
      : await this.prisma.smtpSetting.create({ data: dto as any });
    const { password, ...safe } = data as any;
    return { data: { ...safe, passwordSet: !!password }, message: 'Pengaturan SMTP berhasil disimpan' };
  }

  async testSmtp(to: string) {
    return { data: null, message: `Email test akan dikirim ke ${to} (fitur segera hadir)` };
  }

  // ─── FISCAL YEAR ────────────────────────────────────────────────────────────
  async getFiscalYear() {
    const start = await this.get('fiscal_year_start_month');
    const year = await this.get('fiscal_year_start_year');
    return {
      data: {
        startMonth: start ? Number(start) : 1,
        startYear: year ? Number(year) : new Date().getFullYear(),
      },
      message: 'success',
    };
  }

  async updateFiscalYear(dto: { startMonth: number; startYear: number }) {
    await this.update({
      fiscal_year_start_month: String(dto.startMonth),
      fiscal_year_start_year: String(dto.startYear),
    });
    return { data: dto, message: 'Tahun fiskal berhasil diupdate' };
  }

  // ─── COMPANY PROFILE ────────────────────────────────────────────────────────
  async getCompanyProfile() {
    let profile = await this.prisma.companyProfile.findFirst();
    if (!profile) {
      profile = await this.prisma.companyProfile.create({
        data: { name: 'Perusahaan Saya' },
      });
    }
    return { data: profile, message: 'success' };
  }

  async updateCompanyProfile(dto: { name?: string; logo?: string; address?: string; phone?: string; email?: string; website?: string; npwp?: string; currency?: string; timezone?: string }) {
    const profile = await this.prisma.companyProfile.findFirst();
    const data = profile
      ? await this.prisma.companyProfile.update({ where: { id: profile.id }, data: dto })
      : await this.prisma.companyProfile.create({ data: { name: 'Perusahaan Saya', ...dto } });
    return { data, message: 'Profil perusahaan berhasil diupdate' };
  }

  // ─── INVOICE TEMPLATES ──────────────────────────────────────────────────────
  async getTemplates() {
    const templates = await this.prisma.invoiceTemplate.findMany({ orderBy: { templateType: 'asc' } });
    return { data: templates, message: 'success' };
  }

  async getTemplate(type: string) {
    let template = await this.prisma.invoiceTemplate.findUnique({ where: { templateType: type } });
    if (!template) {
      template = await this.prisma.invoiceTemplate.create({
        data: { templateType: type },
      });
    }
    return { data: template, message: 'success' };
  }

  async updateTemplate(type: string, dto: any) {
    const data = await this.prisma.invoiceTemplate.upsert({
      where: { templateType: type },
      update: dto,
      create: { templateType: type, ...dto },
    });
    return { data, message: 'Template berhasil diupdate' };
  }

  // ─── WORKFLOW ───────────────────────────────────────────────────────────────
  async getWorkflow() {
    let config = await this.prisma.workflowConfig.findFirst();
    if (!config) {
      config = await this.prisma.workflowConfig.create({ data: {} });
    }
    return { data: config, message: 'success' };
  }

  async updateWorkflow(dto: any) {
    const config = await this.prisma.workflowConfig.findFirst();
    const data = config
      ? await this.prisma.workflowConfig.update({ where: { id: config.id }, data: dto })
      : await this.prisma.workflowConfig.create({ data: dto });
    return { data, message: 'Alur bisnis berhasil diupdate' };
  }

  // ─── DEFAULT ACCOUNTS ───────────────────────────────────────────────────────
  async getDefaultAccounts() {
    let accounts = await this.prisma.defaultAccounts.findFirst();
    if (!accounts) {
      accounts = await this.prisma.defaultAccounts.create({ data: {} });
    }
    return { data: accounts, message: 'success' };
  }

  async updateDefaultAccounts(dto: any) {
    const accounts = await this.prisma.defaultAccounts.findFirst();
    const data = accounts
      ? await this.prisma.defaultAccounts.update({ where: { id: accounts.id }, data: dto })
      : await this.prisma.defaultAccounts.create({ data: dto });
    return { data, message: 'Akun default berhasil diupdate' };
  }

  // ─── TAXES ──────────────────────────────────────────────────────────────────
  async getTaxes() {
    const taxes = await this.prisma.tax.findMany({ where: { isActive: true }, orderBy: { nama: 'asc' } });
    return { data: taxes, message: 'success' };
  }

  async createTax(dto: { kode: string; nama: string; tipe: string; rate: number; accountId?: string }) {
    const data = await this.prisma.tax.create({
      data: { kode: dto.kode, nama: dto.nama, tipe: dto.tipe as any, rate: dto.rate, accountId: dto.accountId },
    });
    return { data, message: 'Pajak berhasil ditambah' };
  }

  async updateTax(id: string, dto: any) {
    const data = await this.prisma.tax.update({ where: { id }, data: dto });
    return { data, message: 'Pajak berhasil diupdate' };
  }

  async deleteTax(id: string) {
    await this.prisma.tax.update({ where: { id }, data: { isActive: false } });
    return { message: 'Pajak berhasil dihapus' };
  }

  // ─── CURRENCIES ─────────────────────────────────────────────────────────────
  async getCurrencies() {
    const currencies = await this.prisma.currency.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
    return { data: currencies, message: 'success' };
  }

  async createCurrency(dto: { code: string; name: string; symbol: string; rate?: number; isDefault?: boolean }) {
    const data = await this.prisma.currency.create({
      data: { code: dto.code, name: dto.name, symbol: dto.symbol, rate: dto.rate ?? 1, isDefault: dto.isDefault ?? false },
    });
    return { data, message: 'Mata uang berhasil ditambah' };
  }

  async updateCurrency(id: string, dto: any) {
    const data = await this.prisma.currency.update({ where: { id }, data: dto });
    return { data, message: 'Mata uang berhasil diupdate' };
  }

  async deleteCurrency(id: string) {
    await this.prisma.currency.update({ where: { id }, data: { isActive: false } });
    return { message: 'Mata uang berhasil dihapus' };
  }

  async updateCurrencyRates() {
    // TODO: Implement API call to fixer.io or similar
    return { message: 'Kurs berhasil diupdate (fitur segera hadir)' };
  }

  // ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
  async getNotifications() {
    let config = await this.prisma.notificationConfig.findFirst();
    if (!config) {
      config = await this.prisma.notificationConfig.create({ data: {} });
    }
    return { data: config, message: 'success' };
  }

  async updateNotifications(dto: any) {
    const config = await this.prisma.notificationConfig.findFirst();
    const data = config
      ? await this.prisma.notificationConfig.update({ where: { id: config.id }, data: dto })
      : await this.prisma.notificationConfig.create({ data: dto });
    return { data, message: 'Konfigurasi notifikasi berhasil diupdate' };
  }
}
