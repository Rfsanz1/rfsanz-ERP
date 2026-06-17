import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class EmailService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getSettings(orgId = 'default') {
    const settings = await this.prisma.tmsEmailSettings.upsert({
      where: { orgId },
      update: {},
      create: { orgId, fromAddress: 'noreply@example.com', fromName: 'ERP System', updatedAt: new Date() },
    });
    const { smtpPassword: _pw, ...safe } = settings as any;
    return safe;
  }

  async updateSettings(dto: any, orgId = 'default') {
    const result = await this.prisma.tmsEmailSettings.upsert({
      where: { orgId },
      update: { ...dto, updatedAt: new Date() },
      create: { orgId, fromAddress: dto.fromAddress ?? 'noreply@example.com', fromName: dto.fromName ?? 'ERP System', ...dto, updatedAt: new Date() },
    });
    const { smtpPassword: _pw, ...safe } = result as any;
    return safe;
  }

  async sendTest(to: string) {
    console.log(`[EMAIL TEST] Sending test email to: ${to}`);
    return { sent: true };
  }

  async findTemplates(orgId = 'default') {
    return this.prisma.tmsEmailTemplate.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
  }

  async createTemplate(dto: any, orgId = 'default') {
    return this.prisma.tmsEmailTemplate.create({ data: { ...dto, orgId } });
  }

  async findTemplate(id: string) {
    const t = await this.prisma.tmsEmailTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Template tidak ditemukan');
    return t;
  }

  async updateTemplate(id: string, dto: any) {
    await this.findTemplate(id);
    return this.prisma.tmsEmailTemplate.update({ where: { id }, data: dto });
  }

  async deleteTemplate(id: string) {
    await this.findTemplate(id);
    await this.prisma.tmsEmailTemplate.delete({ where: { id } });
    return { success: true };
  }

  async findDocumentTemplates(orgId = 'default') {
    return this.prisma.tmsDocumentTemplate.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
  }

  async createDocumentTemplate(dto: any, orgId = 'default') {
    return this.prisma.tmsDocumentTemplate.create({ data: { ...dto, orgId } });
  }

  async updateDocumentTemplate(id: string, dto: any) {
    return this.prisma.tmsDocumentTemplate.update({ where: { id }, data: dto });
  }

  async deleteDocumentTemplate(id: string) {
    await this.prisma.tmsDocumentTemplate.delete({ where: { id } });
    return { success: true };
  }
}
