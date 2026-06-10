import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async getAuditLog(filter: {
    tableName?: string; recordId?: string; actorId?: string;
    action?: string; dateFrom?: string; dateTo?: string;
    branchId?: string; page?: number; limit?: number;
  }) {
    const { tableName, recordId, actorId, action, dateFrom, dateTo, branchId, page = 1, limit = 50 } = filter;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (tableName) where.tableName = { contains: tableName, mode: 'insensitive' };
    if (recordId) where.recordId = recordId;
    if (actorId) where.actorId = actorId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (branchId) where.branchId = branchId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo)   where.createdAt.lte = new Date(dateTo + 'T23:59:59');
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where, skip, take: Number(limit),
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getRecordHistory(tableName: string, recordId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { tableName, recordId },
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return logs.map((log, idx) => ({
      ...log,
      version: idx + 1,
      diff: this.computeDiff(log.oldData as any, log.newData as any),
    }));
  }

  async logActivity(data: {
    actorId?: string; action: string; resource: string;
    tableName?: string; recordId?: string;
    oldData?: any; newData?: any;
    ipAddress?: string; userAgent?: string; branchId?: string;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  private computeDiff(oldData: Record<string, any> | null, newData: Record<string, any> | null) {
    if (!oldData || !newData) return null;
    const changes: Record<string, { from: any; to: any }> = {};
    const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    for (const key of keys) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes[key] = { from: oldData[key], to: newData[key] };
      }
    }
    return Object.keys(changes).length > 0 ? changes : null;
  }
}
