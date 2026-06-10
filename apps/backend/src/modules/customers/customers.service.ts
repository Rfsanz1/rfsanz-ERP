import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class CustomersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const { search, active, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (active !== undefined) where.active = active === 'true';
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({ where, skip, take: Number(limit), orderBy: { name: 'asc' } }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string) {
    const c = await this.prisma.customer.findUnique({ where: { id }, include: { orders: { take: 10, orderBy: { createdAt: 'desc' } } } });
    if (!c) throw new NotFoundException('Customer tidak ditemukan');
    return c;
  }

  async create(dto: any) { return this.prisma.customer.create({ data: dto }); }
  async update(id: string, dto: any) { return this.prisma.customer.update({ where: { id }, data: dto }); }
  async remove(id: string) { return this.prisma.customer.update({ where: { id }, data: { active: false } }); }

  async getSummary() {
    const [total, active] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { active: true } }),
    ]);
    return { total, active, inactive: total - active };
  }
}
