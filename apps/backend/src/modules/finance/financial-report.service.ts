import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class FinancialReportService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async getBalancesUpTo(dateTo?: string): Promise<Map<string, number>> {
    const accounts = await this.prisma.account.findMany({ where: { isActive: true } });
    const where: any = { journal: { status: 'POSTED' } };
    if (dateTo) where.journal.tanggal = { lte: new Date(dateTo) };
    return this._buildMap(accounts, where);
  }

  private async getBalancesInPeriod(dateFrom: string, dateTo: string): Promise<Map<string, number>> {
    const accounts = await this.prisma.account.findMany({ where: { isActive: true } });
    const where: any = { journal: { status: 'POSTED' } };
    const tanggal: any = {};
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!isNaN(d.getTime())) tanggal.gte = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      if (!isNaN(d.getTime())) tanggal.lte = d;
    }
    if (Object.keys(tanggal).length > 0) where.journal.tanggal = tanggal;
    return this._buildMap(accounts, where);
  }

  private async _buildMap(accounts: any[], where: any): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    const results = await Promise.all(
      accounts.map((acc) =>
        this.prisma.journalLine
          .aggregate({ where: { ...where, accountId: acc.id }, _sum: { debit: true, kredit: true } })
          .then((agg) => ({
            id: acc.id,
            normalBalance: acc.normalBalance,
            d: Number(agg._sum.debit || 0),
            k: Number(agg._sum.kredit || 0),
          })),
      ),
    );
    for (const r of results) {
      map.set(r.id, r.normalBalance === 'DEBIT' ? r.d - r.k : r.k - r.d);
    }
    return map;
  }

  private groupByType(accounts: any[], balances: Map<string, number>) {
    return accounts.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
      balance: balances.get(a.id) || 0,
    }));
  }

  async getBalanceSheet(date?: string) {
    const dateTo = date || new Date().toISOString().split('T')[0];
    const balances = await this.getBalancesUpTo(dateTo);

    const [assets, liabilities, equities] = await Promise.all([
      this.prisma.account.findMany({ where: { type: 'ASSET', isActive: true }, orderBy: { code: 'asc' } }),
      this.prisma.account.findMany({ where: { type: 'LIABILITY', isActive: true }, orderBy: { code: 'asc' } }),
      this.prisma.account.findMany({ where: { type: 'EQUITY', isActive: true }, orderBy: { code: 'asc' } }),
    ]);

    const aList = this.groupByType(assets, balances);
    const lList = this.groupByType(liabilities, balances);
    const eList = this.groupByType(equities, balances);

    const totalAssets = aList.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = lList.reduce((s, a) => s + a.balance, 0);
    const totalEquity = eList.reduce((s, a) => s + a.balance, 0);

    return {
      date: dateTo,
      assets: { items: aList, total: totalAssets },
      liabilities: { items: lList, total: totalLiabilities },
      equity: { items: eList, total: totalEquity },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1,
    };
  }

  async getIncomeStatement(dateFrom: string, dateTo: string, compare = false) {
    const balances = await this.getBalancesInPeriod(dateFrom, dateTo);

    const [revenues, allExpenses] = await Promise.all([
      this.prisma.account.findMany({ where: { type: 'REVENUE', isActive: true }, orderBy: { code: 'asc' } }),
      this.prisma.account.findMany({ where: { type: 'EXPENSE', isActive: true }, orderBy: { code: 'asc' } }),
    ]);

    const revenueItems = this.groupByType(revenues, balances);
    const expenseItems = this.groupByType(allExpenses, balances);

    const hppItems = expenseItems.filter((e) => e.code.startsWith('5'));
    const opexItems = expenseItems.filter((e) => e.code.startsWith('6'));
    const otherExpItems = expenseItems.filter((e) => e.code.startsWith('7'));

    const totalRevenue = revenueItems.reduce((s, a) => s + a.balance, 0);
    const totalHPP = hppItems.reduce((s, a) => s + a.balance, 0);
    const grossProfit = totalRevenue - totalHPP;
    const totalOpex = opexItems.reduce((s, a) => s + a.balance, 0);
    const totalOtherExp = otherExpItems.reduce((s, a) => s + a.balance, 0);
    const netIncome = grossProfit - totalOpex - totalOtherExp;

    const result: any = {
      period: { dateFrom, dateTo },
      revenues: { items: revenueItems, total: totalRevenue },
      hpp: { items: hppItems, total: totalHPP },
      grossProfit,
      operationalExpenses: { items: opexItems, total: totalOpex },
      otherExpenses: { items: otherExpItems, total: totalOtherExp },
      netIncome,
    };

    if (compare && dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const diff = to.getTime() - from.getTime();
      const prevTo = new Date(from.getTime() - 1);
      const prevFrom = new Date(prevTo.getTime() - diff);
      const prevFromStr = prevFrom.toISOString().slice(0, 10);
      const prevToStr = prevTo.toISOString().slice(0, 10);

      const prevBalances = await this.getBalancesInPeriod(prevFromStr, prevToStr);

      const revenueItemsPrev = this.groupByType(revenues, prevBalances);
      const expenseItemsPrev = this.groupByType(allExpenses, prevBalances);
      const hppItemsPrev = expenseItemsPrev.filter((e) => e.code.startsWith('5'));
      const opexItemsPrev = expenseItemsPrev.filter((e) => e.code.startsWith('6'));
      const otherExpItemsPrev = expenseItemsPrev.filter((e) => e.code.startsWith('7'));

      const totalRevenuePrev = revenueItemsPrev.reduce((s, a) => s + a.balance, 0);
      const totalHppPrev = hppItemsPrev.reduce((s, a) => s + a.balance, 0);
      const grossProfitPrev = totalRevenuePrev - totalHppPrev;
      const totalOpexPrev = opexItemsPrev.reduce((s, a) => s + a.balance, 0);
      const totalOtherExpPrev = otherExpItemsPrev.reduce((s, a) => s + a.balance, 0);
      const netIncomePrev = grossProfitPrev - totalOpexPrev - totalOtherExpPrev;

      result.previous = {
        period: { dateFrom: prevFromStr, dateTo: prevToStr },
        revenues: { items: revenueItemsPrev, total: totalRevenuePrev },
        hpp: { items: hppItemsPrev, total: totalHppPrev },
        grossProfit: grossProfitPrev,
        operationalExpenses: { items: opexItemsPrev, total: totalOpexPrev },
        otherExpenses: { items: otherExpItemsPrev, total: totalOtherExpPrev },
        netIncome: netIncomePrev,
      };
    }

    return result;
  }

  async getStatementOfEquity(dateFrom: string, dateTo: string) {
    const balanceSheet = await this.getBalanceSheet(dateTo);
    const incomeStatement = await this.getIncomeStatement(dateFrom, dateTo);
    return {
      period: { dateFrom, dateTo },
      equity: balanceSheet.equity,
      netIncome: incomeStatement.netIncome,
      beginningEquity: balanceSheet.equity.total - incomeStatement.netIncome,
      endingEquity: balanceSheet.equity.total,
    };
  }

  async getExecutiveSummary(dateFrom: string, dateTo: string) {
    const balanceSheet = await this.getBalanceSheet(dateTo);
    const incomeStatement = await this.getIncomeStatement(dateFrom, dateTo);
    const cashFlow = await this.getCashFlow(dateFrom, dateTo);
    return {
      period: { dateFrom, dateTo },
      balanceSheet,
      incomeStatement,
      cashFlow,
      metrics: {
        totalAssets: balanceSheet.assets.total,
        totalLiabilities: balanceSheet.liabilities.total,
        totalEquity: balanceSheet.equity.total,
        netIncome: incomeStatement.netIncome,
        cashFlow: cashFlow.netCashFlow,
      },
    };
  }

  private async bufferFromPdf(doc: any) {
    return new Promise<Buffer>((resolve, reject) => {
      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      doc.end();
    });
  }

  private renderTableToSheet(sheet: ExcelJS.Worksheet, rows: any[][]) {
    rows.forEach((row) => sheet.addRow(row));
    sheet.columns?.forEach((column) => {
      if (column && column.width === undefined) column.width = 20;
    });
  }

  private async exportAsExcel(reportType: string, payload: any) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(reportType.replace(/\s+/g, '_'));
    sheet.addRow([reportType.toUpperCase()]);
    sheet.addRow([]);

    if (reportType === 'Balance Sheet') {
      sheet.addRow(['Date', payload.date]);
      sheet.addRow([]);
      sheet.addRow(['Assets']);
      this.renderTableToSheet(sheet, [['Code', 'Name', 'Balance'], ...payload.assets.items.map((item: any) => [item.code, item.name, item.balance])]);
      sheet.addRow(['Total Assets', payload.assets.total]);
      sheet.addRow([]);
      sheet.addRow(['Liabilities']);
      this.renderTableToSheet(sheet, [['Code', 'Name', 'Balance'], ...payload.liabilities.items.map((item: any) => [item.code, item.name, item.balance])]);
      sheet.addRow(['Total Liabilities', payload.liabilities.total]);
      sheet.addRow([]);
      sheet.addRow(['Equity']);
      this.renderTableToSheet(sheet, [['Code', 'Name', 'Balance'], ...payload.equity.items.map((item: any) => [item.code, item.name, item.balance])]);
      sheet.addRow(['Total Equity', payload.equity.total]);
    } else if (reportType === 'Income Statement') {
      sheet.addRow(['Period', `${payload.period.dateFrom} - ${payload.period.dateTo}`]);
      sheet.addRow([]);
      sheet.addRow(['Revenues']);
      this.renderTableToSheet(sheet, [['Code', 'Name', 'Amount'], ...payload.revenues.items.map((item: any) => [item.code, item.name, item.balance])]);
      sheet.addRow(['Total Revenue', payload.revenues.total]);
      sheet.addRow([]);
      sheet.addRow(['HPP']);
      this.renderTableToSheet(sheet, [['Code', 'Name', 'Amount'], ...payload.hpp.items.map((item: any) => [item.code, item.name, item.balance])]);
      sheet.addRow(['Total HPP', payload.hpp.total]);
      sheet.addRow([]);
      sheet.addRow(['Operational Expenses']);
      this.renderTableToSheet(sheet, [['Code', 'Name', 'Amount'], ...payload.operationalExpenses.items.map((item: any) => [item.code, item.name, item.balance])]);
      sheet.addRow(['Total Operational Expenses', payload.operationalExpenses.total]);
      sheet.addRow([]);
      sheet.addRow(['Net Income', payload.netIncome]);
    } else if (reportType === 'Cash Flow') {
      sheet.addRow(['Period', `${payload.period.dateFrom} - ${payload.period.dateTo}`]);
      sheet.addRow([]);
      sheet.addRow(['Operating']);
      this.renderTableToSheet(sheet, [
        ['Description', 'Amount'],
        ['Net Income', payload.operating.netIncome],
        ['Perubahan Piutang', payload.operating.adjustments.perubahanPiutang],
        ['Perubahan Persediaan', payload.operating.adjustments.perubahanPersediaan],
        ['Perubahan Hutang Dagang', payload.operating.adjustments.perubahanHutangDagang],
        ['Total Operating', payload.operating.total],
      ]);
      sheet.addRow([]);
      sheet.addRow(['Investing', payload.investing.total]);
      sheet.addRow(['Financing', payload.financing.total]);
      sheet.addRow(['Net Cash Flow', payload.netCashFlow]);
    } else if (reportType === 'Statement of Equity') {
      sheet.addRow(['Period', `${payload.period.dateFrom} - ${payload.period.dateTo}`]);
      sheet.addRow([]);
      sheet.addRow(['Equity Accounts']);
      this.renderTableToSheet(sheet, [['Code', 'Name', 'Amount'], ...payload.equity.items.map((item: any) => [item.code, item.name, item.balance])]);
      sheet.addRow([]);
      sheet.addRow(['Beginning Equity', payload.beginningEquity]);
      sheet.addRow(['Net Income', payload.netIncome]);
      sheet.addRow(['Ending Equity', payload.endingEquity]);
    } else if (reportType === 'Executive Summary') {
      sheet.addRow(['Period', `${payload.period.dateFrom} - ${payload.period.dateTo}`]);
      sheet.addRow([]);
      sheet.addRow(['Total Assets', payload.metrics.totalAssets]);
      sheet.addRow(['Total Liabilities', payload.metrics.totalLiabilities]);
      sheet.addRow(['Total Equity', payload.metrics.totalEquity]);
      sheet.addRow(['Net Income', payload.metrics.netIncome]);
      sheet.addRow(['Net Cash Flow', payload.metrics.cashFlow]);
    }

    return workbook.xlsx.writeBuffer();
  }

  private async exportAsPdf(reportType: string, payload: any) {
    const doc = new PDFDocument({ margin: 36 });
    doc.fontSize(16).text(reportType, { underline: true });
    doc.moveDown();
    if (reportType === 'Balance Sheet') {
      doc.fontSize(12).text(`Date: ${payload.date}`);
      doc.moveDown();
      const writeSection = (title: string, section: any) => {
        doc.fontSize(12).text(title);
        section.items.forEach((item: any) => {
          doc.fontSize(10).text(`- ${item.code} ${item.name}: ${item.balance}`);
        });
        doc.fontSize(10).text(`Total: ${section.total}`);
        doc.moveDown();
      };
      writeSection('Assets', payload.assets);
      writeSection('Liabilities', payload.liabilities);
      writeSection('Equity', payload.equity);
    } else if (reportType === 'Income Statement') {
      doc.fontSize(12).text(`Period: ${payload.period.dateFrom} - ${payload.period.dateTo}`);
      doc.moveDown();
      const section = (label: string, items: any[]) => {
        doc.fontSize(12).text(label);
        items.forEach((item: any) => doc.fontSize(10).text(`- ${item.code} ${item.name}: ${item.balance}`));
        doc.moveDown();
      };
      section('Revenues', payload.revenues.items);
      doc.fontSize(10).text(`Total Revenue: ${payload.revenues.total}`);
      doc.moveDown();
      section('HPP', payload.hpp.items);
      doc.fontSize(10).text(`Total HPP: ${payload.hpp.total}`);
      doc.moveDown();
      section('Operational Expenses', payload.operationalExpenses.items);
      doc.fontSize(10).text(`Total Operational Expenses: ${payload.operationalExpenses.total}`);
      doc.moveDown();
      doc.fontSize(12).text(`Net Income: ${payload.netIncome}`);
    } else if (reportType === 'Cash Flow') {
      doc.fontSize(12).text(`Period: ${payload.period.dateFrom} - ${payload.period.dateTo}`);
      doc.moveDown();
      doc.fontSize(12).text('Operating');
      Object.entries(payload.operating.adjustments).forEach(([key, value]) => {
        doc.fontSize(10).text(`- ${key}: ${value}`);
      });
      doc.fontSize(10).text(`Total Operating: ${payload.operating.total}`);
      doc.moveDown();
      doc.fontSize(12).text(`Investing: ${payload.investing.total}`);
      doc.fontSize(12).text(`Financing: ${payload.financing.total}`);
      doc.fontSize(12).text(`Net Cash Flow: ${payload.netCashFlow}`);
    } else if (reportType === 'Statement of Equity') {
      doc.fontSize(12).text(`Period: ${payload.period.dateFrom} - ${payload.period.dateTo}`);
      doc.moveDown();
      payload.equity.items.forEach((item: any) => doc.fontSize(10).text(`- ${item.code} ${item.name}: ${item.balance}`));
      doc.moveDown();
      doc.fontSize(12).text(`Beginning Equity: ${payload.beginningEquity}`);
      doc.fontSize(12).text(`Net Income: ${payload.netIncome}`);
      doc.fontSize(12).text(`Ending Equity: ${payload.endingEquity}`);
    } else if (reportType === 'Executive Summary') {
      doc.fontSize(12).text(`Period: ${payload.period.dateFrom} - ${payload.period.dateTo}`);
      doc.moveDown();
      doc.fontSize(12).text(`Total Assets: ${payload.metrics.totalAssets}`);
      doc.fontSize(12).text(`Total Liabilities: ${payload.metrics.totalLiabilities}`);
      doc.fontSize(12).text(`Total Equity: ${payload.metrics.totalEquity}`);
      doc.fontSize(12).text(`Net Income: ${payload.metrics.netIncome}`);
      doc.fontSize(12).text(`Net Cash Flow: ${payload.metrics.cashFlow}`);
    }

    return this.bufferFromPdf(doc);
  }

  async exportReport(reportType: string, format: string, date?: string, dateFrom?: string, dateTo?: string, compare = false) {
    const normalized = (reportType || 'balance-sheet').toString().toLowerCase();
    const typeName = {
      'balance-sheet': 'Balance Sheet',
      'profit-loss': 'Income Statement',
      'income-statement': 'Income Statement',
      'cash-flow': 'Cash Flow',
      'equity-statement': 'Statement of Equity',
      'executive-summary': 'Executive Summary',
    }[normalized] ?? 'Balance Sheet';

    let payload: any;
    if (typeName === 'Balance Sheet') payload = await this.getBalanceSheet(date);
    else if (typeName === 'Income Statement') payload = await this.getIncomeStatement(dateFrom, dateTo, compare);
    else if (typeName === 'Cash Flow') payload = await this.getCashFlow(dateFrom, dateTo);
    else if (typeName === 'Statement of Equity') payload = await this.getStatementOfEquity(dateFrom, dateTo);
    else if (typeName === 'Executive Summary') payload = await this.getExecutiveSummary(dateFrom, dateTo);
    else payload = await this.getBalanceSheet(date);

    const outputFormat = (format || 'xlsx').toString().toLowerCase();
    if (outputFormat === 'pdf') {
      const buffer = await this.exportAsPdf(typeName, payload);
      return { buffer, filename: `${normalized}-${new Date().toISOString().slice(0, 10)}.pdf`, contentType: 'application/pdf' };
    }

    const buffer = await this.exportAsExcel(typeName, payload);
    return { buffer, filename: `${normalized}-${new Date().toISOString().slice(0, 10)}.xlsx`, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  }

  async getCashFlow(dateFrom: string, dateTo: string) {
    const income = await this.getIncomeStatement(dateFrom, dateTo);
    const balances = await this.getBalancesInPeriod(dateFrom, dateTo);

    const sumByPrefix = async (prefix: string) => {
      const accs = await this.prisma.account.findMany({
        where: { isActive: true, code: { startsWith: prefix } },
      });
      return accs.reduce((s, a) => s + (balances.get(a.id) || 0), 0);
    };

    const [deltaReceivables, deltaInventory, deltaPayables, deltaFixedAssets, deltaLoans] =
      await Promise.all([
        sumByPrefix('12'),
        sumByPrefix('14'),
        sumByPrefix('21'),
        sumByPrefix('15'),
        sumByPrefix('22'),
      ]);

    const operatingCF =
      income.netIncome - deltaReceivables - deltaInventory + deltaPayables;
    const investingCF = -deltaFixedAssets;
    const financingCF = deltaLoans;
    const netCF = operatingCF + investingCF + financingCF;

    return {
      period: { dateFrom, dateTo },
      operating: {
        netIncome: income.netIncome,
        adjustments: {
          perubahanPiutang: -deltaReceivables,
          perubahanPersediaan: -deltaInventory,
          perubahanHutangDagang: deltaPayables,
        },
        total: operatingCF,
      },
      investing: {
        perubahanAsetTetap: -deltaFixedAssets,
        total: investingCF,
      },
      financing: {
        perubahanHutangBank: deltaLoans,
        total: financingCF,
      },
      netCashFlow: netCF,
    };
  }
}
