import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ReorderCronService {
  private readonly logger = new Logger(ReorderCronService.name);
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleReorder() {
    this.logger.log('Running daily reorder check');
    const rules = await this.prisma.reorderRule.findMany({ where: { active: true }, include: { product: true } });
    for (const rule of rules) {
      try {
        // compute product stock per warehouse if warehouseId present
        let qty = 0;
        if (rule.warehouseId) {
          const ws = await this.prisma.productWarehouseStock.findUnique({ where: { productId_warehouseId: { productId: rule.productId, warehouseId: rule.warehouseId } } });
          qty = Number(ws?.qty ?? 0);
        } else {
          const ag = await this.prisma.product.aggregate({ _sum: { stok: true }, where: { id: rule.productId } });
          qty = Number(ag._sum.stok ?? 0);
        }
        if (qty <= Number(rule.minQty ?? 0)) {
          const message = `Stok ${rule.product?.name ?? rule.productId} di ${rule.warehouseId ?? 'semua gudang'} tinggal ${qty}, perlu reorder ${rule.reorderQty}`;
          await this.prisma.notification.create({ data: { recipient: 'stock-team', title: 'Reorder Needed', message } as any });
        }
      } catch (err) {
        this.logger.error('Error checking reorder rule', err);
      }
    }
  }
}
