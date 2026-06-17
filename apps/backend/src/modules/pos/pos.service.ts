import { Inject, Injectable, UnauthorizedException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async login(username: string, password: string) {
    const user = await this.prisma.posUser.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) throw new UnauthorizedException('Username/password salah');
    const session = await this.prisma.posCashierSession.create({ data: { posUserId: user.id, tenantId: (user as any).tenantId ?? 'default', modalAwal: 0, status: 'open' } as any });
    return { user: { id: user.id, name: user.name, role: user.role }, sessionId: session.id };
  }

  async getProducts(query: any) {
    const { search, categoryId, page = 1, limit = 50 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    const [data, total] = await Promise.all([
      this.prisma.posProduct.findMany({ where, skip, take: Number(limit), include: { category: true }, orderBy: { name: 'asc' } }),
      this.prisma.posProduct.count({ where }),
    ]);
    return { data, total };
  }

  async getSales(query: any) {
    const { sessionId, status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.posSale.findMany({
        where,
        skip,
        take: Number(limit),
        include: { items: { include: { posProduct: true } }, posUser: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.posSale.count({ where }),
    ]);
    return { data, total };
  }

  async getTransaction(id: string) {
    const sale = await this.prisma.posSale.findUnique({
      where: { id },
      include: { items: { include: { posProduct: true } }, posUser: true },
    });
    if (!sale) throw new NotFoundException('Transaction not found');
    return sale;
  }

  async createSale(dto: any) {
    const saleData = this.prepareSaleData(dto);
    const sale = await this.prisma.posSale.create({
      data: saleData,
      include: { items: { include: { posProduct: true } }, posUser: true },
    });

    if (sale.customerId && sale.status === 'selesai') {
      await this.adjustCustomerLoyalty(sale.customerId, Number(sale.loyaltyPointsEarned ?? 0), Number(sale.loyaltyPointsUsed ?? 0));
    }

    return sale;
  }

  async holdTransaction(dto: any) {
    return this.createSale({ ...dto, status: 'hold', bayar: 0, kembalian: 0, splitPayments: null, metodeBayar: 'hold' });
  }

  async getHeldTransactions() {
    const data = await this.prisma.posSale.findMany({
      where: { status: 'hold' },
      include: { items: { include: { posProduct: true } }, posUser: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data, total: data.length };
  }

  async resumeTransaction(id: string, dto: any) {
    const sale = await this.prisma.posSale.findUnique({ where: { id }, include: { items: true } });
    if (!sale) throw new NotFoundException('Held transaction not found');
    const items = sale.items.map(item => ({
      posProductId: item.posProductId,
      nama: item.nama,
      qty: item.qty,
      harga: Number(item.harga),
      subtotal: Number(item.subtotal),
    }));
    const updateData = this.prepareSaleAmounts({ ...dto, items, discountType: dto.discountType ?? sale.discountType, discountValue: dto.discountValue ?? sale.discountValue });
    const updated = await this.prisma.posSale.update({
      where: { id },
      data: { ...updateData, status: 'selesai', splitPayments: dto.splitPayments ?? sale.splitPayments },
      include: { items: { include: { posProduct: true } }, posUser: true },
    });
    if (updated.customerId) {
      await this.adjustCustomerLoyalty(updated.customerId, Number(updated.loyaltyPointsEarned ?? 0), Number(updated.loyaltyPointsUsed ?? 0));
    }
    return updated;
  }

  async returnTransaction(id: string, dto: any) {
    const sale = await this.prisma.posSale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('Transaction not found');
    return this.prisma.posSale.update({
      where: { id },
      data: { status: 'returned', returnReference: dto.returnReference ?? sale.id },
    });
  }

  async getReceipt(id: string) {
    return this.getTransaction(id);
  }

  async syncTransactions(transactions: any[]) {
    if (!Array.isArray(transactions)) throw new BadRequestException('transactions must be an array');
    return Promise.all(transactions.map(tx => this.createSale(tx)));
  }

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todaySales, totalRevenue, openSessions] = await Promise.all([
      this.prisma.posSale.count({ where: { createdAt: { gte: today } } }),
      this.prisma.posSale.aggregate({ _sum: { grandTotal: true }, where: { createdAt: { gte: today } } }),
      this.prisma.posCashierSession.count({ where: { status: 'open' } }),
    ]);
    return {
      todaySales,
      todayRevenue: Number(totalRevenue._sum.grandTotal ?? 0),
      openSessions,
    };
  }

  async getCategories() {
    return this.prisma.posCategory.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  }

  async createProduct(dto: any) {
    return this.prisma.posProduct.create({ data: dto });
  }

  async updateProduct(id: string, dto: any) {
    return this.prisma.posProduct.update({ where: { id }, data: dto });
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────

  async getSessions(query: any) {
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.prisma.posCashierSession.findMany({
        skip,
        take: Number(limit),
        include: { posUser: { select: { id: true, name: true } }, _count: { select: { sales: true } } },
        orderBy: { openedAt: 'desc' },
      }),
      this.prisma.posCashierSession.count(),
    ]);
    const sessions = await Promise.all(data.map(async session => {
      const revenue = await this.prisma.posSale.aggregate({ where: { sessionId: session.id }, _sum: { grandTotal: true } });
      return {
        id: session.id,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        cashierName: session.posUser?.name ?? 'Kasir',
        openingCash: Number(session.modalAwal),
        closingCash: session.modalAkhir ? Number(session.modalAkhir) : undefined,
        totalTransactions: session._count.sales,
        totalRevenue: Number(revenue._sum.grandTotal ?? 0),
        status: session.status === 'open' ? 'active' : 'closed',
      };
    }));
    return { data: sessions, total };
  }

  async getActiveSession(currentUser: any) {
    const session = await this.prisma.posCashierSession.findFirst({
      where: { status: 'open' },
      include: { posUser: { select: { id: true, name: true } }, _count: { select: { sales: true } } },
      orderBy: { openedAt: 'desc' },
    });
    if (!session) return null;
    const revenue = await this.prisma.posSale.aggregate({ where: { sessionId: session.id }, _sum: { grandTotal: true } });
    return {
      id: session.id,
      openedAt: session.openedAt,
      cashierName: session.posUser?.name ?? 'Kasir',
      openingCash: Number(session.modalAwal),
      totalTransactions: session._count.sales,
      totalRevenue: Number(revenue._sum.grandTotal ?? 0),
      status: 'active',
    };
  }

  async openSession(dto: any, currentUser: any) {
    const posUser = dto.posUserId ? await this.prisma.posUser.findUnique({ where: { id: dto.posUserId } }) : null;
    const user = posUser ?? await this.prisma.posUser.findFirst({ where: { active: true } });
    if (!user) throw new NotFoundException('Tidak ada POS user aktif');
    return this.prisma.posCashierSession.create({
      data: { posUserId: user.id, tenantId: (user as any).tenantId ?? 'default', modalAwal: dto.openingCash ?? 0, status: 'open' } as any,
    });
  }

  async getSession(id: string) {
    const session = await this.prisma.posCashierSession.findUnique({
      where: { id },
      include: {
        posUser: { select: { id: true, name: true } },
        _count: { select: { sales: true } },
      },
    });
    if (!session) return null;
    const revenue = await this.prisma.posSale.aggregate({ where: { sessionId: id }, _sum: { grandTotal: true } });
    const byMethod = await this.prisma.posSale.groupBy({
      by: ['metodeBayar'],
      where: { sessionId: id },
      _sum: { grandTotal: true },
    });
    const breakdown: Record<string, number> = { cash: 0, transfer: 0, card: 0, qris: 0 };
    for (const m of byMethod) {
      const key = (m.metodeBayar ?? 'tunai').toLowerCase().replace('tunai', 'cash').replace('kartu', 'card');
      breakdown[key] = (breakdown[key] ?? 0) + Number(m._sum.grandTotal ?? 0);
    }
    return {
      id: session.id,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      cashierName: session.posUser?.name ?? 'Kasir',
      openingCash: Number(session.modalAwal),
      closingCash: session.modalAkhir ? Number(session.modalAkhir) : undefined,
      totalTransactions: session._count.sales,
      totalRevenue: Number(revenue._sum.grandTotal ?? 0),
      status: session.status === 'open' ? 'active' : 'closed',
      breakdown,
    };
  }

  async closeSession(id: string, dto: any) {
    const session = await this.prisma.posCashierSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    const sales = await this.prisma.posSale.findMany({ where: { sessionId: id, status: 'selesai' } });
    const cashRevenue = sales.reduce((sum, sale) => sum + this.extractCashAmount(sale), 0);
    const updated = await this.prisma.posCashierSession.update({
      where: { id },
      data: {
        closedAt: new Date(),
        modalAkhir: dto.closingCash ?? 0,
        status: 'closed',
      },
    });
    if (cashRevenue > 0) {
      await this.createSessionCloseJournal(session, cashRevenue);
    }
    return { ...updated, cashRevenue, closingCash: dto.closingCash ?? 0 };
  }

  async getSessionReport(id: string) {
    const session = await this.getSession(id);
    if (!session) throw new NotFoundException('Session not found');
    const sales = await this.prisma.posSale.findMany({ where: { sessionId: id } });
    const reportByMethod: Record<string, number> = {};
    let cashRevenue = 0;
    for (const sale of sales) {
      const method = sale.metodeBayar ?? 'tunai';
      reportByMethod[method] = (reportByMethod[method] ?? 0) + Number(sale.grandTotal);
      cashRevenue += this.extractCashAmount(sale);
    }
    const expectedCash = Number(session.openingCash) + cashRevenue;
    return {
      ...session,
      reportByMethod,
      cashRevenue,
      expectedCash,
      cashDifference: session.closingCash !== undefined ? Number(session.closingCash) - expectedCash : undefined,
      totalTransactions: sales.length,
    };
  }

  async getLoyaltyConfig() {
    const config = await this.prisma.loyaltyConfig.findFirst({ where: { isActive: true } });
    if (config) return config;
    return this.prisma.loyaltyConfig.create({ data: {} as any });
  }

  async updateLoyaltyConfig(dto: any) {
    const existing = await this.prisma.loyaltyConfig.findFirst();
    if (existing) {
      return this.prisma.loyaltyConfig.update({ where: { id: existing.id }, data: dto });
    }
    return this.prisma.loyaltyConfig.create({ data: dto });
  }

  async getCustomerLoyalty(customerId: string) {
    let record = await this.prisma.customerLoyalty.findUnique({ where: { customerId } });
    if (!record) {
      record = await this.prisma.customerLoyalty.create({ data: { customerId } as any });
    }
    return record;
  }

  async redeemLoyalty(dto: any) {
    const { customerId, points } = dto;
    if (!customerId || !points) throw new BadRequestException('customerId and points are required');
    const record = await this.getCustomerLoyalty(customerId);
    if (record.points < Number(points)) throw new BadRequestException('Saldo poin tidak mencukupi');
    return this.prisma.customerLoyalty.update({
      where: { customerId },
      data: {
        points: { decrement: Number(points) },
        totalRedeemed: { increment: Number(points) },
      },
    });
  }

  async getTodayReport() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sales = await this.prisma.posSale.findMany({
      where: { tanggal: { gte: today } },
      select: { grandTotal: true, metodeBayar: true, tanggal: true },
    });
    const hourly = Array.from({ length: 24 }, (_, h) => {
      const bucket = sales.filter(s => new Date(s.tanggal).getHours() === h);
      return { hour: h, count: bucket.length, revenue: bucket.reduce((sum, s) => sum + Number(s.grandTotal), 0) };
    }).filter(h => h.count > 0);
    const byMethod: Record<string, number> = {};
    for (const s of sales) {
      const method = s.metodeBayar ?? 'tunai';
      byMethod[method] = (byMethod[method] ?? 0) + Number(s.grandTotal);
    }
    return {
      totalRevenue: sales.reduce((sum, s) => sum + Number(s.grandTotal), 0),
      totalTransactions: sales.length,
      hourly,
      byMethod,
    };
  }

  async getReportsDaily(query: any) {
    const { dateFrom, dateTo } = query;
    const start = dateFrom ? new Date(dateFrom) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = dateTo ? new Date(dateTo) : new Date();
    const sales = await this.prisma.posSale.findMany({ where: { tanggal: { gte: start, lte: end } }, select: { grandTotal: true, tanggal: true, metodeBayar: true } });
    const byDay: Record<string, { date: string; revenue: number; transactions: number }> = {};
    for (const sale of sales) {
      const date = new Date(sale.tanggal).toISOString().slice(0, 10);
      byDay[date] = byDay[date] || { date, revenue: 0, transactions: 0 };
      byDay[date].revenue += Number(sale.grandTotal);
      byDay[date].transactions += 1;
    }
    const byMethod: Record<string, number> = {};
    for (const sale of sales) {
      const method = sale.metodeBayar ?? 'tunai';
      byMethod[method] = (byMethod[method] ?? 0) + Number(sale.grandTotal);
    }
    return { byDay: Object.values(byDay), byMethod };
  }

  async getReportsProducts(query: any) {
    const items = await this.prisma.posSaleItem.groupBy({
      by: ['posProductId'],
      _sum: { subtotal: true, qty: true },
    });
    const withProduct = await Promise.all(items.map(item => this.prisma.posProduct.findUnique({ where: { id: item.posProductId } }).then(product => ({
      product,
      quantity: Number(item._sum?.qty ?? 0),
      revenue: Number(item._sum?.subtotal ?? 0),
    }))));
    return withProduct;
  }

  async getReportsPayments(query: any) {
    const grouped = await this.prisma.posSale.groupBy({
      by: ['metodeBayar'],
      _sum: { grandTotal: true },
    });
    return grouped.map(item => ({ method: item.metodeBayar, total: Number(item._sum.grandTotal ?? 0) }));
  }

  async getReportsCashiers(query: any) {
    const grouped = await this.prisma.posSale.groupBy({
      by: ['posUserId'],
      _sum: { grandTotal: true },
      _count: { id: true },
    });
    return Promise.all(grouped.map(async item => {
      const user = item.posUserId ? await this.prisma.posUser.findUnique({ where: { id: item.posUserId } }) : null;
      return {
        cashierId: item.posUserId,
        cashierName: user?.name ?? 'Unknown',
        revenue: Number(item._sum.grandTotal ?? 0),
        transactions: item._count.id,
      };
    }));
  }

  private prepareSaleData(dto: any, allowNoItems = true) {
    const items = Array.isArray(dto.items) ? dto.items : [];
    if (!items.length && !allowNoItems) {
      throw new BadRequestException('Sale items are required');
    }

    const noStruk = dto.noStruk ?? this.generateNoStruk();
    const status = dto.status ?? (dto.hold ? 'hold' : 'selesai');
    const amounts = this.prepareSaleAmounts(dto);

    return {
      ...dto,
      noStruk,
      ...amounts,
      status,
      items: { create: items.map((item: any) => ({
        posProductId: item.posProductId,
        nama: item.nama ?? item.name ?? '',
        qty: Number(item.qty ?? 0),
        harga: Number(item.harga ?? 0),
        subtotal: Number(item.subtotal ?? (Number(item.qty ?? 0) * Number(item.harga ?? 0))),
      })) },
    };
  }

  private extractCashAmount(sale: any) {
    const payments = Array.isArray(sale.splitPayments) ? sale.splitPayments : [];
    if (payments.length) {
      return payments.filter((payment: any) => ['tunai', 'cash'].includes(String(payment.method ?? '').toLowerCase())).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
    }
    return ['tunai', 'cash'].includes(String(sale.metodeBayar ?? '').toLowerCase()) ? Number(sale.grandTotal ?? 0) : 0;
  }

  private generateNoStruk() {
    const date = new Date();
    return `POS/${date.getFullYear()}/${String(date.getTime()).slice(-6)}`;
  }

  private prepareSaleAmounts(dto: any) {
    const items = Array.isArray(dto.items) ? dto.items : [];
    const computedTotal = items.reduce((sum, item) => sum + Number(item.qty ?? 0) * Number(item.harga ?? 0), 0);
    const discountValue = Number(dto.discountValue ?? dto.diskon ?? 0);
    const diskon = Number(dto.diskon ?? discountValue);
    const pajak = Number(dto.pajak ?? 0);
    const grandTotal = Number(dto.grandTotal ?? Math.max(0, computedTotal - diskon + pajak));

    const splitPayments = Array.isArray(dto.splitPayments) ? dto.splitPayments : null;
    const bayar = splitPayments ? splitPayments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0) : Number(dto.bayar ?? grandTotal);
    const cashAmount = splitPayments
      ? splitPayments.filter((payment: any) => ['tunai', 'cash'].includes(String(payment.method ?? '').toLowerCase())).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
      : ['tunai', 'cash'].includes(String(dto.metodeBayar ?? '').toLowerCase()) ? bayar : 0;
    const kembalian = Math.max(0, cashAmount - grandTotal);

    return {
      totalHarga: Number(dto.totalHarga ?? computedTotal),
      diskon,
      pajak,
      grandTotal,
      bayar,
      kembalian,
      metodeBayar: dto.metodeBayar ?? 'tunai',
      splitPayments,
      discountType: dto.discountType ?? null,
      discountValue: Number(discountValue),
      loyaltyPointsEarned: Number(dto.loyaltyPointsEarned ?? 0),
      loyaltyPointsUsed: Number(dto.loyaltyPointsUsed ?? 0),
    };
  }

  private async adjustCustomerLoyalty(customerId: string, earned: number, used: number) {
    if (!customerId) return;
    const points = (earned ?? 0) - (used ?? 0);
    await this.prisma.customerLoyalty.upsert({
      where: { customerId },
      update: {
        points: { increment: points },
        totalEarned: { increment: Number(earned ?? 0) },
        totalRedeemed: { increment: Number(used ?? 0) },
      },
      create: {
        customerId,
        points,
        totalEarned: Number(earned ?? 0),
        totalRedeemed: Number(used ?? 0),
      } as any,
    });
  }

  async syncStockFromInventory() {
    const posProducts = await this.prisma.posProduct.findMany({ where: { active: true } });
    let synced = 0;
    for (const pp of posProducts) {
      if (!pp.productId) continue;
      const product = await this.prisma.product.findUnique({ where: { id: pp.productId } }).catch(() => null);
      if (!product) continue;
      await this.prisma.posProduct.update({
        where: { id: pp.id },
        data: { stok: product.stok ?? 0 } as any,
      }).catch(() => null);
      synced++;
    }
    return { synced, message: `Berhasil sync ${synced} produk` };
  }

  async getManagementSummary(period: string = 'today') {
    const now = new Date();
    let from: Date;
    let to = now;
    if (period === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    const sales = await this.prisma.posSale.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { not: 'voided' } },
      include: { items: { include: { posProduct: true } } },
    }).catch(() => [] as any[]);
    const totalRevenue = (sales as any[]).reduce((s: number, sale: any) => s + Number(sale.grandTotal ?? sale.total ?? 0), 0);
    const totalTransactions = sales.length;
    const activeSessions = await this.prisma.posCashierSession.count({ where: { status: 'open' } }).catch(() => 0);
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const sale of sales) {
      for (const item of sale.items ?? []) {
        const key = item.posProductId;
        const existing = productMap.get(key) ?? { name: item.posProduct?.name ?? '', qty: 0, revenue: 0 };
        productMap.set(key, { name: existing.name, qty: existing.qty + item.qty, revenue: existing.revenue + Number(item.subtotal) });
      }
    }
    const topProducts = Array.from(productMap.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    return { period, totalRevenue, totalTransactions, activeSessions, topProducts };
  }

  async exportReportCsv(query: any) {
    const { from, to } = query;
    const sales = await this.prisma.posSale.findMany({
      where: {
        ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
        status: { not: 'voided' },
      },
      include: { items: { include: { posProduct: true } } },
      orderBy: { createdAt: 'desc' },
    }).catch(() => [] as any[]);
    const header = 'No,Tanggal,Total,Metode Bayar,Items\n';
    const rows = sales.map((s: any, i: number) => {
      const items = (s.items ?? []).map((it: any) => `${it.posProduct?.name ?? ''}x${it.qty}`).join('; ');
      return `${i + 1},"${new Date(s.createdAt).toLocaleDateString('id-ID')}",${Number(s.total ?? 0).toLocaleString('id-ID')},"${s.paymentMethod ?? ''}","${items}"`;
    });
    return header + rows.join('\n');
  }

  async voidTransaction(id: string, reason?: string) {
    const sale = await this.prisma.posSale.findUnique({ where: { id } });
    if (!sale) throw new Error('Transaksi tidak ditemukan');
    return this.prisma.posSale.update({ where: { id }, data: { status: 'voided' } });
  }

  private async createSessionCloseJournal(session: any, cashRevenue: number) {
    const cashAccount = await this.prisma.account.findFirst({ where: { OR: [{ name: { contains: 'cash', mode: 'insensitive' } }, { code: { contains: '110', mode: 'insensitive' } }] } });
    const revenueAccount = await this.prisma.account.findFirst({ where: { OR: [{ type: 'REVENUE' }, { name: { contains: 'revenue', mode: 'insensitive' } }, { name: { contains: 'pendapatan', mode: 'insensitive' } }] } });
    if (!cashAccount || !revenueAccount) return null;
    return this.prisma.journal.create({
      data: {
        nomor: `POS-${session.id}`,
        tanggal: new Date(),
        referensi: `POS-${session.id}`,
        deskripsi: `Close session ${session.id}`,
        lines: {
          create: [
            { accountId: cashAccount.id, debit: cashRevenue, kredit: 0, deskripsi: 'Cash revenue' } as any,
            { accountId: revenueAccount.id, debit: 0, kredit: cashRevenue, deskripsi: 'POS revenue' } as any,
          ],
        },
      } as any,
    });
  }
}
