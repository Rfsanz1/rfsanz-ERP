import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CostingService } from './costing.service.js';
import { LandedCostSplitMethod } from '@prisma/client';

interface LandedCostInput {
  deskripsi: string;
  amount: number;
  splitMethod: LandedCostSplitMethod;
}

@Injectable()
export class LandedCostService {
  constructor(
    private prisma: PrismaService,
    private costing: CostingService,
  ) {}

  async findAll(query: any) {
    const { purchaseId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (purchaseId) where.purchaseId = purchaseId;
    const [data, total] = await Promise.all([
      this.prisma.landedCost.findMany({
        where, skip, take: Number(limit),
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.landedCost.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string) {
    const lc = await this.prisma.landedCost.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!lc) throw new NotFoundException('Landed cost tidak ditemukan');
    return lc;
  }

  async applyLandedCost(purchaseId: string, costs: LandedCostInput[]) {
    // Validasi PO
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseId },
      include: { items: { include: { product: true } } },
    });
    if (!po) throw new NotFoundException(`Purchase Order ${purchaseId} tidak ditemukan`);
    if (po.items.length === 0) throw new BadRequestException('PO tidak memiliki item');

    const results: any[] = [];

    for (const cost of costs) {
      const lc = await this.prisma.landedCost.create({
        data: {
          purchaseId,
          deskripsi: cost.deskripsi,
          amount: cost.amount,
          splitMethod: cost.splitMethod,
          status: 'draft',
        },
      });

      // Hitung basis alokasi per item
      let totalBasis = 0;
      const bases: { item: typeof po.items[0]; basis: number }[] = [];

      for (const item of po.items) {
        let basis = 0;
        if (cost.splitMethod === LandedCostSplitMethod.BY_QTY) {
          basis = item.qty;
        } else if (cost.splitMethod === LandedCostSplitMethod.BY_VALUE) {
          basis = Number(item.subtotal);
        } else {
          basis = item.qty;
        }
        bases.push({ item, basis });
        totalBasis += basis;
      }

      if (totalBasis === 0) continue;

      const allocations: { item: typeof po.items[0]; alokasi: number }[] = [];

      for (const { item, basis } of bases) {
        const alokasi = (basis / totalBasis) * cost.amount;
        allocations.push({ item, alokasi });

        // Update average cost produk
        if (item.productId && item.qty > 0) {
          const aditionalUnitCost = alokasi / item.qty;
          const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const newAvg = Number(product.currentAvgCost) + aditionalUnitCost;
            await this.prisma.product.update({
              where: { id: item.productId },
              data: { currentAvgCost: newAvg },
            });

            await this.costing.createValuationEntry(
              item.productId, 0, aditionalUnitCost, 'LANDED_COST', lc.id,
            );
          }
        }

        await this.prisma.landedCostItem.create({
          data: {
            landedCostId: lc.id,
            productId: item.productId ?? '',
            qty: item.qty,
            alokasiBiaya: alokasi,
          },
        });
      }

      // Auto journal untuk landed cost
      await this.costing.createAutoJournal('LANDED_COST', '', cost.amount, 1, lc.id);

      await this.prisma.landedCost.update({
        where: { id: lc.id },
        data: { status: 'applied' },
      });

      results.push({ landedCost: lc, allocations });
    }

    return results;
  }

  async createDraft(data: {
    purchaseId: string;
    deskripsi: string;
    amount: number;
    splitMethod: LandedCostSplitMethod;
  }) {
    return this.prisma.landedCost.create({
      data: { ...data, status: 'draft' },
    });
  }

  async validate(id: string) {
    const lc = await this.findOne(id);
    if (lc.status !== 'draft') throw new BadRequestException('Hanya landed cost berstatus draft yang bisa divalidasi');

    return this.applyLandedCost(lc.purchaseId, [{
      deskripsi: lc.deskripsi,
      amount: Number(lc.amount),
      splitMethod: lc.splitMethod,
    }]);
  }
}
