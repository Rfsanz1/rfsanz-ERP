import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class CreditLimitService {
  constructor(private prisma: PrismaService) {}

  async getCreditLimits(query: any) {
    const { search, page = 1, limit = 50 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { active: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({ where, skip, take: Number(limit), orderBy: { name: 'asc' } }),
      this.prisma.customer.count({ where }),
    ]);

    const enriched = data.map(c => {
      const available = Number(c.creditLimit) > 0 ? Number(c.creditLimit) - Number(c.creditUsed) : null;
      const pctUsed = Number(c.creditLimit) > 0 ? (Number(c.creditUsed) / Number(c.creditLimit)) * 100 : 0;
      return { ...c, available, pctUsed, isExceeded: available !== null && available < 0, isWarning: pctUsed >= 80 };
    });

    return { data: enriched, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async checkCreditLimit(customerId: string, newOrderAmount: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Pelanggan tidak ditemukan');

    const creditUsed = await this.recalcCreditUsed(customerId);
    const total = creditUsed + newOrderAmount;
    const limit = Number(customer.creditLimit);

    return {
      customerId, customerName: customer.name,
      creditLimit: limit, used: creditUsed,
      newOrderAmount, projectedTotal: total,
      available: limit > 0 ? limit - total : null,
      isExceeded: limit > 0 && total > limit,
      warningAt80Pct: limit > 0 && total > limit * 0.8,
    };
  }

  async updateCreditUsed(customerId: string) {
    const creditUsed = await this.recalcCreditUsed(customerId);
    return this.prisma.customer.update({
      where: { id: customerId }, data: { creditUsed },
    });
  }

  async setCreditLimit(customerId: string, creditLimit: number) {
    return this.prisma.customer.update({
      where: { id: customerId }, data: { creditLimit },
    });
  }

  async setBulkCreditLimit(items: { customerId: string; creditLimit: number }[]) {
    const results = await Promise.all(
      items.map(({ customerId, creditLimit }) =>
        this.prisma.customer.update({ where: { id: customerId }, data: { creditLimit } })
      )
    );
    return { updated: results.length };
  }

  private async recalcCreditUsed(customerId: string): Promise<number> {
    const outstanding = await this.prisma.sale.aggregate({
      where: { customerId, status: { notIn: ['paid', 'lunas', 'cancelled', 'batal'] } },
      _sum: { grandTotal: true },
    });
    return Number(outstanding._sum.grandTotal ?? 0);
  }
}
