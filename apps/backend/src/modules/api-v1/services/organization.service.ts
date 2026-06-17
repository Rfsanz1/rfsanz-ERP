import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class OrganizationService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getSettings(orgId = 'default') {
    return this.prisma.tmsOrganizationSettings.upsert({
      where: { orgId },
      update: {},
      create: { orgId, name: 'My Organization', timezone: 'Asia/Jakarta', currency: 'IDR' },
    });
  }

  async updateSettings(dto: any, orgId = 'default') {
    return this.prisma.tmsOrganizationSettings.upsert({
      where: { orgId },
      update: dto,
      create: { orgId, name: dto.name ?? 'My Organization', timezone: dto.timezone ?? 'Asia/Jakarta', currency: dto.currency ?? 'IDR', ...dto },
    });
  }

  async getTheme(orgId = 'default') {
    const t = await this.prisma.tmsTheme.findUnique({ where: { orgId } });
    return { primaryColor: t?.primaryColor ?? null, logoUrl: t?.logoUrl ?? null, themeUpdatedAt: t?.updatedAt ?? null };
  }

  async updateTheme(dto: any, orgId = 'default') {
    return this.prisma.tmsTheme.upsert({
      where: { orgId },
      update: { ...dto, updatedAt: new Date() },
      create: { orgId, ...dto, updatedAt: new Date() },
    });
  }

  async resetTheme(orgId = 'default') {
    await this.prisma.tmsTheme.upsert({
      where: { orgId },
      update: { primaryColor: null, logoUrl: null, updatedAt: new Date() },
      create: { orgId, updatedAt: new Date() },
    });
    return { reset: true };
  }

  async uploadLogo(file: Express.Multer.File, orgId = 'default') {
    const logoUrl = `/uploads/${file.filename}`;
    await this.prisma.tmsTheme.upsert({
      where: { orgId },
      update: { logoUrl, updatedAt: new Date() },
      create: { orgId, logoUrl, updatedAt: new Date() },
    });
    return { logoUrl };
  }

  async removeLogo(orgId = 'default') {
    await this.prisma.tmsTheme.upsert({
      where: { orgId },
      update: { logoUrl: null, updatedAt: new Date() },
      create: { orgId, updatedAt: new Date() },
    });
    return { removed: true };
  }
}
