import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class DriverAreasService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async findAll() { return this.prisma.driverArea.findMany({ orderBy: { name: 'asc' } }); }
  async update(data: any[]) {
    await this.prisma.driverArea.deleteMany();
    return this.prisma.driverArea.createMany({ data });
  }
}
