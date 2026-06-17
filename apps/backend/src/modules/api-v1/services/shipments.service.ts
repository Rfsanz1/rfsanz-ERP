import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class ShipmentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private shipmentInclude = {
    customer: { select: { id: true, name: true } },
    carrier:  { select: { id: true, name: true } },
    lane:     { select: { id: true, name: true } },
    origin:      { select: { id: true, name: true, city: true, state: true } },
    destination: { select: { id: true, name: true, city: true, state: true } },
  };

  async findAll(query: any) {
    const { status, customerId, carrierId, createdFrom, createdTo, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const where: any = { archived: false };
    if (status)     where.status = status;
    if (customerId) where.customerId = customerId;
    if (carrierId)  where.carrierId = carrierId;
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = new Date(createdFrom);
      if (createdTo)   where.createdAt.lte = new Date(createdTo);
    }
    return this.prisma.tmsShipment.findMany({ where, include: this.shipmentInclude, orderBy: { [sortBy]: sortOrder } });
  }

  async findOne(id: string) {
    const s = await this.prisma.tmsShipment.findUnique({
      where: { id },
      include: {
        ...this.shipmentInclude,
        events: { orderBy: { eventTime: 'desc' } },
        items: true,
        devices: { include: { device: true } },
      },
    });
    if (!s) throw new NotFoundException('Shipment tidak ditemukan');
    return s;
  }

  private sanitizeShipment(dto: any) {
    const allowed = ['reference','status','customerId','laneId','carrierId','originId','destinationId',
      'pickupDate','deliveryDate','pickupWindowStart','pickupWindowEnd','deliveryWindowStart','deliveryWindowEnd',
      'proNumber','shipmentTypeId','archived','currentLat','currentLng'];
    const out: any = {};
    for (const k of allowed) if (dto[k] !== undefined) out[k] = dto[k];
    return out;
  }

  async create(dto: any) {
    let originId = dto.originId;
    let destinationId = dto.destinationId;

    if (!originId && dto.originData) {
      const loc = await this.prisma.tmsLocation.create({ data: { name: dto.originData.name, address1: dto.originData.address1 ?? '', city: dto.originData.city ?? '', country: dto.originData.country ?? '', lat: dto.originData.lat, lng: dto.originData.lng } });
      originId = loc.id;
    }
    if (!destinationId && dto.destinationData) {
      const loc = await this.prisma.tmsLocation.create({ data: { name: dto.destinationData.name, address1: dto.destinationData.address1 ?? '', city: dto.destinationData.city ?? '', country: dto.destinationData.country ?? '', lat: dto.destinationData.lat, lng: dto.destinationData.lng } });
      destinationId = loc.id;
    }

    const reference = dto.reference || `SHP-${Date.now()}`;
    const { items, originData, destinationData, ...rest } = dto;
    const data = this.sanitizeShipment({ ...rest, reference, originId, destinationId });

    const shipment = await this.prisma.tmsShipment.create({
      data,
      include: this.shipmentInclude,
    });

    if (items?.length) {
      await this.prisma.tmsShipmentItem.createMany({
        data: items.map((i: any) => ({ ...i, shipmentId: shipment.id })),
      });
    }
    return this.findOne(shipment.id);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.tmsShipment.update({ where: { id }, data: dto, include: this.shipmentInclude });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.tmsShipment.update({ where: { id }, data: { archived: true } });
    return { id, archived: true };
  }

  async getEvents(id: string) {
    await this.findOne(id);
    return this.prisma.tmsShipmentEvent.findMany({ where: { shipmentId: id }, orderBy: { eventTime: 'desc' } });
  }

  async createEvent(id: string, dto: any, actorId?: string) {
    await this.findOne(id);
    return this.prisma.tmsShipmentEvent.create({ data: { ...dto, shipmentId: id, actorId } });
  }

  async getItems(id: string) {
    await this.findOne(id);
    return this.prisma.tmsShipmentItem.findMany({ where: { shipmentId: id } });
  }

  async createItem(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.tmsShipmentItem.create({ data: { ...dto, shipmentId: id } });
  }

  async getTelemetry(id: string, query: any) {
    await this.findOne(id);
    const limit = Math.min(Number(query.limit || 500), 2000);
    const where: any = { shipmentId: id };
    if (query.since) where.eventTime = { gte: new Date(query.since) };

    const readings = await this.prisma.tmsSensorReading.findMany({
      where, take: limit, orderBy: { eventTime: 'desc' },
      include: { device: { select: { id: true, name: true, displayId: true } } },
    });

    const temps = readings.filter(r => r.temperature !== null).map(r => r.temperature as number);
    const summary = {
      readingCount: readings.length,
      alertCount: readings.filter(r => r.isAlert).length,
      temperature: temps.length ? {
        min: Math.min(...temps), max: Math.max(...temps),
        avg: temps.reduce((a, b) => a + b, 0) / temps.length,
        latest: readings.find(r => r.temperature !== null)?.temperature ?? null,
      } : null,
      latestBattery: readings.find(r => r.batteryLevel !== null)?.batteryLevel ?? null,
      devices: [...new Set(readings.map(r => r.deviceId))],
    };
    return { readings, summary };
  }

  async getComments(id: string) {
    return this.prisma.tmsComment.findMany({ where: { entityType: 'shipment', entityId: id }, orderBy: { createdAt: 'asc' } });
  }

  async createComment(id: string, dto: any, userId: string) {
    await this.findOne(id);
    return this.prisma.tmsComment.create({
      data: { entityType: 'shipment', entityId: id, authorId: userId, authorName: dto.authorName ?? 'User', body: dto.body },
    });
  }

  async getAttachments(id: string) {
    return this.prisma.tmsAttachment.findMany({ where: { entityType: 'shipment', entityId: id } });
  }

  async createAttachment(id: string, file: Express.Multer.File, description: string | undefined, uploadedBy?: string) {
    await this.findOne(id);
    return this.prisma.tmsAttachment.create({
      data: {
        entityType: 'shipment', entityId: id,
        fileName: file.originalname, mimeType: file.mimetype,
        fileSize: file.size, storagePath: file.filename,
        description, uploadedBy,
      },
    });
  }

  async getDevices(id: string) {
    return this.prisma.tmsDeviceAssignment.findMany({
      where: { shipmentId: id, active: true },
      include: { device: true },
    });
  }

  async assignDevice(id: string, deviceId: string) {
    await this.findOne(id);
    await this.prisma.tmsDevice.findUniqueOrThrow({ where: { id: deviceId } });
    return this.prisma.tmsDeviceAssignment.create({ data: { deviceId, shipmentId: id } });
  }

  async unassignDevice(id: string, deviceId: string) {
    const assignment = await this.prisma.tmsDeviceAssignment.findFirst({ where: { shipmentId: id, deviceId, active: true } });
    if (!assignment) throw new NotFoundException('Assignment tidak ditemukan');
    await this.prisma.tmsDeviceAssignment.update({ where: { id: assignment.id }, data: { active: false, unassignedAt: new Date() } });
    return { removed: true };
  }
}
