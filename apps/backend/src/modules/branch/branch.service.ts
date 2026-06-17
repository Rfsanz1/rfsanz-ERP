import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  // ─── COMPANY ──────────────────────────────────────────────────────────────
  async getCompanies() {
    return this.prisma.company.findMany({ include: { branches: true }, orderBy: { nama: 'asc' } });
  }

  async getCompany(id: string) {
    const c = await this.prisma.company.findUnique({ where: { id }, include: { branches: true } });
    if (!c) throw new NotFoundException('Perusahaan tidak ditemukan');
    return c;
  }

  async upsertCompany(dto: any) {
    if (dto.id) {
      return this.prisma.company.update({ where: { id: dto.id }, data: dto });
    }
    return this.prisma.company.create({ data: dto });
  }

  // ─── BRANCH ───────────────────────────────────────────────────────────────
  async getBranches(companyId?: string) {
    const where: any = { isActive: true };
    if (companyId) where.companyId = companyId;
    return this.prisma.branch.findMany({ where, include: { company: true }, orderBy: { nama: 'asc' } });
  }

  async getBranch(id: string) {
    const b = await this.prisma.branch.findUnique({ where: { id }, include: { company: true } });
    if (!b) throw new NotFoundException('Cabang tidak ditemukan');
    return b;
  }

  async createBranch(dto: any) {
    return this.prisma.branch.create({ data: dto, include: { company: true } });
  }

  async updateBranch(id: string, dto: any) {
    return this.prisma.branch.update({ where: { id }, data: dto, include: { company: true } });
  }

  async deleteBranch(id: string) {
    return this.prisma.branch.update({ where: { id }, data: { isActive: false } });
  }
}
