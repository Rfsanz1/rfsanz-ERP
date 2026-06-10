import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ManufacturingService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async generateMoNo(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.prisma.manufacturingOrder.count();
    return `MO/${year}/${month}/${String(count + 1).padStart(4, '0')}`;
  }

  async getBoms(query: any) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { active: true };
    if (search) where.reference = { contains: search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.billOfMaterial.findMany({ where, skip, take: Number(limit), include: { components: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.billOfMaterial.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getBom(id: string) {
    const bom = await this.prisma.billOfMaterial.findUnique({ where: { id }, include: { components: true } });
    if (!bom) throw new NotFoundException('BoM tidak ditemukan');
    return bom;
  }

  async createBom(dto: any) {
    const { components, ...bomData } = dto;
    return this.prisma.billOfMaterial.create({ data: { ...bomData, components: { create: components ?? [] } }, include: { components: true } });
  }

  async updateBom(id: string, dto: any) { return this.prisma.billOfMaterial.update({ where: { id }, data: dto }); }

  async getWorkCenters() { return this.prisma.workCenter.findMany({ where: { active: true } }); }
  async createWorkCenter(dto: any) { return this.prisma.workCenter.create({ data: dto }); }

  async getOrders(query: any) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.manufacturingOrder.findMany({ where, skip, take: Number(limit), include: { bom: { include: { components: true } }, workOrders: { include: { workCenter: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.manufacturingOrder.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getOrder(id: string) {
    const mo = await this.prisma.manufacturingOrder.findUnique({ where: { id }, include: { bom: { include: { components: true } }, workOrders: { include: { workCenter: true } } } });
    if (!mo) throw new NotFoundException('Manufacturing Order tidak ditemukan');
    return mo;
  }

  async createOrder(dto: any) {
    const noMo = await this.generateMoNo();
    const { workOrders, ...moData } = dto;
    return this.prisma.manufacturingOrder.create({ data: { ...moData, noMo, workOrders: { create: workOrders ?? [] } }, include: { workOrders: true } });
  }

  async confirmOrder(id: string) { return this.prisma.manufacturingOrder.update({ where: { id }, data: { status: 'confirmed' } }); }
  async startOrder(id: string) { return this.prisma.manufacturingOrder.update({ where: { id }, data: { status: 'in_progress' } }); }
  async completeOrder(id: string, qtyProduced: number) { return this.prisma.manufacturingOrder.update({ where: { id }, data: { status: 'done', qtyProduced } }); }

  async getStats() {
    const [total, draft, inProgress, done] = await Promise.all([
      this.prisma.manufacturingOrder.count(),
      this.prisma.manufacturingOrder.count({ where: { status: 'draft' } }),
      this.prisma.manufacturingOrder.count({ where: { status: 'in_progress' } }),
      this.prisma.manufacturingOrder.count({ where: { status: 'done' } }),
    ]);
    return { total, draft, inProgress, done };
  }
}
