import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class TmsCustomersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tmsCustomer.findMany({ where: { archived: false }, orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const c = await this.prisma.tmsCustomer.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Customer tidak ditemukan');
    return c;
  }

  async create(dto: any) {
    return this.prisma.tmsCustomer.create({ data: dto });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.tmsCustomer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.tmsCustomer.delete({ where: { id } });
    return { success: true };
  }
}
