import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { UpdateContactDto } from './dto/update-contact.dto.js';
import { QueryContactDto } from './dto/query-contact.dto.js';

@Injectable()
export class ContactService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async generateCode(): Promise<string> {
    const last = await this.prisma.contact.findFirst({
      where: { code: { startsWith: 'KON-' } },
      orderBy: { code: 'desc' },
    });
    if (!last) return 'KON-0001';
    const num = parseInt(last.code.replace('KON-', ''), 10);
    return `KON-${String(num + 1).padStart(4, '0')}`;
  }

  async findAll(query: QueryContactDto) {
    const { type, isActive, search, branchId, page = '1', limit = '20' } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (type && type !== 'all') where.type = { has: type };
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (branchId) where.branchId = branchId;

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({ where, skip, take: Number(limit), orderBy: { name: 'asc' } }),
      this.prisma.contact.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException('Kontak tidak ditemukan');
    return contact;
  }

  async create(dto: CreateContactDto) {
    const code = dto.code || (await this.generateCode());
    return this.prisma.contact.create({ data: { ...dto, code } });
  }

  async update(id: string, dto: UpdateContactDto) {
    await this.findOne(id);
    return this.prisma.contact.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.contact.update({ where: { id }, data: { isActive: false } });
  }

  async getTransactions(id: string) {
    await this.findOne(id);
    const contact = await this.prisma.contact.findUnique({ where: { id } });

    const isCustomer = contact?.type.includes('customer') || contact?.type.includes('both');
    const isSupplier = contact?.type.includes('supplier') || contact?.type.includes('both');

    const [invoices, vendorBills] = await Promise.all([
      isCustomer
        ? this.prisma.invoice.findMany({
            where: { customer: { email: contact?.email ?? undefined } },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : Promise.resolve([]),
      isSupplier
        ? this.prisma.vendorBill.findMany({
            where: { supplier: { email: contact?.email ?? undefined } },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : Promise.resolve([]),
    ]);

    return { invoices, vendorBills };
  }

  async getStatement(id: string) {
    await this.findOne(id);
    const contact = await this.prisma.contact.findUnique({ where: { id } });

    const isCustomer = contact?.type.includes('customer') || contact?.type.includes('both');
    const isSupplier = contact?.type.includes('supplier') || contact?.type.includes('both');

    const [invoices, vendorBills] = await Promise.all([
      isCustomer
        ? this.prisma.invoice.findMany({
            where: { customer: { email: contact?.email ?? undefined } },
            orderBy: { tanggal: 'asc' },
          })
        : Promise.resolve([]),
      isSupplier
        ? this.prisma.vendorBill.findMany({
            where: { supplier: { email: contact?.email ?? undefined } },
            orderBy: { createdAt: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    const now = new Date();
    const receivables = invoices.map((inv: any) => {
      const outstanding = Number(inv.grandTotal) - Number(inv.paidAmount ?? 0);
      const daysOverdue = inv.dueDate
        ? Math.max(0, Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000))
        : 0;
      return {
        id: inv.id,
        ref: inv.noInvoice,
        date: inv.tanggal,
        dueDate: inv.dueDate,
        total: Number(inv.grandTotal),
        paid: Number(inv.paidAmount ?? 0),
        outstanding,
        daysOverdue,
        status: inv.status,
      };
    });

    const payables = vendorBills.map((bill: any) => {
      const outstanding = Number(bill.totalAmount);
      const daysOverdue = bill.dueDate
        ? Math.max(0, Math.floor((now.getTime() - new Date(bill.dueDate).getTime()) / 86400000))
        : 0;
      return {
        id: bill.id,
        ref: bill.noBill,
        date: bill.createdAt,
        dueDate: bill.dueDate,
        total: Number(bill.totalAmount),
        paid: 0,
        outstanding,
        daysOverdue,
        status: bill.status,
      };
    });

    const totalReceivable = receivables.reduce((s: number, r: any) => s + r.outstanding, 0);
    const totalPayable = payables.reduce((s: number, p: any) => s + p.outstanding, 0);

    return { receivables, payables, totalReceivable, totalPayable, netBalance: totalReceivable - totalPayable };
  }

  async getBalance(id: string) {
    const stmt = await this.getStatement(id);
    return { totalReceivable: stmt.totalReceivable, totalPayable: stmt.totalPayable, netBalance: stmt.netBalance };
  }

  async getSummary() {
    const [total, active, byType] = await Promise.all([
      this.prisma.contact.count(),
      this.prisma.contact.count({ where: { isActive: true } }),
      this.prisma.contact.groupBy({ by: ['type'], _count: { id: true } }).catch(() => []),
    ]);
    return { total, active, inactive: total - active };
  }
}
