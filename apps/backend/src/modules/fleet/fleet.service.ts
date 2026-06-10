import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class FleetService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getVehicles(query: any) {
    const { search, active = 'true', fuelType } = query;
    const where: any = { active: active !== 'false' };
    if (search) where.OR = [{ licensePlate: { contains: search, mode: 'insensitive' } }, { brand: { contains: search, mode: 'insensitive' } }];
    if (fuelType) where.fuelType = fuelType;
    return this.prisma.vehicle.findMany({ where, include: { _count: { select: { services: true } } }, orderBy: { licensePlate: 'asc' } });
  }

  async getVehicle(id: string) {
    const v = await this.prisma.vehicle.findUnique({ where: { id }, include: { services: { orderBy: { date: 'desc' }, take: 10 } } });
    if (!v) throw new NotFoundException('Kendaraan tidak ditemukan');
    return v;
  }

  async createVehicle(dto: any) { return this.prisma.vehicle.create({ data: dto }); }
  async updateVehicle(id: string, dto: any) { return this.prisma.vehicle.update({ where: { id }, data: dto }); }
  async deactivateVehicle(id: string) { return this.prisma.vehicle.update({ where: { id }, data: { active: false } }); }

  async getServices(query: any) {
    const { vehicleId, type, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (type) where.type = type;
    const [data, total] = await Promise.all([
      this.prisma.vehicleService.findMany({ where, skip, take: Number(limit), include: { vehicle: true }, orderBy: { date: 'desc' } }),
      this.prisma.vehicleService.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async createService(dto: any) { return this.prisma.vehicleService.create({ data: dto, include: { vehicle: true } }); }

  async getStats() {
    const [total, active] = await Promise.all([
      this.prisma.vehicle.count(),
      this.prisma.vehicle.count({ where: { active: true } }),
    ]);
    const overdueServices = await this.prisma.vehicleService.findMany({
      where: { nextService: { lte: new Date() } },
      select: { vehicleId: true },
      distinct: ['vehicleId'],
    });
    const totalCost = await this.prisma.vehicleService.aggregate({ _sum: { cost: true } });
    return { total, active, needService: overdueServices.length, totalServiceCost: totalCost._sum.cost ?? 0 };
  }

  // ─── Delivery Task Methods (Driver App) ────────────────────────────────────

  async getMyDeliveryTasks(currentUser: any) {
    const driverName = currentUser?.name ?? '';
    try {
      const orders = await (this.prisma as any).order.findMany({
        where: {
          OR: [
            { driverName: { contains: driverName, mode: 'insensitive' } },
            { status: { in: ['confirmed', 'picking', 'ready', 'shipping'] } },
          ],
          NOT: { statusPengiriman: { in: ['delivered', 'failed'] } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return orders.map((o: any) => ({
        id: String(o.id),
        soNumber: `SO-${o.id}`,
        customerName: o.namaCustomer,
        phone: o.noHp ?? '',
        address: o.alamat ?? '',
        items: Array.isArray(o.items) ? o.items : [],
        status: this.mapDeliveryStatus(o.statusPengiriman),
        time: new Date(o.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        notes: o.catatan ?? '',
      }));
    } catch {
      return [];
    }
  }

  async getDeliveryTask(id: string) {
    try {
      const o = await (this.prisma as any).order.findUnique({
        where: { id: parseInt(id) },
        include: { orderItems: true },
      });
      if (!o) return null;
      return {
        id: String(o.id),
        soNumber: `SO-${o.id}`,
        customerName: o.namaCustomer,
        phone: o.noHp ?? '',
        address: o.alamat ?? '',
        notes: o.catatan ?? '',
        status: this.mapDeliveryStatus(o.statusPengiriman),
        items: (o.orderItems ?? []).map((item: any) => ({
          name: item.namaBarang ?? item.productName ?? 'Item',
          qty: item.qty ?? item.jumlah ?? 1,
          unit: item.satuan ?? 'pcs',
        })),
      };
    } catch {
      return null;
    }
  }

  async updateDeliveryStatus(id: string, dto: any, currentUser: any) {
    const { status, notes, photo } = dto;
    const statusMap: Record<string, string> = {
      on_the_way: 'shipping',
      arrived: 'arrived',
      delivered: 'delivered',
      failed: 'failed',
    };
    const newStatus = statusMap[status] ?? status;
    try {
      await (this.prisma as any).order.update({
        where: { id: parseInt(id) },
        data: {
          statusPengiriman: newStatus,
          ...(newStatus === 'delivered' && { fotoPengiriman: photo ? 'uploaded' : null }),
          ...(notes && { catatan: notes }),
        },
      });
    } catch {}
    return { success: true, id, status: newStatus };
  }

  async getDeliveryHistory(query: any, currentUser: any) {
    const driverName = currentUser?.name ?? '';
    try {
      const orders = await (this.prisma as any).order.findMany({
        where: {
          OR: [
            { driverName: { contains: driverName, mode: 'insensitive' } },
            { statusPengiriman: { in: ['delivered', 'failed'] } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      });
      return orders.map((o: any) => ({
        id: String(o.id),
        soNumber: `SO-${o.id}`,
        customerName: o.namaCustomer,
        address: o.alamat ?? '',
        items: Array.isArray(o.items) ? o.items.length : 0,
        status: o.statusPengiriman === 'delivered' ? 'delivered' : 'failed',
        date: o.updatedAt?.toISOString()?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      }));
    } catch {
      return [];
    }
  }

  private mapDeliveryStatus(statusPengiriman: string | null): string {
    const map: Record<string, string> = {
      shipping: 'on_the_way',
      arrived: 'arrived',
      delivered: 'delivered',
      failed: 'failed',
    };
    return map[statusPengiriman ?? ''] ?? 'assigned';
  }
}
