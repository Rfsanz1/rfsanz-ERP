import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

type BankFormat = 'bca' | 'mandiri' | 'bri' | 'bni' | 'general';

interface ParsedRow {
  tanggal: Date;
  keterangan: string;
  debit: number;
  kredit: number;
  saldo: number;
}

@Injectable()
export class BankReconService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private parseCSV(content: string, format: BankFormat): ParsedRow[] {
    const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const rows: ParsedRow[] = [];

    for (const line of lines) {
      const cols = line.split(',').map((c) => c.replace(/"/g, '').trim());
      if (cols.length < 4) continue;

      let tanggal: Date;
      let keterangan = '';
      let debit = 0;
      let kredit = 0;
      let saldo = 0;

      try {
        if (format === 'bca') {
          const parts = cols[0].split('/');
          tanggal = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          keterangan = cols[1] || '';
          const amt = parseFloat((cols[3] || '0').replace(/\./g, '').replace(',', '.'));
          const type = (cols[4] || '').toUpperCase();
          if (type === 'DB') debit = amt;
          else kredit = amt;
          saldo = parseFloat((cols[5] || '0').replace(/\./g, '').replace(',', '.'));
        } else if (format === 'mandiri') {
          tanggal = new Date(cols[0]);
          keterangan = cols[1] || '';
          debit = parseFloat((cols[2] || '0').replace(/\./g, '').replace(',', '.'));
          kredit = parseFloat((cols[3] || '0').replace(/\./g, '').replace(',', '.'));
          saldo = parseFloat((cols[4] || '0').replace(/\./g, '').replace(',', '.'));
        } else {
          tanggal = new Date(cols[0]);
          keterangan = cols[1] || '';
          debit = parseFloat((cols[2] || '0').replace(/\./g, '').replace(',', '.'));
          kredit = parseFloat((cols[3] || '0').replace(/\./g, '').replace(',', '.'));
          saldo = parseFloat((cols[4] || '0').replace(/\./g, '').replace(',', '.'));
        }

        if (isNaN(tanggal.getTime())) continue;
        rows.push({ tanggal, keterangan, debit, kredit, saldo });
      } catch {
        continue;
      }
    }

    return rows;
  }

  async importMutasi(bankAccountId: string, csvContent: string, format: BankFormat) {
    const bankAccount = await this.prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!bankAccount) throw new BadRequestException('Rekening bank tidak ditemukan');

    const rows = this.parseCSV(csvContent, format);
    if (rows.length === 0) throw new BadRequestException('Tidak ada data valid di file CSV');

    let imported = 0;
    for (const row of rows) {
      const amount = row.debit > 0 ? row.debit : row.kredit;
      const type = row.debit > 0 ? 'out' : 'in';

      await this.prisma.bankTransaction.create({
        data: {
          bankAccountId,
          tanggal: row.tanggal,
          type,
          amount,
          keterangan: row.keterangan,
          referenceId: 'BANK_IMPORT',
        } as any,
      });
      imported++;
    }

    return { imported, message: `Berhasil import ${imported} transaksi` };
  }

  async autoMatch(bankAccountId: string) {
    const unmatched = await this.prisma.bankTransaction.findMany({
      where: { bankAccountId, referenceId: 'BANK_IMPORT' },
    });

    let matched = 0;
    for (const tx of unmatched) {
      const txDate = new Date(tx.tanggal);
      const dateFrom = new Date(txDate);
      dateFrom.setDate(dateFrom.getDate() - 3);
      const dateTo = new Date(txDate);
      dateTo.setDate(dateTo.getDate() + 3);
      const amount = Number(tx.amount);

      const journalLine = await this.prisma.journalLine.findFirst({
        where: {
          debit: tx.type === 'in' ? { gte: amount * 0.99, lte: amount * 1.01 } : undefined,
          kredit: tx.type === 'out' ? { gte: amount * 0.99, lte: amount * 1.01 } : undefined,
          journal: { tanggal: { gte: dateFrom, lte: dateTo }, status: 'POSTED' },
        },
      }).catch(() => null);

      if (journalLine) {
        await this.prisma.bankTransaction.update({
          where: { id: tx.id },
          data: { referenceId: `MATCHED:${journalLine.id}` },
        });
        matched++;
      }
    }

    return { matched, total: unmatched.length, message: `${matched} dari ${unmatched.length} transaksi berhasil dicocokkan` };
  }

  async matchTransaction(id: string, journalLineId: string) {
    return this.prisma.bankTransaction.update({
      where: { id },
      data: { referenceId: `MATCHED:${journalLineId}` },
    });
  }

  async unmatchTransaction(id: string) {
    return this.prisma.bankTransaction.update({
      where: { id },
      data: { referenceId: 'BANK_IMPORT' },
    });
  }

  async getTransactions(bankAccountId: string, status?: string, from?: string, to?: string, page = 1, limit = 20) {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { bankAccountId };

    if (status === 'matched') where.referenceId = { startsWith: 'MATCHED:' };
    else if (status === 'unmatched') where.referenceId = 'BANK_IMPORT';
    else if (status === 'excluded') where.referenceId = 'EXCLUDED';

    if (from || to) {
      where.tanggal = {};
      if (from) where.tanggal.gte = new Date(from);
      if (to) where.tanggal.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.bankTransaction.findMany({
        where, skip, take: Number(limit),
        orderBy: { tanggal: 'desc' },
      }),
      this.prisma.bankTransaction.count({ where }),
    ]);

    return {
      data: data.map((t) => ({
        ...t,
        status: t.referenceId?.startsWith('MATCHED:') ? 'matched'
          : t.referenceId === 'EXCLUDED' ? 'excluded'
          : t.referenceId === 'BANK_IMPORT' ? 'unmatched'
          : 'other',
        amount: Number(t.amount),
      })),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async getReconciliationSummary(bankAccountId: string, from?: string, to?: string) {
    const bankAccount = await this.prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!bankAccount) throw new BadRequestException('Rekening bank tidak ditemukan');

    const where: any = { bankAccountId };
    if (from || to) {
      where.tanggal = {};
      if (from) where.tanggal.gte = new Date(from);
      if (to) where.tanggal.lte = new Date(to);
    }

    const [all, matched, unmatched] = await Promise.all([
      this.prisma.bankTransaction.findMany({ where }),
      this.prisma.bankTransaction.count({ where: { ...where, referenceId: { startsWith: 'MATCHED:' } } }),
      this.prisma.bankTransaction.count({ where: { ...where, referenceId: 'BANK_IMPORT' } }),
    ]);

    const totalIn = all.filter((t) => t.type === 'in').reduce((s, t) => s + Number(t.amount), 0);
    const totalOut = all.filter((t) => t.type === 'out').reduce((s, t) => s + Number(t.amount), 0);
    const saldoBank = Number(bankAccount.balance);
    const saldoBuku = totalIn - totalOut;

    return {
      bankAccount: { id: bankAccount.id, name: bankAccount.accountName, bankName: bankAccount.bankName },
      saldoBuku,
      saldoBank,
      selisih: saldoBank - saldoBuku,
      matchedCount: matched,
      unmatchedCount: unmatched,
      totalTransactions: all.length,
    };
  }
}
