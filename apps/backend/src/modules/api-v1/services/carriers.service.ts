import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class CarriersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const { search, archived, sortBy = 'name' } = query;
    const where: any = {};
    if (archived !== undefined) where.archived = archived === 'true';
    else where.archived = false;
    if (search) where.OR = [
      { name:          { contains: search, mode: 'insensitive' } },
      { scacCode:      { contains: search, mode: 'insensitive' } },
      { contactName:   { contains: search, mode: 'insensitive' } },
      { contactEmail:  { contains: search, mode: 'insensitive' } },
    ];
    return this.prisma.tmsCarrier.findMany({ where, orderBy: { [sortBy]: 'asc' } });
  }

  async findOne(id: string) {
    const c = await this.prisma.tmsCarrier.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Carrier tidak ditemukan');
    return c;
  }

  private sanitize(dto: any) {
    const allowed = ['name','mcNumber','dotNumber','scacCode','contactName','contactEmail','contactPhone',
      'address1','city','state','postalCode','country','validationTier','registrationChecked',
      'insuranceVerified','identityConfirmed','complianceChecked','validationNotes','validatedAt','archived'];
    const out: any = {};
    for (const k of allowed) if (dto[k] !== undefined) out[k] = dto[k];
    return out;
  }

  async create(dto: any) {
    return this.prisma.tmsCarrier.create({ data: this.sanitize(dto) });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.tmsCarrier.update({ where: { id }, data: this.sanitize(dto) });
  }

  async archive(id: string) {
    await this.findOne(id);
    await this.prisma.tmsCarrier.update({ where: { id }, data: { archived: true } });
    return { id, archived: true };
  }

  async validate(id: string, dto: any) {
    await this.findOne(id);
    const { tier, registrationChecked, insuranceVerified, identityConfirmed, complianceChecked, notes } = dto;
    return this.prisma.tmsCarrier.update({
      where: { id },
      data: {
        validationTier: tier,
        registrationChecked: registrationChecked ?? undefined,
        insuranceVerified: insuranceVerified ?? undefined,
        identityConfirmed: identityConfirmed ?? undefined,
        complianceChecked: complianceChecked ?? undefined,
        validationNotes: notes ?? undefined,
        validatedAt: new Date(),
      },
    });
  }

  async getShipments(id: string) {
    await this.findOne(id);
    return this.prisma.tmsShipment.findMany({
      where: { carrierId: id, archived: false },
      include: { customer: { select: { id: true, name: true } }, origin: { select: { name: true, city: true } }, destination: { select: { name: true, city: true } } },
    });
  }
}
