import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  async getBudgets(query: any) {
    const { fiscalYearId, departemenId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (fiscalYearId) where.fiscalYearId = fiscalYearId;
    if (departemenId) where.departemenId = departemenId;

    const [data, total] = await Promise.all([
      this.prisma.budget.findMany({ where, skip, take: Number(limit), include: { _count: { select: { lines: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.budget.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getBudget(id: string) {
    const b = await this.prisma.budget.findUnique({
      where: { id }, include: { lines: true },
    });
    if (!b) throw new NotFoundException('Budget tidak ditemukan');
    return b;
  }

  async createBudget(dto: any) {
    const { lines, ...budgetData } = dto;
    return this.prisma.budget.create({
      data: { ...budgetData, lines: lines ? { create: lines } : undefined },
      include: { lines: true },
    });
  }

  async updateBudget(id: string, dto: any) {
    const { lines, ...budgetData } = dto;
    const updated = await this.prisma.budget.update({
      where: { id }, data: budgetData,
    });
    if (lines) {
      await this.prisma.budgetLine.deleteMany({ where: { budgetId: id } });
      await this.prisma.budgetLine.createMany({ data: lines.map((l: any) => ({ ...l, budgetId: id })) });
    }
    return this.getBudget(id);
  }

  async approveBudget(id: string) {
    const b = await this.prisma.budget.findUnique({ where: { id } });
    if (!b) throw new NotFoundException('Budget tidak ditemukan');
    if (b.status !== 'DRAFT') throw new BadRequestException('Hanya budget DRAFT yang bisa di-approve');
    return this.prisma.budget.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async getBudgetVsActual(budgetId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId }, include: { lines: true },
    });
    if (!budget) throw new NotFoundException('Budget tidak ditemukan');

    // Dapatkan fiscal year untuk filter tanggal
    const fy = budget.fiscalYearId
      ? await this.prisma.fiscalYear.findUnique({ where: { id: budget.fiscalYearId } })
      : null;

    // Group lines per akun per bulan
    const grouped = new Map<string, Map<number, number>>();
    for (const line of budget.lines) {
      if (!grouped.has(line.accountId)) grouped.set(line.accountId, new Map());
      grouped.get(line.accountId)!.set(line.bulan, Number(line.amount));
    }

    const result: any[] = [];
    for (const [accountId, monthMap] of grouped) {
      const account = await this.prisma.account.findUnique({ where: { id: accountId } });
      if (!account) continue;

      const row: any = { accountId, accountCode: account.code, accountName: account.name, bulanData: {} };
      let totalBudget = 0, totalActual = 0;

      for (let bulan = 1; bulan <= 12; bulan++) {
        const budgeted = monthMap.get(bulan) ?? 0;
        // Hitung actual dari JournalLine bulan tersebut
        const startDate = fy ? new Date(fy.startDate.getFullYear(), bulan - 1, 1) : new Date(new Date().getFullYear(), bulan - 1, 1);
        const endDate   = new Date(startDate.getFullYear(), bulan, 0, 23, 59, 59);

        const actual = await this.prisma.journalLine.aggregate({
          where: {
            accountId,
            journal: { status: 'POSTED', tanggal: { gte: startDate, lte: endDate } },
          },
          _sum: { debit: true, kredit: true },
        });
        const actualAmount = Math.abs(Number(actual._sum.debit ?? 0) - Number(actual._sum.kredit ?? 0));
        const selisih = budgeted - actualAmount;
        const pctSerapan = budgeted > 0 ? Math.round((actualAmount / budgeted) * 100) : 0;

        row.bulanData[bulan] = { budgeted, actual: actualAmount, selisih, pctSerapan };
        totalBudget += budgeted;
        totalActual += actualAmount;
      }
      row.totalBudget = totalBudget;
      row.totalActual = totalActual;
      row.totalSelisih = totalBudget - totalActual;
      row.totalPct = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;
      result.push(row);
    }

    return { budget, rows: result };
  }

  async checkBudgetAvailability(accountId: string, amount: number, bulan: number, tahun: number) {
    const lines = await this.prisma.budgetLine.findMany({
      where: { accountId, bulan, budget: { status: 'APPROVED', fiscalYearId: { not: null } } },
    });
    const budgeted = lines.reduce((s, l) => s + Number(l.amount), 0);

    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate   = new Date(tahun, bulan, 0, 23, 59, 59);
    const actual = await this.prisma.journalLine.aggregate({
      where: { accountId, journal: { status: 'POSTED', tanggal: { gte: startDate, lte: endDate } } },
      _sum: { debit: true },
    });
    const used = Number(actual._sum.debit ?? 0);
    const remaining = budgeted - used;
    const isExceeded = amount > remaining;

    return { budgeted, used, remaining, isExceeded, requestedAmount: amount };
  }
}
