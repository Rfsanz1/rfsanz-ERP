import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class PurchasingService {
  private readonly logger = new Logger(PurchasingService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async generateNumber(prefix: string, model: 'purchaseOrder' | 'requestForQuotation' | 'goodsReceipt' | 'vendorBill' | 'purchaseReturn') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const nextMonth = Number(month) === 12 ? `${year + 1}-01-01` : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`;
    const latest = await (this.prisma as any)[model].findFirst({
      where: { createdAt: { gte: new Date(`${year}-${month}-01`), lt: new Date(nextMonth) } },
      orderBy: { createdAt: 'desc' },
    });
    const fieldMap: Record<string, string> = { purchaseOrder: 'noPo', requestForQuotation: 'noRfq', goodsReceipt: 'noGr', vendorBill: 'noBill', purchaseReturn: 'noReturn' };
    const field = fieldMap[model];
    const seq = latest ? Number(latest[field].split('/')[3]) + 1 : 1;
    return `${prefix}/${year}/${month}/${String(seq).padStart(4, '0')}`;
  }

  private async genPO()     { return this.generateNumber('PO',   'purchaseOrder'); }
  private async genRFQ()    { return this.generateNumber('RFQ',  'requestForQuotation'); }
  private async genGR()     { return this.generateNumber('GR',   'goodsReceipt'); }
  private async genBill()   { return this.generateNumber('BILL', 'vendorBill'); }
  private async genReturn() { return this.generateNumber('RET',  'purchaseReturn'); }

  private calcTotals(items: any[]) {
    const subtotal = items.reduce((s, it) => s + Number(it.subtotal ?? (Number(it.qty ?? 0) * Number(it.unitPrice ?? it.hargaBeli ?? 0))), 0);
    const tax = items.reduce((s, it) => s + Number(it.tax ?? 0), 0);
    return { subtotal, tax, total: subtotal + tax };
  }

  private buildRfqItems(items: any[]) {
    if (!items?.length) throw new BadRequestException('Item RFQ harus diisi');
    return items.map(it => ({ productId: it.productId, nama: it.nama ?? it.name ?? 'Item', qty: Number(it.qty) || 1, hargaBeli: Number(it.hargaBeli ?? it.unitPrice ?? it.price ?? 0), subtotal: Number(it.subtotal ?? ((Number(it.qty) || 1) * Number(it.hargaBeli ?? it.unitPrice ?? 0))) }));
  }

  private buildPOItems(items: any[]) {
    if (!items?.length) throw new BadRequestException('Item PO harus diisi');
    return items.map(it => ({ productId: it.productId, nama: it.nama ?? it.name ?? 'Item', qty: Number(it.qty) || 1, hargaBeli: Number(it.hargaBeli ?? it.unitPrice ?? it.price ?? 0), subtotal: Number(it.subtotal ?? ((Number(it.qty) || 1) * Number(it.hargaBeli ?? it.unitPrice ?? 0))), qtyReceived: Number(it.qtyReceived ?? 0) }));
  }

  private buildGRItems(items: any[]) {
    if (!items?.length) throw new BadRequestException('Item GR harus diisi');
    return items.map(it => ({ productId: it.productId, nama: it.nama ?? it.name ?? 'Item', qtyOrdered: Number(it.qtyOrdered ?? it.qty ?? 0), qtyReceived: Number(it.qtyReceived ?? it.qtyOrdered ?? it.qty ?? 0), unitCost: Number(it.unitCost ?? it.hargaBeli ?? 0), lotNumber: it.lotNumber, expiryDate: it.expiryDate ? new Date(it.expiryDate) : undefined, note: it.note }));
  }

  private buildBillItems(items: any[]) {
    if (!items?.length) throw new BadRequestException('Item tagihan harus diisi');
    return items.map(it => ({ productId: it.productId, nama: it.nama ?? it.name ?? 'Item', qty: Number(it.qty) || 1, unitPrice: Number(it.unitPrice ?? it.hargaBeli ?? 0), subtotal: Number(it.subtotal ?? ((Number(it.qty) || 1) * Number(it.unitPrice ?? it.hargaBeli ?? 0))), landedCost: Number(it.landedCost ?? 0) }));
  }

  private buildReturnItems(items: any[]) {
    if (!items?.length) throw new BadRequestException('Item retur harus diisi');
    return items.map(it => ({ productId: it.productId, nama: it.nama ?? it.name ?? 'Item', qty: Number(it.qty) || 1, unitPrice: Number(it.unitPrice ?? it.hargaBeli ?? 0), subtotal: Number(it.subtotal ?? ((Number(it.qty) || 1) * Number(it.unitPrice ?? it.hargaBeli ?? 0))) }));
  }

  // ─── STATS ───────────────────────────────────────────────────────────────────
  async getStats() {
    const [total, pending, approved, billsUnpaid] = await Promise.all([
      this.prisma.purchaseOrder.count(),
      this.prisma.purchaseOrder.count({ where: { status: 'draft' } }),
      this.prisma.purchaseOrder.count({ where: { status: 'approved' } }),
      this.prisma.vendorBill.count({ where: { status: { in: ['approved', 'partial_paid'] } } }),
    ]);
    const [totalValue, billsValue] = await Promise.all([
      this.prisma.purchaseOrder.aggregate({ _sum: { totalHarga: true } }),
      this.prisma.vendorBill.aggregate({ _sum: { totalAmount: true }, where: { status: { in: ['approved', 'partial_paid'] } } }),
    ]);
    return { total, pending, approved, billsUnpaid, totalValue: totalValue._sum.totalHarga ?? 0, billsValue: billsValue._sum.totalAmount ?? 0 };
  }

  // ─── RFQs ────────────────────────────────────────────────────────────────────
  async getRfqs(query: any) {
    const { search, status, supplierId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) where.noRfq = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    const [data, total] = await Promise.all([
      this.prisma.requestForQuotation.findMany({ where, skip, take: Number(limit), include: { supplier: true, items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.requestForQuotation.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getRfq(id: string) {
    const rfq = await this.prisma.requestForQuotation.findUnique({ where: { id }, include: { supplier: true, items: { include: { product: true } } } });
    if (!rfq) throw new NotFoundException('RFQ tidak ditemukan');
    return rfq;
  }

  async createRfq(dto: any) {
    const { items, ...rfqData } = dto;
    const noRfq = await this.genRFQ();
    return this.prisma.requestForQuotation.create({ data: { ...rfqData, noRfq, items: { create: this.buildRfqItems(items ?? []) } }, include: { supplier: true, items: true } });
  }

  async updateRfq(id: string, dto: any) {
    const { items, ...rfqData } = dto;
    const updateData: any = { ...rfqData };
    if (items) updateData.items = { deleteMany: {}, create: this.buildRfqItems(items) };
    return this.prisma.requestForQuotation.update({ where: { id }, data: updateData });
  }

  async deleteRfq(id: string) { return this.prisma.requestForQuotation.update({ where: { id }, data: { status: 'cancelled' } }); }

  async convertRfqToPo(id: string, dto: any = {}) {
    const rfq = await this.prisma.requestForQuotation.findUnique({ where: { id }, include: { items: true } });
    if (!rfq) throw new NotFoundException('RFQ tidak ditemukan');
    const po = await this.createPurchaseOrder({ supplierId: rfq.supplierId, tanggal: dto.tanggal ?? new Date(), tanggalKirim: dto.tanggalKirim, note: dto.note, items: rfq.items.map(it => ({ productId: it.productId, nama: it.nama, qty: it.qty, hargaBeli: it.hargaBeli, subtotal: it.subtotal })) });
    await this.prisma.requestForQuotation.update({ where: { id }, data: { status: 'converted' } });
    return po;
  }

  // ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────
  async getPurchaseOrders(query: any) {
    const { search, status, supplierId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) where.noPo = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({ where, skip, take: Number(limit), include: { supplier: true, warehouse: true, items: { include: { product: true } }, goodsReceipts: true, vendorBills: true, purchaseReturns: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getPurchaseOrder(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id }, include: { supplier: true, warehouse: true, items: { include: { product: true } }, goodsReceipts: true, vendorBills: true, purchaseReturns: true } });
    if (!po) throw new NotFoundException('PO tidak ditemukan');
    return po;
  }

  async createPurchaseOrder(dto: any) {
    const { items = [], discountPercentage = 0, ...poData } = dto;
    const poItems = this.buildPOItems(items);
    const subtotal = poItems.reduce((s, it) => s + Number(it.subtotal), 0);
    const discount = subtotal * (Number(discountPercentage) / 100);
    const tax = (subtotal - discount) * 0.11;
    const totalHarga = subtotal - discount + tax;
    const noPo = await this.genPO();
    return this.prisma.purchaseOrder.create({ data: { ...poData, noPo, totalHarga, items: { create: poItems } }, include: { supplier: true, items: { include: { product: true } } } });
  }

  async updatePurchaseOrder(id: string, dto: any) { return this.prisma.purchaseOrder.update({ where: { id }, data: dto }); }

  async approvePurchaseOrder(id: string, userId: string) {
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status: 'approved', approvedBy: userId, approvedAt: new Date() } });
  }

  async cancelPurchaseOrder(id: string) { return this.prisma.purchaseOrder.update({ where: { id }, data: { status: 'cancelled' } }); }

  async changeStatus(id: string, status: string) {
    const allowed = ['submitted', 'sent', 'approved', 'partial', 'received', 'cancelled'];
    if (!allowed.includes(status)) throw new BadRequestException('Status tidak valid');
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status } });
  }

  // ─── GOODS RECEIPTS ──────────────────────────────────────────────────────────
  async getGoodsReceipts(query: any) {
    const { poId, status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (poId) where.purchaseOrderId = poId;
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.goodsReceipt.findMany({ where, skip, take: Number(limit), include: { purchaseOrder: { include: { supplier: true } }, items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.goodsReceipt.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getGoodsReceipt(id: string) {
    const gr = await this.prisma.goodsReceipt.findUnique({ where: { id }, include: { purchaseOrder: { include: { supplier: true } }, items: { include: { product: true } }, vendorBills: true, purchaseReturns: true } });
    if (!gr) throw new NotFoundException('Goods receipt tidak ditemukan');
    return gr;
  }

  async createGoodsReceipt(dto: any) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: dto.purchaseOrderId }, include: { items: true } });
    if (!po) throw new NotFoundException('PO tidak ditemukan untuk GR');
    const noGr = await this.genGR();
    const grItems = this.buildGRItems(dto.items ?? po.items.map(it => ({ productId: it.productId, nama: it.nama, qtyOrdered: it.qty, qtyReceived: it.qty, unitCost: it.hargaBeli })));
    return this.prisma.goodsReceipt.create({ data: { ...dto, noGr, items: { create: grItems } }, include: { items: true } });
  }

  async receiveGoodsReceipt(id: string, dto: any) {
    const gr = await this.prisma.goodsReceipt.findUnique({ where: { id }, include: { items: true, purchaseOrder: { include: { items: true } } } });
    if (!gr) throw new NotFoundException('Goods receipt tidak ditemukan');
    if (gr.status !== 'draft' && gr.status !== 'submitted') throw new BadRequestException('GR hanya bisa divalidasi dari status draft/submitted');
    const tolerance = Number(dto.tolerancePercent ?? 0) / 100;
    const items = dto.items ? this.buildGRItems(dto.items) : gr.items.map(it => ({ ...it, qtyReceived: it.qtyReceived, unitCost: it.unitCost, lotNumber: it.lotNumber, expiryDate: it.expiryDate }));

    await this.prisma.$transaction(async (prisma) => {
      let totalOrdered = 0, totalReceived = 0;
      for (const item of items) {
        const grItem = gr.items.find(i => i.id === (item as any).id || i.productId === item.productId);
        if (!grItem) continue;
        const maxAllowed = Math.ceil(grItem.qtyOrdered * (1 + tolerance));
        if (item.qtyReceived > maxAllowed) throw new BadRequestException(`Qty melebihi toleransi: ${item.nama}`);
        const receivedQty = Number(item.qtyReceived);
        totalOrdered += Number(grItem.qtyOrdered);
        totalReceived += receivedQty;
        await prisma.goodsReceiptItem.update({ where: { id: grItem.id }, data: { qtyReceived: receivedQty, unitCost: item.unitCost, lotNumber: item.lotNumber, expiryDate: item.expiryDate, note: item.note } });
        if (grItem.productId) {
          await prisma.purchaseOrderItem.updateMany({ where: { purchaseOrderId: gr.purchaseOrderId, productId: grItem.productId }, data: { qtyReceived: { increment: receivedQty } } });
          await prisma.product.update({ where: { id: grItem.productId }, data: { stok: { increment: receivedQty } } });
          await prisma.stockMovement.create({ data: { productId: grItem.productId, type: 'in', qty: receivedQty, note: `GR ${gr.noGr}`, referenceId: gr.id } });
          if (item.lotNumber) {
            await prisma.stockLot.upsert({ where: { productId_nomorLot: { productId: grItem.productId, nomorLot: item.lotNumber } }, update: { qtySisa: { increment: receivedQty }, unitCost: item.unitCost, expiryDate: item.expiryDate, referenceId: gr.id }, create: { productId: grItem.productId, nomorLot: item.lotNumber, expiryDate: item.expiryDate, qtyAwal: receivedQty, qtySisa: receivedQty, unitCost: item.unitCost, referenceId: gr.id } });
          }
        }
      }
      const grStatus = totalReceived >= totalOrdered ? 'received' : 'partial';
      await prisma.goodsReceipt.update({ where: { id: gr.id }, data: { status: grStatus } });
      await prisma.purchaseOrder.update({ where: { id: gr.purchaseOrderId }, data: { status: grStatus === 'received' ? 'received' : 'partial' } });
    });
    return this.getGoodsReceipt(id);
  }

  async getDeliveryNote(id: string) {
    const gr = await this.prisma.goodsReceipt.findUnique({ where: { id }, include: { purchaseOrder: { include: { supplier: true, items: true } }, items: { include: { product: true } } } });
    if (!gr) throw new NotFoundException('Goods receipt tidak ditemukan');
    return { noGr: gr.noGr, tanggal: gr.tanggal, status: gr.status, purchaseOrder: gr.purchaseOrder, supplier: gr.purchaseOrder?.supplier, items: gr.items, note: gr.note };
  }

  // ─── VENDOR BILLS ─────────────────────────────────────────────────────────────
  async getVendorBills(query: any) {
    const { search, status, supplierId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) where.noBill = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    const [data, total] = await Promise.all([
      this.prisma.vendorBill.findMany({ where, skip, take: Number(limit), include: { supplier: true, items: true, payments: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.vendorBill.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getVendorBill(id: string) {
    const bill = await this.prisma.vendorBill.findUnique({ where: { id }, include: { supplier: true, purchaseOrder: { include: { items: true } }, goodsReceipt: { include: { items: true } }, items: true, payments: true } });
    if (!bill) throw new NotFoundException('Vendor bill tidak ditemukan');
    return { data: bill };
  }

  async createVendorBill(dto: any) {
    const { goodsReceiptId, purchaseOrderId, items, dueDays = 30, ...billData } = dto;
    let supplierId = dto.supplierId;
    let sourceItems = items;

    if (goodsReceiptId) {
      const gr = await this.prisma.goodsReceipt.findUnique({ where: { id: goodsReceiptId }, include: { purchaseOrder: true, items: true } });
      if (!gr) throw new NotFoundException('Goods receipt tidak ditemukan');
      supplierId = gr.purchaseOrder.supplierId;
      sourceItems = gr.items.map(it => ({ productId: it.productId, nama: it.nama, qty: it.qtyReceived, unitPrice: it.unitCost, subtotal: Number(it.unitCost) * it.qtyReceived }));
    } else if (purchaseOrderId && !sourceItems) {
      const po = await this.prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId }, include: { items: true } });
      if (!po) throw new NotFoundException('PO tidak ditemukan');
      supplierId = po.supplierId;
      sourceItems = po.items.map(it => ({ productId: it.productId, nama: it.nama, qty: it.qtyReceived || it.qty, unitPrice: it.hargaBeli, subtotal: it.subtotal }));
    }

    const billItems = this.buildBillItems(sourceItems ?? []);
    const totalAmount = billItems.reduce((s, it) => s + Number(it.subtotal), 0);
    const noBill = await this.genBill();
    const data = await this.prisma.vendorBill.create({
      data: { ...billData, noBill, supplierId, purchaseOrderId, goodsReceiptId, totalAmount, dueDate: dto.dueDate ? new Date(dto.dueDate) : new Date(Date.now() + dueDays * 86400000), items: { create: billItems } },
      include: { supplier: true, items: true },
    });
    return { data, message: 'Vendor bill berhasil dibuat' };
  }

  async createBillFromGr(grId: string, dto: any = {}) {
    return this.createVendorBill({ ...dto, goodsReceiptId: grId });
  }

  async updateVendorBill(id: string, dto: any) {
    const { items, ...rest } = dto;
    const data = await this.prisma.vendorBill.update({ where: { id }, data: rest, include: { supplier: true, items: true } });
    return { data, message: 'Vendor bill berhasil diupdate' };
  }

  async deleteVendorBill(id: string) {
    const { data: bill } = await this.getVendorBill(id);
    if (bill.status !== 'draft') throw new BadRequestException('Hanya bill draft yang bisa dihapus');
    await this.prisma.vendorBillItem.deleteMany({ where: { vendorBillId: id } });
    await this.prisma.vendorBill.delete({ where: { id } });
    return { data: null, message: 'Vendor bill berhasil dihapus' };
  }

  async approveBill(id: string) {
    const { data: bill } = await this.getVendorBill(id);
    if (!['draft', 'submitted'].includes(bill.status)) throw new BadRequestException('Bill hanya bisa diapprove dari status draft/submitted');
    const data = await this.prisma.vendorBill.update({ where: { id }, data: { status: 'approved' } });
    return { data, message: 'Vendor bill berhasil diapprove' };
  }

  async addBillPayment(billId: string, dto: any) {
    if (!dto.amount || Number(dto.amount) <= 0) throw new BadRequestException('Jumlah pembayaran harus > 0');
    const { data: bill } = await this.getVendorBill(billId);
    const payment = await this.prisma.vendorBillPayment.create({
      data: { vendorBillId: billId, amount: Number(dto.amount), method: dto.method ?? 'transfer', referensi: dto.referensi ?? dto.reference, notes: dto.notes, tanggal: dto.tanggal ? new Date(dto.tanggal) : new Date() },
    });
    const agg = await this.prisma.vendorBillPayment.aggregate({ where: { vendorBillId: billId }, _sum: { amount: true } });
    const paid = Number(agg._sum.amount ?? 0);
    const total = Number(bill.totalAmount);
    const newStatus = paid >= total ? 'paid' : 'partial_paid';
    await this.prisma.vendorBill.update({ where: { id: billId }, data: { paidAmount: paid, status: newStatus } });
    return { data: payment, message: 'Pembayaran berhasil dicatat' };
  }

  async getBillPayments(billId: string) {
    const data = await this.prisma.vendorBillPayment.findMany({ where: { vendorBillId: billId }, orderBy: { tanggal: 'desc' } });
    return { data };
  }

  async getBillAging() {
    const now = new Date();
    const bills = await this.prisma.vendorBill.findMany({ where: { status: { in: ['approved', 'partial_paid'] } }, include: { supplier: true } });
    const buckets: Record<string, any[]> = { current: [], d30: [], d60: [], d90: [], over90: [] };
    for (const bill of bills) {
      const outstanding = Number(bill.totalAmount) - Number((bill as any).paidAmount ?? 0);
      if (outstanding <= 0) continue;
      const days = bill.dueDate ? Math.max(0, Math.floor((now.getTime() - new Date(bill.dueDate).getTime()) / 86400000)) : 0;
      const row = { id: bill.id, noBill: bill.noBill, supplier: (bill.supplier as any)?.name, dueDate: bill.dueDate, outstanding, daysOverdue: days };
      if (days <= 0) buckets.current.push(row);
      else if (days <= 30) buckets.d30.push(row);
      else if (days <= 60) buckets.d60.push(row);
      else if (days <= 90) buckets.d90.push(row);
      else buckets.over90.push(row);
    }
    const sum = (arr: any[]) => arr.reduce((s, r) => s + r.outstanding, 0);
    return {
      data: {
        current:  { items: buckets.current, total: sum(buckets.current),  label: 'Belum Jatuh Tempo' },
        d1_30:    { items: buckets.d30,     total: sum(buckets.d30),      label: '1–30 Hari' },
        d31_60:   { items: buckets.d60,     total: sum(buckets.d60),      label: '31–60 Hari' },
        d61_90:   { items: buckets.d90,     total: sum(buckets.d90),      label: '61–90 Hari' },
        over90:   { items: buckets.over90,  total: sum(buckets.over90),   label: '>90 Hari' },
        grandTotal: sum([...buckets.current, ...buckets.d30, ...buckets.d60, ...buckets.d90, ...buckets.over90]),
      },
    };
  }

  async validateThreeWayMatch(billId: string) {
    const { data: bill } = await this.getVendorBill(billId);
    const po = (bill as any).purchaseOrder;
    const gr = (bill as any).goodsReceipt;
    const discrepancies: any[] = [];
    for (const billItem of (bill as any).items ?? []) {
      const poItem  = po?.items?.find((i: any) => i.productId === billItem.productId || i.nama === billItem.nama);
      const grItem  = gr?.items?.find((i: any) => i.productId === billItem.productId || i.nama === billItem.nama);
      const poQty   = poItem?.qty ?? null;
      const grQty   = grItem?.qtyReceived ?? null;
      const billQty = billItem.qty;
      if (poQty !== billQty || grQty !== billQty) {
        discrepancies.push({ productId: billItem.productId, nama: billItem.nama, poQty, grQty, billQty });
      }
    }
    return { data: { matched: discrepancies.length === 0, discrepancies, summary: { po: !!po, gr: !!gr } } };
  }

  async matchVendorBill(id: string) { return this.validateThreeWayMatch(id); }

  async getBillPdf(id: string): Promise<string> {
    const { data: bill } = await this.getVendorBill(id);
    const b = bill as any;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:32px;font-size:13px;color:#333}.title{font-size:22px;font-weight:bold;color:#5D4037}table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#5D4037;color:#fff;padding:8px;text-align:left;font-size:11px}td{padding:8px;border-bottom:1px solid #eee}.right{text-align:right}</style></head><body><div style="display:flex;justify-content:space-between;margin-bottom:24px"><div><div class="title">VENDOR BILL</div><div>${b.noBill}</div></div><div style="text-align:right"><div>Tgl: ${new Date(b.createdAt).toLocaleDateString('id-ID')}</div><div>Jatuh Tempo: ${b.dueDate ? new Date(b.dueDate).toLocaleDateString('id-ID') : '-'}</div><div style="margin-top:4px;padding:2px 8px;background:#5D4037;color:#fff;border-radius:4px;display:inline-block;font-size:11px">${String(b.status).toUpperCase()}</div></div></div><div style="margin-bottom:16px"><strong>Supplier:</strong> ${b.supplier?.name ?? '-'}</div><table><thead><tr><th>#</th><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>${(b.items ?? []).map((it: any, i: number) => `<tr><td>${i+1}</td><td>${it.nama}</td><td>${it.qty}</td><td class="right">Rp ${Number(it.unitPrice).toLocaleString('id-ID')}</td><td class="right">Rp ${Number(it.subtotal).toLocaleString('id-ID')}</td></tr>`).join('')}</tbody></table><div style="text-align:right;margin-top:8px"><div style="font-size:16px;font-weight:bold;color:#5D4037">Total: Rp ${Number(b.totalAmount).toLocaleString('id-ID')}</div><div>Dibayar: Rp ${Number(b.paidAmount ?? 0).toLocaleString('id-ID')}</div><div>Outstanding: Rp ${(Number(b.totalAmount) - Number(b.paidAmount ?? 0)).toLocaleString('id-ID')}</div></div></body></html>`;
  }

  // ─── LANDED COSTS ─────────────────────────────────────────────────────────────
  async getLandedCosts(query: any) {
    const { purchaseId, status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (purchaseId) where.purchaseId = purchaseId;
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.landedCost.findMany({ where, skip, take: Number(limit), include: { items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.landedCost.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getLandedCost(id: string) {
    const data = await this.prisma.landedCost.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
    if (!data) throw new NotFoundException('Landed cost tidak ditemukan');
    return { data };
  }

  async createLandedCost(dto: any) {
    const { items, ...rest } = dto;
    const data = await this.prisma.landedCost.create({ data: { ...rest, items: items?.length ? { create: items } : undefined }, include: { items: true } });
    return { data, message: 'Landed cost berhasil dibuat' };
  }

  async updateLandedCost(id: string, dto: any) {
    const { items, ...rest } = dto;
    const data = await this.prisma.landedCost.update({ where: { id }, data: rest, include: { items: true } });
    return { data, message: 'Landed cost berhasil diupdate' };
  }

  async validateLandedCost(id: string) {
    const { data: lc } = await this.getLandedCost(id);
    if ((lc as any).status === 'validated') throw new BadRequestException('Landed cost sudah divalidasi');
    const lcAny = lc as any;
    const totalQty = lcAny.items.reduce((s: number, it: any) => s + Number(it.qty), 0);
    const totalVal = lcAny.items.reduce((s: number, it: any) => s + (it.product ? Number(it.product.hargaJual ?? it.product.hargaBeli ?? 0) * Number(it.qty) : 0), 0);
    const totalAmt = Number(lcAny.amount);

    for (const item of lcAny.items) {
      let alokasi = 0;
      if (lcAny.splitMethod === 'by_qty') alokasi = totalQty > 0 ? (Number(item.qty) / totalQty) * totalAmt : 0;
      else if (lcAny.splitMethod === 'by_value') {
        const itemVal = item.product ? Number(item.product.hargaJual ?? 0) * Number(item.qty) : 0;
        alokasi = totalVal > 0 ? (itemVal / totalVal) * totalAmt : 0;
      } else alokasi = totalAmt / Math.max(lcAny.items.length, 1);

      await this.prisma.landedCostItem.update({ where: { id: item.id }, data: { alokasiBiaya: alokasi } });
      if (item.productId) {
        await this.prisma.product.update({ where: { id: item.productId }, data: { hargaBeli: { increment: alokasi / Math.max(Number(item.qty), 1) } } }).catch(() => null);
      }
    }
    const data = await this.prisma.landedCost.update({ where: { id }, data: { status: 'validated' } });
    return { data, message: 'Landed cost berhasil divalidasi dan dialokasikan ke produk' };
  }

  // ─── PURCHASE RETURNS ─────────────────────────────────────────────────────────
  async getPurchaseReturns(query: any) {
    const { supplierId, status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.purchaseReturn.findMany({ where, skip, take: Number(limit), include: { supplier: true, items: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.purchaseReturn.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getPurchaseReturn(id: string) {
    const data = await this.prisma.purchaseReturn.findUnique({ where: { id }, include: { supplier: true, items: { include: { product: true } } } });
    if (!data) throw new NotFoundException('Purchase return tidak ditemukan');
    return { data };
  }

  async createPurchaseReturn(dto: any) {
    const { purchaseOrderId, goodsReceiptId, items, note, status = 'draft', ...data } = dto;
    let supplierId = dto.supplierId;
    if (purchaseOrderId) { const po = await this.prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } }); if (po) supplierId = po.supplierId; }
    if (goodsReceiptId) { const gr = await this.prisma.goodsReceipt.findUnique({ where: { id: goodsReceiptId }, include: { purchaseOrder: true } }); if (gr) supplierId = gr.purchaseOrder.supplierId; }
    const itemsToCreate = this.buildReturnItems(items ?? []);
    const totals = this.calcTotals(itemsToCreate);
    const noReturn = await this.genReturn();
    const result = await this.prisma.purchaseReturn.create({ data: { ...data, noReturn, supplierId, purchaseOrderId, goodsReceiptId, status, totalAmount: totals.total, note, items: { create: itemsToCreate } }, include: { supplier: true, items: true } });
    return { data: result, message: 'Purchase return berhasil dibuat' };
  }

  async updatePurchaseReturn(id: string, dto: any) {
    const { items, ...rest } = dto;
    const data = await this.prisma.purchaseReturn.update({ where: { id }, data: rest, include: { supplier: true, items: true } });
    return { data, message: 'Purchase return berhasil diupdate' };
  }

  async validatePurchaseReturn(id: string) {
    const { data: ret } = await this.getPurchaseReturn(id);
    if ((ret as any).status === 'validated') throw new BadRequestException('Return sudah divalidasi');
    for (const item of (ret as any).items ?? []) {
      if (item.productId) {
        await this.prisma.product.update({ where: { id: item.productId }, data: { stok: { decrement: item.qty } } }).catch(() => null);
        await this.prisma.stockMovement.create({ data: { productId: item.productId, type: 'out', qty: item.qty, note: `Retur pembelian ${(ret as any).noReturn}`, referenceId: (ret as any).id } }).catch(() => null);
      }
    }
    const data = await this.prisma.purchaseReturn.update({ where: { id }, data: { status: 'validated' } });
    return { data, message: 'Purchase return divalidasi, stok dikurangi' };
  }

  // ─── SUPPLIERS ────────────────────────────────────────────────────────────────
  async getSuppliers(query: any) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { active: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({ where, skip, take: Number(limit), orderBy: { name: 'asc' } }),
      this.prisma.supplier.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getSupplier(id: string) {
    const data = await this.prisma.supplier.findUnique({ where: { id }, include: { purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 5 }, ratings: { orderBy: { createdAt: 'desc' }, take: 10 } } });
    if (!data) throw new NotFoundException('Supplier tidak ditemukan');
    const [totalPOs, totalBills] = await Promise.all([
      this.prisma.purchaseOrder.count({ where: { supplierId: id } }),
      this.prisma.vendorBill.count({ where: { supplierId: id } }),
    ]);
    const ratings = (data as any).ratings ?? [];
    const avgRating = ratings.length > 0 ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length : null;
    return { data: { ...data, totalPOs, totalBills, avgRating } };
  }

  async createSupplier(dto: any) { return this.prisma.supplier.create({ data: dto }); }
  async updateSupplier(id: string, dto: any) { return this.prisma.supplier.update({ where: { id }, data: dto }); }
  async deleteSupplier(id: string) { return this.prisma.supplier.update({ where: { id }, data: { active: false } }); }

  async getSupplierHistory(supplierId: string) {
    const [pos, bills, returns] = await Promise.all([
      this.prisma.purchaseOrder.findMany({ where: { supplierId }, include: { items: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
      this.prisma.vendorBill.findMany({ where: { supplierId }, orderBy: { createdAt: 'desc' }, take: 20 }),
      this.prisma.purchaseReturn.findMany({ where: { supplierId }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    return { data: { purchaseOrders: pos, vendorBills: bills, purchaseReturns: returns } };
  }

  async getSupplierPricelist(supplierId: string) {
    const data = await this.prisma.vendorPricelist.findMany({ where: { supplierId }, include: { supplier: true } });
    return { data };
  }

  async addSupplierPricelist(supplierId: string, dto: any) {
    const data = await this.prisma.vendorPricelist.create({ data: { ...dto, supplierId } });
    return { data, message: 'Pricelist berhasil ditambahkan' };
  }

  async rateSupplier(supplierId: string, dto: any) {
    const data = await this.prisma.supplierRating.create({ data: { ...dto, supplierId } });
    return { data, message: 'Rating berhasil disimpan' };
  }

  async compareSupplierQuotes(query: any) {
    const productIds = String(query.productIds ?? '').split(',').map((id: string) => id.trim()).filter(Boolean);
    if (!productIds.length) throw new BadRequestException('productIds harus diisi');
    const rfqs = await this.prisma.requestForQuotation.findMany({ where: { items: { some: { productId: { in: productIds } } } }, include: { supplier: true, items: true } });
    const grouped = rfqs.reduce((acc: any, rfq) => {
      const sid = rfq.supplierId;
      const matchedItems = rfq.items.filter(it => productIds.includes(it.productId ?? ''));
      const total = matchedItems.reduce((s, it) => s + Number(it.subtotal), 0);
      if (!acc[sid]) acc[sid] = { supplier: rfq.supplier, supplierId: sid, rfqs: [], total: 0, items: [] };
      acc[sid].rfqs.push(rfq);
      acc[sid].items.push(...matchedItems);
      acc[sid].total += total;
      return acc;
    }, {} as Record<string, any>);
    return Object.values(grouped).map((e: any) => ({ supplierId: e.supplierId, supplier: e.supplier, total: e.total, items: e.items, rfqCount: e.rfqs.length }));
  }
}
