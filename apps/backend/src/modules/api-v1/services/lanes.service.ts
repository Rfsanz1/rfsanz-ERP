import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class LanesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private laneInclude = {
    origin:       { select: { id: true, name: true, city: true, state: true } },
    destination:  { select: { id: true, name: true, city: true, state: true } },
    stops:        { include: { location: true }, orderBy: { order: 'asc' as const } },
    laneCarriers: { include: { carrier: { select: { id: true, name: true } } } },
    customerLanes:{ include: { customer: { select: { id: true, name: true } } } },
  };

  async findAll(query: any) {
    const { status = 'active', archived } = query;
    const where: any = { status };
    if (archived !== undefined) where.archived = archived === 'true';
    else where.archived = false;
    return this.prisma.tmsLane.findMany({ where, include: { origin: { select: { id: true, name: true, city: true } }, destination: { select: { id: true, name: true, city: true } } }, orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const lane = await this.prisma.tmsLane.findUnique({ where: { id }, include: this.laneInclude });
    if (!lane) throw new NotFoundException('Lane tidak ditemukan');
    return lane;
  }

  async create(dto: any) {
    const { stops, originId, destinationId, ...rest } = dto;
    const origin      = await this.prisma.tmsLocation.findUnique({ where: { id: originId } });
    const destination = await this.prisma.tmsLocation.findUnique({ where: { id: destinationId } });
    if (!origin || !destination) throw new NotFoundException('Origin atau destination tidak ditemukan');
    const name = `${origin.city} → ${destination.city}`;
    const lane = await this.prisma.tmsLane.create({ data: { ...rest, name, originId, destinationId } });
    if (stops?.length) {
      await this.prisma.tmsLaneStop.createMany({ data: stops.map((s: any) => ({ ...s, laneId: lane.id })) });
    }
    return this.findOne(lane.id);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.tmsLane.update({ where: { id }, data: dto, include: this.laneInclude });
  }

  async archive(id: string) {
    await this.findOne(id);
    await this.prisma.tmsLane.update({ where: { id }, data: { archived: true } });
    return { id, archived: true };
  }

  async addCarrier(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.tmsLaneCarrier.create({ data: { laneId: id, ...dto } });
  }

  async updateCarrier(id: string, carrierId: string, dto: any) {
    const lc = await this.prisma.tmsLaneCarrier.findUnique({ where: { laneId_carrierId: { laneId: id, carrierId } } });
    if (!lc) throw new NotFoundException('Carrier tidak ada di lane ini');
    return this.prisma.tmsLaneCarrier.update({ where: { laneId_carrierId: { laneId: id, carrierId } }, data: dto });
  }

  async assignCarrier(id: string, carrierId: string) {
    await this.prisma.tmsLaneCarrier.updateMany({ where: { laneId: id }, data: { assigned: false } });
    const lc = await this.prisma.tmsLaneCarrier.findUnique({ where: { laneId_carrierId: { laneId: id, carrierId } } });
    if (!lc) throw new NotFoundException('Carrier tidak ada di lane ini');
    return this.prisma.tmsLaneCarrier.update({ where: { laneId_carrierId: { laneId: id, carrierId } }, data: { assigned: true } });
  }

  async removeCarrier(id: string, carrierId: string) {
    const lc = await this.prisma.tmsLaneCarrier.findUnique({ where: { laneId_carrierId: { laneId: id, carrierId } } });
    if (!lc) throw new NotFoundException('Carrier tidak ada di lane ini');
    await this.prisma.tmsLaneCarrier.delete({ where: { laneId_carrierId: { laneId: id, carrierId } } });
    return { message: 'Carrier removed from lane' };
  }

  async addCustomer(id: string, customerId: string) {
    await this.findOne(id);
    return this.prisma.tmsCustomerLane.upsert({
      where: { laneId_customerId: { laneId: id, customerId } },
      update: {},
      create: { laneId: id, customerId },
    });
  }

  async removeCustomer(id: string, customerId: string) {
    const cl = await this.prisma.tmsCustomerLane.findUnique({ where: { laneId_customerId: { laneId: id, customerId } } });
    if (!cl) throw new NotFoundException('Customer tidak ada di lane ini');
    await this.prisma.tmsCustomerLane.delete({ where: { laneId_customerId: { laneId: id, customerId } } });
    return { message: 'Customer removed from lane' };
  }
}
