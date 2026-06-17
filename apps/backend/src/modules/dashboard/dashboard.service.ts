import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // ─── COMPREHENSIVE EXECUTIVE DASHBOARD ─────────────────────────────────────
  async getExecutiveDashboard(branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const whereOrder = branchId ? { branchId } : {};
    const whereInvoice = branchId ? { order: { branchId } } : {};
    const whereExpense = branchId ? { branchId } : {};

    // ─── SUMMARY DATA ───────────────────────────────────────────────────────
    const [
      todayOrders,
      monthOrders,
      yearOrders,
      invoices,
      overdueBills,
      lowStockCount,
      cashBalance,
      expenseData,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { ...whereOrder, createdAt: { gte: today } },
        _sum: { totalHarga: true },
      }),
      this.prisma.order.aggregate({
        where: { ...whereOrder, createdAt: { gte: monthStart } },
        _sum: { totalHarga: true },
      }),
      this.prisma.order.aggregate({
        where: { ...whereOrder, createdAt: { gte: yearStart } },
        _sum: { totalHarga: true },
      }),
      this.prisma.invoice.aggregate({
        where: { ...whereInvoice, status: 'draft' },
        _sum: { grandTotal: true },
        _count: true,
      }),
      this.prisma.invoice.count({
        where: { ...whereInvoice, dueDate: { lt: today }, status: { in: ['sent', 'partial'] } },
      }),
      this.prisma.productWarehouseStock.count({
        where: { qty: { lte: 0 } },
      }),
      this.prisma.bankAccount.aggregate({
        where: branchId ? { branchId } as any : {},
        _sum: { balance: true },
      }),
      this.prisma.expense.aggregate({
        where: { ...whereExpense, date: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const summary = {
      todayRevenue: Number(todayOrders._sum?.totalHarga || 0),
      monthRevenue: Number(monthOrders._sum?.totalHarga || 0),
      yearRevenue: Number(yearOrders._sum?.totalHarga || 0),
      totalAR: Number(invoices._sum?.grandTotal || 0),
      totalAP: 0, // Calculate from Bills/PurchaseOrders
      cashBalance: Number(cashBalance._sum?.balance || 0),
      lowStockCount,
      overdueInvoiceCount: overdueBills,
      pendingPOCount: 0, // Calculate from PurchaseOrder where status = PENDING
      monthExpense: Number(expenseData._sum?.amount || 0),
    };

    // ─── CHARTS DATA ────────────────────────────────────────────────────────
    const revenueChart = await this.getRevenueChart(branchId);
    const cashFlowChart = await this.getCashFlowChart(branchId);
    const topProducts = await this.getTopProducts(branchId);
    const topCustomers = await this.getTopCustomers(branchId);
    const expenseByCategory = await this.getExpenseByCategory(branchId);

    // ─── ALERTS ────────────────────────────────────────────────────────────
    const lowStocks = await this.getLowStockAlerts(branchId);
    const overdueInvoices = await this.getOverdueInvoicesAlerts(branchId);
    const upcomingPayables = await this.getUpcomingPayablesAlerts(branchId);

    return {
      summary,
      charts: {
        revenueChart,
        cashFlowChart,
        topProducts,
        topCustomers,
        expenseByCategory,
      },
      alerts: {
        lowStock: lowStocks,
        overdueInvoices,
        upcomingPayables,
        pendingApprovals: { expenses: 0, leaves: 0, pos: 0 },
      },
    };
  }

  private async getRevenueChart(branchId?: string) {
    const months = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const [revenue, expense] = await Promise.all([
        this.prisma.order.aggregate({
          where: {
            ...(branchId ? { branchId } : {}),
            createdAt: { gte: monthStart, lte: monthEnd },
          },
          _sum: { totalHarga: true },
        }),
        this.prisma.expense.aggregate({
          where: {
            ...(branchId ? { branchId } : {}),
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      months.push({
        month: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        revenue: Number(revenue._sum?.totalHarga || 0),
        expense: Number(expense._sum?.amount || 0),
      });
    }

    return months;
  }

  private async getCashFlowChart(branchId?: string) {
    const months = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      months.push({
        month: date.toLocaleDateString('id-ID', { month: 'short' }),
        inflow: Math.random() * 100000000, // TODO: Calculate from actual data
        outflow: Math.random() * 50000000,
      });
    }

    return months;
  }

  private async getTopProducts(branchId?: string, limit = 5) {
    const products = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { qty: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: limit,
    });

    const result = [];
    for (const item of products) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true },
      });
      result.push({
        name: product?.name || 'Unknown',
        qty: item._sum?.qty || 0,
        revenue: Number(item._sum?.subtotal || 0),
      });
    }

    return result;
  }

  private async getTopCustomers(branchId?: string, limit = 5) {
    const customers = await this.prisma.order.groupBy({
      by: ['customerId'],
      _sum: { totalHarga: true },
      _count: true,
      orderBy: { _sum: { totalHarga: 'desc' } },
      take: limit,
    });

    const result = [];
    for (const item of customers) {
      const customer = await this.prisma.contact.findUnique({
        where: { id: item.customerId! },
        select: { name: true },
      });
      result.push({
        name: customer?.name || 'Unknown',
        revenue: Number(item._sum?.totalHarga || 0),
      });
    }

    return result;
  }

  private async getExpenseByCategory(branchId?: string) {
    const expenses = await this.prisma.expense.findMany({
      where: branchId ? { branchId } as any : {},
      include: { account: { select: { name: true } } },
    });

    const grouped: Record<string, number> = {};
    for (const e of expenses) {
      const key = e.account?.name || 'Uncategorized';
      grouped[key] = (grouped[key] || 0) + Number(e.amount || 0);
    }

    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }

  private async getLowStockAlerts(branchId?: string, limit = 10) {
    const stocks = await this.prisma.productWarehouseStock.findMany({
      where: {
        ...(branchId ? { warehouseId: branchId } : {}),
        qty: { lte: 5 },
      },
      include: { product: { select: { name: true, stokMinimum: true } } },
      take: limit,
    });

    return stocks.map((s) => ({
      productName: s.product?.name || 'Unknown',
      currentStock: s.qty,
      minStock: s.product?.stokMinimum || 0,
    }));
  }

  private async getOverdueInvoicesAlerts(branchId?: string, limit = 10) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        dueDate: { lt: today },
        status: { in: ['sent', 'partial'] },
      },
      include: { customer: { select: { name: true } } },
      take: limit,
      orderBy: { dueDate: 'asc' },
    });

    return invoices.map((inv) => ({
      invoiceNumber: inv.noInvoice || inv.id,
      customerName: inv.customer?.name || 'Unknown',
      dueDate: inv.dueDate,
      amount: Number(inv.grandTotal || 0),
    }));
  }

  private async getUpcomingPayablesAlerts(branchId?: string, limit = 10) {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get upcoming bills from invoices marked as payables
    const payables = await this.prisma.invoice.findMany({
      where: {
        dueDate: { gte: today, lte: nextWeek },
        status: { in: ['SENT', 'PARTIAL'] },
        // Add more filters if needed
      },
      take: limit,
      orderBy: { dueDate: 'asc' },
    });

    return payables.map((p) => ({
      billNumber: p.noInvoice || p.id,
      supplierName: 'N/A', // Add supplier info if available
      dueDate: p.dueDate,
      amount: Number(p.grandTotal || 0),
    }));
  }

  async getSummary() {
    const [users, roles, notifications, permissions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.role.count(),
      this.prisma.notification.count(),
      this.prisma.permission.count(),
    ]);

    return {
      users,
      roles,
      notifications,
      permissions,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  async getAdminSummary() {
    const [users, roles, notifications, permissions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.role.count(),
      this.prisma.notification.count({ where: { readAt: null } }),
      this.prisma.permission.count(),
    ]);

    return {
      totalUsers: users,
      totalRoles: roles,
      unreadNotifications: notifications,
      totalPermissions: permissions,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  async getSalesSummary() {
    const [notifications] = await Promise.all([
      this.prisma.notification.count({ where: { readAt: null } }),
    ]);

    return {
      unreadNotifications: notifications,
      uptime: process.uptime(),
    };
  }

  async getGudangSummary() {
    const [notifications] = await Promise.all([
      this.prisma.notification.count({ where: { readAt: null } }),
    ]);

    return {
      unreadNotifications: notifications,
      uptime: process.uptime(),
    };
  }

  async getPosSummary() {
    const [notifications] = await Promise.all([
      this.prisma.notification.count({ where: { readAt: null } }),
    ]);

    return {
      unreadNotifications: notifications,
      uptime: process.uptime(),
    };
  }

  async getDriverSummary() {
    const [notifications] = await Promise.all([
      this.prisma.notification.count({ where: { readAt: null } }),
    ]);

    return {
      unreadNotifications: notifications,
      uptime: process.uptime(),
    };
  }
}
