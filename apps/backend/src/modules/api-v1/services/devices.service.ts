import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class DevicesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const { status, search } = query;
    const where: any = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { name:      { contains: search, mode: 'insensitive' } },
      { externalId:{ contains: search, mode: 'insensitive' } },
      { displayId: { contains: search, mode: 'insensitive' } },
    ];
    return this.prisma.tmsDevice.findMany({
      where,
      include: { assignments: { where: { active: true }, include: { shipment: { select: { id: true, reference: true } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const d = await this.prisma.tmsDevice.findUnique({
      where: { id },
      include: {
        assignments: { include: { shipment: { select: { id: true, reference: true } } } },
        readings: { take: 50, orderBy: { eventTime: 'desc' } },
      },
    });
    if (!d) throw new NotFoundException('Device tidak ditemukan');
    return d;
  }

  async create(dto: any) {
    return this.prisma.tmsDevice.create({ data: dto });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.tmsDevice.update({ where: { id }, data: { ...dto, lastSeenAt: new Date() } });
  }

  async assign(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.tmsDeviceAssignment.create({ data: { deviceId: id, ...dto } });
  }

  async unassign(id: string) {
    const assignment = await this.prisma.tmsDeviceAssignment.findFirst({ where: { deviceId: id, active: true } });
    if (!assignment) throw new NotFoundException('No active assignment');
    return this.prisma.tmsDeviceAssignment.update({ where: { id: assignment.id }, data: { active: false, unassignedAt: new Date() } });
  }

  async getReadings(id: string, query: any) {
    const limit = Math.min(Number(query.limit || 200), 1000);
    const where: any = { deviceId: id };
    if (query.since) where.eventTime = { gte: new Date(query.since) };
    return this.prisma.tmsSensorReading.findMany({ where, take: limit, orderBy: { eventTime: 'desc' } });
  }
}
