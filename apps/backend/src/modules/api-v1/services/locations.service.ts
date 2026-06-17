import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class LocationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const { search, type, archived } = query;
    const where: any = {};
    if (archived !== undefined) where.archived = archived === 'true';
    else where.archived = false;
    if (type) where.locationType = type;
    if (search) where.OR = [
      { name:    { contains: search, mode: 'insensitive' } },
      { city:    { contains: search, mode: 'insensitive' } },
      { country: { contains: search, mode: 'insensitive' } },
    ];
    return this.prisma.tmsLocation.findMany({ where, orderBy: { name: 'asc' } });
  }

  async search(q: string) {
    return this.prisma.tmsLocation.findMany({
      where: {
        archived: false,
        OR: [
          { name:    { contains: q, mode: 'insensitive' } },
          { city:    { contains: q, mode: 'insensitive' } },
          { address1:{ contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const loc = await this.prisma.tmsLocation.findUnique({ where: { id } });
    if (!loc) throw new NotFoundException('Location tidak ditemukan');
    return loc;
  }

  private sanitize(dto: any) {
    const out: any = {};
    // Map common aliases
    const d = { ...dto };
    if (d.address && !d.address1) { d.address1 = d.address; delete d.address; }
    if (d.type && !d.locationType)  { d.locationType = d.type; delete d.type; }
    const allowed = ['name','address1','address2','city','state','postalCode','country',
      'lat','lng','locationType','contactName','contactPhone','contactEmail','archived'];
    for (const k of allowed) if (d[k] !== undefined) out[k] = d[k];
    // address1 required default
    if (!out.address1) out.address1 = '';
    return out;
  }

  async create(dto: any) {
    return this.prisma.tmsLocation.create({ data: this.sanitize(dto) });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.tmsLocation.update({ where: { id }, data: this.sanitize(dto) });
  }

  async archive(id: string) {
    await this.findOne(id);
    await this.prisma.tmsLocation.update({ where: { id }, data: { archived: true } });
    return { id, archived: true };
  }
}
