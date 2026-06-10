import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class RecruitmentService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getPositions(query: any) {
    const { status, search } = query;
    const where: any = {};
    if (status) where.status = status;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    return this.prisma.jobPosition.findMany({ where, include: { _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async createPosition(dto: any) { return this.prisma.jobPosition.create({ data: dto }); }
  async updatePosition(id: string, dto: any) { return this.prisma.jobPosition.update({ where: { id }, data: dto }); }

  async getApplications(query: any) {
    const { jobId, stage, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (jobId) where.jobId = jobId;
    if (stage) where.stage = stage;
    const [data, total] = await Promise.all([
      this.prisma.jobApplication.findMany({ where, skip, take: Number(limit), include: { job: true }, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] }),
      this.prisma.jobApplication.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getApplication(id: string) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id }, include: { job: true } });
    if (!app) throw new NotFoundException('Lamaran tidak ditemukan');
    return app;
  }

  async createApplication(dto: any) { return this.prisma.jobApplication.create({ data: dto, include: { job: true } }); }
  async updateApplication(id: string, dto: any) { return this.prisma.jobApplication.update({ where: { id }, data: dto, include: { job: true } }); }

  async advanceStage(id: string, stage: string) { return this.prisma.jobApplication.update({ where: { id }, data: { stage } }); }
  async refuseApplication(id: string, reason: string) { return this.prisma.jobApplication.update({ where: { id }, data: { stage: 'refused', refuseReason: reason } }); }

  async getStats() {
    const [totalPositions, openPositions, totalApps] = await Promise.all([
      this.prisma.jobPosition.count(),
      this.prisma.jobPosition.count({ where: { status: 'open' } }),
      this.prisma.jobApplication.count(),
    ]);
    const stageCount = await this.prisma.jobApplication.groupBy({ by: ['stage'], _count: true });
    return { totalPositions, openPositions, totalApps, stageCount };
  }
}
