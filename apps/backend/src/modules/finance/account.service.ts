import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class AccountService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const { type, isActive, search } = query;
    const where: any = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
    return this.prisma.account.findMany({
      where,
      orderBy: { code: 'asc' },
      include: { parent: { select: { id: true, code: true, name: true } } },
    });
  }

  async getTree() {
    const all = await this.prisma.account.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
    const map = new Map<string, any>();
    for (const a of all) map.set(a.id, { ...a, children: [] });
    const roots: any[] = [];
    for (const a of all) {
      if (a.parentId && map.has(a.parentId)) {
        map.get(a.parentId).children.push(map.get(a.id));
      } else if (!a.parentId) {
        roots.push(map.get(a.id));
      }
    }
    return roots;
  }

  async findOne(id: string) {
    const acc = await this.prisma.account.findUnique({
      where: { id },
      include: { parent: true, children: { orderBy: { code: 'asc' } } },
    });
    if (!acc) throw new NotFoundException(`Akun ${id} tidak ditemukan`);
    return acc;
  }

  async create(dto: any) {
    await this.validateKodeUnik(dto.code);
    const normalBalance = ['ASSET', 'EXPENSE'].includes(dto.type) ? 'DEBIT' : 'CREDIT';
    return this.prisma.account.create({ data: { ...dto, normalBalance } });
  }

  async update(id: string, dto: any) {
    if (dto.code) {
      const dup = await this.prisma.account.findFirst({ where: { code: dto.code, NOT: { id } } });
      if (dup) throw new BadRequestException(`Kode akun ${dto.code} sudah digunakan`);
    }
    return this.prisma.account.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const usedLines = await this.prisma.journalLine.count({ where: { accountId: id } });
    if (usedLines > 0) throw new BadRequestException('Akun tidak bisa dihapus — sudah dipakai di jurnal');
    return this.prisma.account.update({ where: { id }, data: { isActive: false } });
  }

  async validateKodeUnik(code: string) {
    const existing = await this.prisma.account.findFirst({ where: { code } });
    if (existing) throw new BadRequestException(`Kode akun ${code} sudah digunakan`);
  }
}
