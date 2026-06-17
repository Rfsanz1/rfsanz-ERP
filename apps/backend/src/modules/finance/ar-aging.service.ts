import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

export interface AgingBucket { current: number; d30: number; d60: number; d90: number; over90: number }

@Injectable()
export class ARAgingService {
  constructor(private prisma: PrismaService) {}

  async getARAgingReport(asOfDate?: Date, branchId?: string) {
    const asOf = asOfDate ?? new Date();
    // Gunakan Sale sebagai faktur penjualan — ambil yang belum lunas (status != 'paid'/'lunas')
    const sales = await this.prisma.sale.findMany({
      where: {
        status: { notIn: ['paid', 'lunas', 'cancelled', 'batal'] },
        customer: { isNot: null },
      },
      include: { customer: true },
      orderBy: { tanggal: 'asc' },
    });

    const customerMap = new Map<string, {
      customerId: string; customerName: string;
      creditLimit: number; creditUsed: number;
      buckets: AgingBucket; totalOutstanding: number; invoices: any[];
    }>();

    for (const sale of sales) {
      if (!sale.customerId || !sale.customer) continue;
      const outstanding = Number(sale.grandTotal);
      if (outstanding <= 0) continue;

      // Due date default = tanggal + 30 hari (net 30 terms)
      const dueDate = new Date(sale.tanggal);
      dueDate.setDate(dueDate.getDate() + 30);
      const daysPastDue = Math.floor((asOf.getTime() - dueDate.getTime()) / 86_400_000);

      if (!customerMap.has(sale.customerId)) {
        customerMap.set(sale.customerId, {
          customerId: sale.customerId,
          customerName: sale.customer.name,
          creditLimit: Number(sale.customer.creditLimit),
          creditUsed: Number(sale.customer.creditUsed),
          buckets: { current: 0, d30: 0, d60: 0, d90: 0, over90: 0 },
          totalOutstanding: 0,
          invoices: [],
        });
      }
      const entry = customerMap.get(sale.customerId)!;
      entry.totalOutstanding += outstanding;
      entry.invoices.push({ noFaktur: sale.noFaktur, tanggal: sale.tanggal, dueDate, outstanding, daysPastDue });

      if (daysPastDue <= 0)        entry.buckets.current += outstanding;
      else if (daysPastDue <= 30)  entry.buckets.d30 += outstanding;
      else if (daysPastDue <= 60)  entry.buckets.d60 += outstanding;
      else if (daysPastDue <= 90)  entry.buckets.d90 += outstanding;
      else                          entry.buckets.over90 += outstanding;
    }

    const rows = Array.from(customerMap.values()).map(r => ({
      ...r,
      creditExceeded: r.creditLimit > 0 && r.totalOutstanding > r.creditLimit,
      creditWarning: r.creditLimit > 0 && r.totalOutstanding > r.creditLimit * 0.8,
    }));

    const grandTotal: AgingBucket & { total: number } = {
      current: rows.reduce((s, r) => s + r.buckets.current, 0),
      d30:     rows.reduce((s, r) => s + r.buckets.d30, 0),
      d60:     rows.reduce((s, r) => s + r.buckets.d60, 0),
      d90:     rows.reduce((s, r) => s + r.buckets.d90, 0),
      over90:  rows.reduce((s, r) => s + r.buckets.over90, 0),
      total:   rows.reduce((s, r) => s + r.totalOutstanding, 0),
    };

    return { asOf, rows, grandTotal };
  }
}
