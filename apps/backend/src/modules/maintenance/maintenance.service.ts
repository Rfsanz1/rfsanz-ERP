import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class MaintenanceService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async generateMrNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.maintenanceRequest.count();
    return `MR/${year}/${String(count + 1).padStart(4, '0')}`;
  }

  async getEquipment(query: any) {
    const { search, category, active = 'true' } = query;
    const where: any = { active: active !== 'false' };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (category) where.category = category;
    return this.prisma.equipment.findMany({ where, include: { _count: { select: { requests: true } } }, orderBy: { name: 'asc' } });
  }

  async createEquipment(dto: any) { return this.prisma.equipment.create({ data: dto }); }
  async updateEquipment(id: string, dto: any) { return this.prisma.equipment.update({ where: { id }, data: dto }); }
  async deactivateEquipment(id: string) { return this.prisma.equipment.update({ where: { id }, data: { active: false } }); }

  async getRequests(query: any) {
    const { status, type, equipmentId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (equipmentId) where.equipmentId = equipmentId;
    const [data, total] = await Promise.all([
      this.prisma.maintenanceRequest.findMany({ where, skip, take: Number(limit), include: { equipment: true }, orderBy: [{ priority: 'desc' }, { requestDate: 'desc' }] }),
      this.prisma.maintenanceRequest.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getRequest(id: string) {
    const r = await this.prisma.maintenanceRequest.findUnique({ where: { id }, include: { equipment: true } });
    if (!r) throw new NotFoundException('Permintaan maintenance tidak ditemukan');
    return r;
  }

  async createRequest(dto: any) {
    const noMr = await this.generateMrNo();
    return this.prisma.maintenanceRequest.create({ data: { ...dto, noMr }, include: { equipment: true } });
  }

  async updateRequest(id: string, dto: any) { return this.prisma.maintenanceRequest.update({ where: { id }, data: dto }); }
  async closeRequest(id: string) { return this.prisma.maintenanceRequest.update({ where: { id }, data: { status: 'done', closedDate: new Date() } }); }

  async getStats() {
    const [total, open, inProgress, done, overdue] = await Promise.all([
      this.prisma.maintenanceRequest.count(),
      this.prisma.maintenanceRequest.count({ where: { status: 'new' } }),
      this.prisma.maintenanceRequest.count({ where: { status: 'in_progress' } }),
      this.prisma.maintenanceRequest.count({ where: { status: 'done' } }),
      this.prisma.maintenanceRequest.count({ where: { status: { notIn: ['done', 'cancelled'] }, scheduledDate: { lt: new Date() } } }),
    ]);
    return { total, open, inProgress, done, overdue };
  }
}
