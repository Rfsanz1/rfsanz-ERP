import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { KledoService } from '../kledo/kledo.service.js';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(KledoService) private readonly kledo: KledoService,
  ) {}

  async findAll(query: any) {
    const { search, active, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (active !== undefined) where.active = active === 'true';
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where, skip, take: Number(limit),
        orderBy: { name: 'asc' },
        select: { id: true, name: true, phone: true, email: true, address: true, kledoId: true, active: true },
      }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string) {
    const c = await this.prisma.customer.findUnique({
      where: { id },
      include: { orders: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!c) throw new NotFoundException('Customer tidak ditemukan');
    return c;
  }

  private async getDefaultTenantId(): Promise<string> {
    const tenant = await this.prisma.tenant.findFirst({ select: { id: true } });
    if (!tenant) throw new Error('Tidak ada tenant di database');
    return tenant.id;
  }

  async create(dto: any) {
    if (!dto.tenantId) {
      dto.tenantId = await this.getDefaultTenantId();
    }
    const customer = await this.prisma.customer.create({ data: dto });
    this.kledo.findOrCreateContact(customer.name, customer.phone ?? undefined)
      .then((kledoId) => {
        if (kledoId && !customer.kledoId) {
          this.prisma.customer.update({ where: { id: customer.id }, data: { kledoId: kledoId.toString() } })
            .catch(() => null);
        }
      })
      .catch((e) => this.logger.warn('Push customer ke Kledo gagal: ' + e.message));
    return customer;
  }

  async update(id: string, dto: any) { return this.prisma.customer.update({ where: { id }, data: dto }); }
  async remove(id: string) { return this.prisma.customer.update({ where: { id }, data: { active: false } }); }

  async findOrCreate(dto: { name: string; phone?: string; email?: string; kledoId?: string }) {
    const { name, phone, email, kledoId } = dto;
    if (!name?.trim()) throw new Error('Nama customer wajib diisi');

    // 1. Cari berdasarkan kledoId jika ada
    if (kledoId) {
      const byKledo = await this.prisma.customer.findUnique({ where: { kledoId } });
      if (byKledo) return byKledo;
    }

    // 2. Cari berdasarkan nama (case-insensitive)
    const byName = await this.prisma.customer.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } },
    });
    if (byName) {
      // Update kledoId jika belum ada
      if (kledoId && !byName.kledoId) {
        return this.prisma.customer.update({ where: { id: byName.id }, data: { kledoId } });
      }
      return byName;
    }

    // 3. Buat customer baru
    const customer = await this.prisma.customer.create({
      data: { name: name.trim(), phone: phone ?? null, email: email ?? null, kledoId: kledoId ?? null },
    });

    // Sync ke Kledo di background jika belum ada kledoId
    if (!kledoId) {
      this.kledo.findOrCreateContact(customer.name, customer.phone ?? undefined)
        .then((id) => {
          if (id) this.prisma.customer.update({ where: { id: customer.id }, data: { kledoId: id.toString() } }).catch(() => null);
        })
        .catch((e) => this.logger.warn('Push customer ke Kledo gagal: ' + e.message));
    }

    return customer;
  }

  async getSummary() {
    const [total, active] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { active: true } }),
    ]);
    return { total, active, inactive: total - active };
  }
}
