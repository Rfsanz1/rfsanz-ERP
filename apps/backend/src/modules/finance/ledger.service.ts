import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class LedgerService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getGeneralLedger(accountId: string, dateFrom?: string, dateTo?: string) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException(`Akun ${accountId} tidak ditemukan`);

    // Saldo awal: semua jurnal POSTED sebelum dateFrom
    const openWhere: any = { accountId, journal: { status: 'POSTED' } };
    if (dateFrom) openWhere.journal.tanggal = { lt: new Date(dateFrom) };

    const openAgg = await this.prisma.journalLine.aggregate({
      where: openWhere,
      _sum: { debit: true, kredit: true },
    });
    const openD = Number(openAgg._sum.debit || 0);
    const openK = Number(openAgg._sum.kredit || 0);
    const openingBalance =
      account.normalBalance === 'DEBIT' ? openD - openK : openK - openD;

    // Mutasi dalam periode
    const mutWhere: any = { accountId, journal: { status: 'POSTED' } };
    if (dateFrom || dateTo) {
      mutWhere.journal.tanggal = {};
      if (dateFrom) mutWhere.journal.tanggal.gte = new Date(dateFrom);
      if (dateTo) mutWhere.journal.tanggal.lte = new Date(dateTo);
    }

    const mutations = await this.prisma.journalLine.findMany({
      where: mutWhere,
      include: { journal: { select: { nomor: true, tanggal: true, deskripsi: true } } },
      orderBy: { journal: { tanggal: 'asc' } },
    });

    let running = openingBalance;
    const lines = mutations.map((m) => {
      const d = Number(m.debit);
      const k = Number(m.kredit);
      running =
        account.normalBalance === 'DEBIT'
          ? running + d - k
          : running - d + k;
      return {
        date: m.journal.tanggal,
        nomor: m.journal.nomor,
        deskripsi: m.deskripsi || m.journal.deskripsi,
        debit: d,
        kredit: k,
        balance: running,
      };
    });

    const totalDebit = mutations.reduce((s, m) => s + Number(m.debit), 0);
    const totalKredit = mutations.reduce((s, m) => s + Number(m.kredit), 0);
    const closingBalance =
      account.normalBalance === 'DEBIT'
        ? openingBalance + totalDebit - totalKredit
        : openingBalance - totalDebit + totalKredit;

    return {
      account: { id: account.id, code: account.code, name: account.name, type: account.type },
      period: { dateFrom, dateTo },
      openingBalance,
      lines,
      totalDebit,
      totalKredit,
      closingBalance,
    };
  }

  async getTrialBalance(dateFrom?: string, dateTo?: string) {
    const accounts = await this.prisma.account.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    const whereDate: any = { journal: { status: 'POSTED' } };
    if (dateFrom || dateTo) {
      whereDate.journal.tanggal = {};
      if (dateFrom) whereDate.journal.tanggal.gte = new Date(dateFrom);
      if (dateTo) whereDate.journal.tanggal.lte = new Date(dateTo);
    }

    const rows = await Promise.all(
      accounts.map(async (acc) => {
        const agg = await this.prisma.journalLine.aggregate({
          where: { ...whereDate, accountId: acc.id },
          _sum: { debit: true, kredit: true },
        });
        const d = Number(agg._sum.debit || 0);
        const k = Number(agg._sum.kredit || 0);
        const balance = acc.normalBalance === 'DEBIT' ? d - k : k - d;
        return {
          accountId: acc.id,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          normalBalance: acc.normalBalance,
          totalDebit: d,
          totalKredit: k,
          balance,
          debitBalance: balance > 0 && acc.normalBalance === 'DEBIT' ? balance : (balance < 0 ? Math.abs(balance) : 0),
          creditBalance: balance > 0 && acc.normalBalance === 'CREDIT' ? balance : (balance < 0 && acc.normalBalance === 'DEBIT' ? Math.abs(balance) : 0),
        };
      }),
    );

    const active = rows.filter((r) => r.totalDebit > 0 || r.totalKredit > 0);
    const totals = active.reduce(
      (acc, r) => ({
        totalDebit: acc.totalDebit + r.totalDebit,
        totalKredit: acc.totalKredit + r.totalKredit,
        totalDebitBalance: acc.totalDebitBalance + r.debitBalance,
        totalCreditBalance: acc.totalCreditBalance + r.creditBalance,
      }),
      { totalDebit: 0, totalKredit: 0, totalDebitBalance: 0, totalCreditBalance: 0 },
    );

    return { period: { dateFrom, dateTo }, accounts: active, totals };
  }
}
