import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class QualityService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getQcps(query: any) {
    const { operation, active } = query;
    const where: any = {};
    if (operation) where.operation = operation;
    if (active !== undefined) where.active = active === 'true';
    return this.prisma.qualityControlPoint.findMany({ where, include: { _count: { select: { checks: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async createQcp(dto: any) { return this.prisma.qualityControlPoint.create({ data: dto }); }
  async updateQcp(id: string, dto: any) { return this.prisma.qualityControlPoint.update({ where: { id }, data: dto }); }

  async getChecks(query: any) {
    const { qcpId, status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (qcpId) where.qcpId = qcpId;
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.qualityCheck.findMany({ where, skip, take: Number(limit), include: { qcp: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.qualityCheck.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async createCheck(dto: any) { return this.prisma.qualityCheck.create({ data: dto, include: { qcp: true } }); }
  async passCheck(id: string, measuredValue?: number) { return this.prisma.qualityCheck.update({ where: { id }, data: { status: 'pass', measuredValue, doneAt: new Date() } }); }
  async failCheck(id: string, notes: string) { return this.prisma.qualityCheck.update({ where: { id }, data: { status: 'fail', notes, doneAt: new Date() } }); }

  async getAlerts(query: any) {
    const { stage, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (stage) where.stage = stage;
    const [data, total] = await Promise.all([
      this.prisma.qualityAlert.findMany({ where, skip, take: Number(limit), orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] }),
      this.prisma.qualityAlert.count({ where }),
    ]);
    return { data, total };
  }

  async createAlert(dto: any) { return this.prisma.qualityAlert.create({ data: dto }); }
  async updateAlert(id: string, dto: any) { return this.prisma.qualityAlert.update({ where: { id }, data: dto }); }

  async getStats() {
    const [totalChecks, passed, failed, pending, totalAlerts] = await Promise.all([
      this.prisma.qualityCheck.count(),
      this.prisma.qualityCheck.count({ where: { status: 'pass' } }),
      this.prisma.qualityCheck.count({ where: { status: 'fail' } }),
      this.prisma.qualityCheck.count({ where: { status: 'todo' } }),
      this.prisma.qualityAlert.count({ where: { stage: { notIn: ['closed'] } } }),
    ]);
    return { totalChecks, passed, failed, pending, totalAlerts };
  }
}
