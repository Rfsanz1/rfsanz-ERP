import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class WorkflowService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async getConfig() {
    let cfg = await this.prisma.workflowConfig.findFirst();
    if (!cfg) {
      cfg = await this.prisma.workflowConfig.create({ data: {} as any });
    }
    return cfg;
  }

  async getWorkflowConfig(module?: string) {
    const cfg = await this.getConfig();
    if (!module) return cfg;
    return {
      module,
      requireApproval: module === 'purchase_order' ? cfg.requireApprovalPO
        : module === 'expense' ? cfg.requireApprovalExpense
        : module === 'leave' ? cfg.requireApprovalLeave
        : false,
      minAmount: module === 'purchase_order' ? cfg.poApprovalLimit
        : module === 'expense' ? cfg.expenseApprovalLimit
        : 0,
    };
  }

  async updateWorkflowConfig(body: {
    module: string;
    requireApproval: boolean;
    minAmount?: number;
  }) {
    const cfg = await this.getConfig();
    const data: any = {};
    if (body.module === 'purchase_order') {
      data.requireApprovalPO = body.requireApproval;
      if (body.minAmount !== undefined) data.poApprovalLimit = body.minAmount;
    } else if (body.module === 'expense') {
      data.requireApprovalExpense = body.requireApproval;
      if (body.minAmount !== undefined) data.expenseApprovalLimit = body.minAmount;
    } else if (body.module === 'leave') {
      data.requireApprovalLeave = body.requireApproval;
    }
    return this.prisma.workflowConfig.update({ where: { id: cfg.id }, data });
  }

  async requestApproval(body: { module: string; referenceId: string; amount: number }, actorId?: string) {
    const cfg = await this.getConfig();
    let needsApproval = false;

    if (body.module === 'purchase_order') {
      needsApproval = cfg.requireApprovalPO && Number(body.amount) >= Number(cfg.poApprovalLimit);
    } else if (body.module === 'expense') {
      needsApproval = cfg.requireApprovalExpense && Number(body.amount) >= Number(cfg.expenseApprovalLimit);
    } else if (body.module === 'leave') {
      needsApproval = cfg.requireApprovalLeave;
    }

    if (!needsApproval) {
      return { needsApproval: false, status: 'auto_approved', message: 'Tidak memerlukan approval' };
    }

    if (body.module === 'purchase_order') {
      await this.prisma.purchaseOrder.update({
        where: { id: body.referenceId },
        data: { status: 'waiting_approval' },
      });
    } else if (body.module === 'expense') {
      await this.prisma.expense.update({
        where: { id: body.referenceId },
        data: { status: 'waiting_approval' },
      });
    }

    await this.prisma.notification.create({
      data: {
        title: 'Menunggu Persetujuan',
        message: `Dokumen ${body.module} #${body.referenceId.slice(-6)} membutuhkan approval Anda.`,
        recipient: 'admin',
        status: 'pending',
      } as any,
    }).catch(() => null);

    return { needsApproval: true, status: 'waiting_approval', message: 'Menunggu persetujuan' };
  }

  async approve(body: { module: string; referenceId: string; notes?: string }, actorId?: string) {
    const now = new Date();
    if (body.module === 'purchase_order') {
      await this.prisma.purchaseOrder.update({
        where: { id: body.referenceId },
        data: { status: 'approved', approvedBy: actorId, approvedAt: now },
      });
    } else if (body.module === 'expense') {
      await this.prisma.expense.update({
        where: { id: body.referenceId },
        data: { status: 'approved', approvedBy: actorId, approvedAt: now },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'APPROVE',
        resource: body.module,
        recordId: body.referenceId,
        metadata: { notes: body.notes },
      } as any,
    }).catch(() => null);

    await this.prisma.notification.create({
      data: {
        title: 'Dokumen Disetujui',
        message: `Dokumen ${body.module} #${body.referenceId.slice(-6)} telah disetujui.`,
        recipient: 'admin',
        status: 'pending',
      } as any,
    }).catch(() => null);

    return { status: 'approved', message: 'Berhasil disetujui' };
  }

  async reject(body: { module: string; referenceId: string; notes?: string }, actorId?: string) {
    if (body.module === 'purchase_order') {
      await this.prisma.purchaseOrder.update({
        where: { id: body.referenceId },
        data: { status: 'rejected' },
      });
    } else if (body.module === 'expense') {
      await this.prisma.expense.update({
        where: { id: body.referenceId },
        data: { status: 'rejected' },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'REJECT',
        resource: body.module,
        recordId: body.referenceId,
        metadata: { notes: body.notes },
      } as any,
    }).catch(() => null);

    return { status: 'rejected', message: 'Dokumen ditolak' };
  }

  async getPendingApprovals(role?: string) {
    const [pos, expenses] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: { status: 'waiting_approval' },
        include: { supplier: true, items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expense.findMany({
        where: { status: 'waiting_approval' },
        include: { account: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      purchaseOrders: pos.map((p) => ({
        id: p.id,
        module: 'purchase_order',
        number: p.noPo,
        amount: Number(p.totalHarga),
        date: p.tanggal,
        supplier: p.supplier?.name ?? '',
        status: p.status,
        createdAt: p.createdAt,
      })),
      expenses: expenses.map((e) => ({
        id: e.id,
        module: 'expense',
        number: e.number,
        amount: e.totalAmount,
        date: e.date,
        description: e.description ?? '',
        status: e.status,
        createdAt: e.createdAt,
      })),
      total: pos.length + expenses.length,
    };
  }
}
