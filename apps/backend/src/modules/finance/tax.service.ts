import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class TaxService {
  constructor(private readonly prisma: PrismaService) {}

  private buildDateFilter(query: any) {
    const where: any = {};
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }
    return where;
  }

  async getTaxSummary(query: any) {
    const where = this.buildDateFilter(query);
    const lines = await this.prisma.taxLine.findMany({ where, include: { tax: true } });
    const summary: Record<string, any> = {};
    let totalCollected = 0;
    let totalPaid = 0;

    for (const line of lines) {
      const taxType = line.tax?.tipe || 'UNKNOWN';
      const key = `${taxType}:${line.tipe}`;
      if (!summary[key]) {
        summary[key] = {
          taxType,
          lineType: line.tipe,
          taxCode: line.tax?.kode ?? 'N/A',
          taxName: line.tax?.nama ?? 'N/A',
          rate: Number(line.tax?.rate ?? 0),
          baseAmount: 0,
          taxAmount: 0,
          count: 0,
        };
      }
      summary[key].baseAmount += Number(line.baseAmount);
      summary[key].taxAmount += Number(line.taxAmount);
      summary[key].count += 1;

      if (line.tipe === 'COLLECTED') totalCollected += Number(line.taxAmount);
      if (line.tipe === 'PAID') totalPaid += Number(line.taxAmount);
    }

    return {
      period: { dateFrom: query.dateFrom, dateTo: query.dateTo },
      totals: { totalCollected, totalPaid, netTax: totalCollected - totalPaid },
      details: Object.values(summary),
    };
  }

  async getEFakturs(query: any) {
    const { status, search, page = 1, limit = 20, dateFrom, dateTo } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { nomorFaktur: { contains: search, mode: 'insensitive' } },
        { namaPembeli: { contains: search, mode: 'insensitive' } },
        { npwpPembeli: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) {
      where.tanggal = {};
      if (dateFrom) where.tanggal.gte = new Date(dateFrom);
      if (dateTo) where.tanggal.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.eFaktur.findMany({ where, skip, take: Number(limit), orderBy: { tanggal: 'desc' }, include: { tax: true } }),
      this.prisma.eFaktur.count({ where }),
    ]);

    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  private quoteCsv(value: any) {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  async exportEFaktursCsv(query: any) {
    const { data } = await this.getEFakturs({ ...query, page: 1, limit: 10000 });
    const headers = [
      'Nomor Faktur',
      'Tanggal',
      'NPWP Pembeli',
      'Nama Pembeli',
      'Nilai DPP',
      'Nilai PPN',
      'Status',
      'Tax Code',
      'Tax Name',
      'Rate',
    ];
    const rows = data.map((item: any) => [
      item.nomorFaktur,
      item.tanggal.toISOString().split('T')[0],
      item.npwpPembeli,
      item.namaPembeli,
      Number(item.nilaiDPP).toFixed(2),
      Number(item.nilaiPPN).toFixed(2),
      item.status,
      item.tax?.kode ?? '',
      item.tax?.nama ?? '',
      Number(item.tax?.rate ?? 0).toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => this.quoteCsv(cell)).join(','))].join('\n');
    const filename = `efaktur-${new Date().toISOString().slice(0, 10)}.csv`;
    return { buffer: Buffer.from(csv, 'utf-8'), filename };
  }
}
