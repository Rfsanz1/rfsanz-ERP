import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class LeaveService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getLeaveTypes() { return this.prisma.leaveType.findMany({ where: { active: true } }); }
  async createLeaveType(dto: any) { return this.prisma.leaveType.create({ data: dto }); }

  async getAllocations(query: any) {
    const { employeeId, year } = query;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (year) where.year = Number(year);
    return this.prisma.leaveAllocation.findMany({ where, include: { employee: true, leaveType: true }, orderBy: { createdAt: 'desc' } });
  }

  async createAllocation(dto: any) { return this.prisma.leaveAllocation.create({ data: dto, include: { leaveType: true, employee: true } }); }

  async getRequests(query: any) {
    const { employeeId, status, leaveTypeId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    const [data, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({ where, skip, take: Number(limit), include: { employee: true, leaveType: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.leaveRequest.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async createRequest(dto: any) { return this.prisma.leaveRequest.create({ data: dto, include: { leaveType: true, employee: true } }); }

  async approveRequest(id: string, approvedBy: string) {
    return this.prisma.leaveRequest.update({ where: { id }, data: { status: 'validated', approvedBy, approvedAt: new Date() } });
  }

  async refuseRequest(id: string) {
    return this.prisma.leaveRequest.update({ where: { id }, data: { status: 'refused' } });
  }

  async getLeaveBalance(employeeId: string, year: number) {
    const allocations = await this.prisma.leaveAllocation.findMany({ where: { employeeId, year }, include: { leaveType: true } });
    const taken = await this.prisma.leaveRequest.groupBy({
      by: ['leaveTypeId'],
      where: { employeeId, status: 'validated', dateFrom: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
      _sum: { numberOfDays: true },
    });
    return allocations.map(a => ({
      leaveType: a.leaveType.name,
      allocated: Number(a.numberOfDays),
      taken: Number(taken.find(t => t.leaveTypeId === a.leaveTypeId)?._sum.numberOfDays ?? 0),
      remaining: Number(a.numberOfDays) - Number(taken.find(t => t.leaveTypeId === a.leaveTypeId)?._sum.numberOfDays ?? 0),
    }));
  }

  async getStats() {
    const [total, pending, approved] = await Promise.all([
      this.prisma.leaveRequest.count(),
      this.prisma.leaveRequest.count({ where: { status: { in: ['draft', 'confirmed'] } } }),
      this.prisma.leaveRequest.count({ where: { status: 'validated' } }),
    ]);
    return { total, pending, approved };
  }
}
