import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class DriverService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async saveLocation(driverId: string, dto: any) {
    await this.prisma.tmsDriverLocation.create({
      data: { driverId, lat: dto.lat, lng: dto.lng, heading: dto.heading, speed: dto.speed, accuracy: dto.accuracy },
    });
    return { saved: true, timestamp: new Date() };
  }

  async getLatestLocation(driverId: string) {
    return this.prisma.tmsDriverLocation.findFirst({ where: { driverId }, orderBy: { timestamp: 'desc' } });
  }

  async getLocationHistory(driverId: string, query: any) {
    const limit = Number(query.limit || 100);
    const where: any = { driverId };
    if (query.from) where.timestamp = { ...where.timestamp, gte: new Date(query.from) };
    if (query.to)   where.timestamp = { ...where.timestamp, lte: new Date(query.to) };
    return this.prisma.tmsDriverLocation.findMany({ where, take: limit, orderBy: { timestamp: 'desc' } });
  }

  async getOrders(driverId: string, query: any) {
    const where: any = { driverName: driverId };
    if (query.status) where.status = query.status;
    const orders = await this.prisma.order.findMany({
      where,
      include: { customer: { select: { id: true, name: true, phone: true } }, orderItems: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o: any) => ({
      ...o,
      pickupAddress: { address: o.alamat, lat: parseFloat(o.lokasiLat ?? '0'), lng: parseFloat(o.lokasiLng ?? '0') },
      deliveryAddress: { address: o.alamat, lat: parseFloat(o.lokasiLat ?? '0'), lng: parseFloat(o.lokasiLng ?? '0') },
      items: o.orderItems.map((i: any) => ({ name: i.nama, quantity: i.qty })),
    }));
  }

  async getOrder(orderId: string) {
    const o = await this.prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { customer: true, orderItems: { include: { product: true } } },
    });
    return o;
  }

  async updateOrderStatus(orderId: string, dto: any) {
    await this.prisma.order.update({ where: { id: parseInt(orderId) }, data: { status: dto.status, statusPengiriman: dto.status } });
    return { updated: true, status: dto.status };
  }

  async createProof(orderId: string, driverId: string, file: Express.Multer.File, dto: any) {
    const photoUrl = `/uploads/${file.filename}`;
    return this.prisma.tmsDeliveryProof.create({
      data: { orderId, driverId, photoUrl, notes: dto.notes, lat: dto.lat ? parseFloat(dto.lat) : null, lng: dto.lng ? parseFloat(dto.lng) : null },
    });
  }

  async getProofs(orderId: string) {
    return this.prisma.tmsDeliveryProof.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' } });
  }

  async getEarnings(driverId: string, query: any) {
    const where: any = { driverId };
    if (query.from) where.date = { ...where.date, gte: new Date(query.from) };
    if (query.to)   where.date = { ...where.date, lte: new Date(query.to) };
    const items = await this.prisma.tmsDriverEarning.findMany({ where, orderBy: { date: 'desc' } });
    const total   = items.reduce((s: number, i: any) => s + i.amount, 0);
    const pending = items.filter((i: any) => i.status === 'pending').reduce((s: number, i: any) => s + i.amount, 0);
    const paid    = items.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + i.amount, 0);
    return { total, pending, paid, items };
  }
}
