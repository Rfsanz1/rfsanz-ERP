import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class APAgingService {
  constructor(private prisma: PrismaService) {}

  async getAPAgingReport(asOfDate?: Date, branchId?: string) {
    const asOf = asOfDate ?? new Date();
    const pos = await this.prisma.purchaseOrder.findMany({
      where: { status: { notIn: ['cancelled', 'batal', 'paid'] } },
      include: { supplier: true },
      orderBy: { tanggal: 'asc' },
    });

    const supplierMap = new Map<string, {
      supplierId: string; supplierName: string;
      buckets: { current: number; d30: number; d60: number; d90: number; over90: number };
      totalOutstanding: number;
      upcomingPayments: { noPo: string; amount: number; dueDate: Date; daysUntilDue: number }[];
    }>();

    const in30Days = new Date(asOf.getTime() + 30 * 86_400_000);

    for (const po of pos) {
      if (!po.supplierId) continue;
      const outstanding = Number(po.totalHarga);
      if (outstanding <= 0) continue;

      const dueDate = po.tanggalKirim ? new Date(po.tanggalKirim) : new Date(po.tanggal);
      dueDate.setDate(dueDate.getDate() + 30);
      const daysPastDue = Math.floor((asOf.getTime() - dueDate.getTime()) / 86_400_000);

      if (!supplierMap.has(po.supplierId)) {
        supplierMap.set(po.supplierId, {
          supplierId: po.supplierId,
          supplierName: po.supplier.name,
          buckets: { current: 0, d30: 0, d60: 0, d90: 0, over90: 0 },
          totalOutstanding: 0,
          upcomingPayments: [],
        });
      }
      const entry = supplierMap.get(po.supplierId)!;
      entry.totalOutstanding += outstanding;

      if (daysPastDue <= 0 && dueDate <= in30Days) {
        const daysUntilDue = Math.floor((dueDate.getTime() - asOf.getTime()) / 86_400_000);
        entry.upcomingPayments.push({ noPo: po.noPo, amount: outstanding, dueDate, daysUntilDue });
      }

      if (daysPastDue <= 0)        entry.buckets.current += outstanding;
      else if (daysPastDue <= 30)  entry.buckets.d30 += outstanding;
      else if (daysPastDue <= 60)  entry.buckets.d60 += outstanding;
      else if (daysPastDue <= 90)  entry.buckets.d90 += outstanding;
      else                          entry.buckets.over90 += outstanding;
    }

    const rows = Array.from(supplierMap.values());
    const grandTotal = {
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
