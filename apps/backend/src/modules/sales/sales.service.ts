import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { KledoService } from '../kledo/kledo.service.js';
import { NotificationService } from '../notification/notification.service.js';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);
  private cachedTenantId: string | null = null;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(KledoService) private readonly kledo: KledoService,
    @Inject(NotificationService) private readonly notif: NotificationService,
  ) {}

  private async getDefaultTenantId(): Promise<string> {
    if (this.cachedTenantId) return this.cachedTenantId;
    let tenant = await this.prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: { name: process.env.COMPANY_NAME ?? 'Gentong Mas', slug: 'gentong-mas', plan: 'trial', isActive: true },
      });
    }
    this.cachedTenantId = tenant.id;
    return tenant.id;
  }

  async getOrders(query: any) {
    const { search, status, salesName, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) where.namaCustomer = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    if (salesName) where.salesName = salesName;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({ where, skip, take: Number(limit), include: { customer: true, orderItems: { include: { product: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.order.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getOrder(id: number) {
    const o = await this.prisma.order.findUnique({ where: { id }, include: { customer: true, orderItems: { include: { product: true } } } });
    if (!o) throw new NotFoundException('Order tidak ditemukan');
    return o;
  }

  async createOrder(dto: any) {
    const { items, orderItems: _orderItems, tenantId: _dtoTenantId, ...orderData } = dto;
    const tenantId = await this.getDefaultTenantId();
    const dbItems = (items ?? []).map((it: any) => ({
      tenantId,
      nama: it.nama ?? it.name ?? '',
      qty: Number(it.qty) || 1,
      harga: it.harga ?? it.price ?? 0,
      subtotal: it.subtotal ?? (Number(it.qty || 1) * Number(it.harga ?? it.price ?? 0)),
      ...(it.productId && !String(it.productId).startsWith('kledo-') ? { productId: it.productId } : {}),
      ...(it.kledoProductId ? { kledoProductId: String(it.kledoProductId) } : {}),
    }));
    const order = await this.prisma.order.create({
      data: {
        ...orderData,
        tenantId,
        tanggal: orderData.tanggal ? new Date(orderData.tanggal) : undefined,
        pembayaranAwal: orderData.pembayaranAwal != null ? Number(orderData.pembayaranAwal) : undefined,
        items: items ?? [],
        orderItems: dbItems.length ? { create: dbItems } : undefined,
      },
      include: { orderItems: { include: { product: true } } },
    });

    /* ── Push ke Kledo secara SYNCHRONOUS agar frontend tahu hasilnya ── */
    let kledoResult: { ok: boolean; error?: string } = { ok: false, error: 'Tidak dicoba' };
    try {
      const result = await this.pushInvoiceToKledo(order, items ?? []);
      kledoResult = { ok: result.success, error: result.success ? undefined : (result.message ?? 'Gagal kirim ke Kledo') };
      if (result.success && result.kledoInvoiceId) {
        this.logger.log(`Kledo invoice dibuat: #${result.kledoInvoiceId} untuk order #${order.id}`);
      } else {
        this.logger.warn(`Kledo push gagal untuk order #${order.id}: ${result.message}`);
      }
    } catch (e: any) {
      kledoResult = { ok: false, error: e.message ?? 'Error tidak diketahui' };
      this.logger.warn(`Kledo push exception untuk order #${order.id}: ${e.message}`);
    }

    const notifItems = (order.orderItems ?? dbItems).map((it: any) => ({
      nama: it.nama ?? it.name ?? '',
      qty: Number(it.qty) || 1,
      harga: Number(it.harga) || 0,
    }));
    this.notif.notifyGrupInvoice({
      orderId: order.id,
      noInvoice: order.kledoInvoiceId ?? null,
      namaCustomer: order.namaCustomer,
      noHp: order.noHp ?? null,
      salesName: order.salesName ?? null,
      items: notifItems,
      totalHarga: Number(order.totalHarga),
      metodePembayaran: (dto.metodePembayaran ?? dto.paymentMethod ?? null),
      pembayaranAwal: dto.pembayaranAwal ? Number(dto.pembayaranAwal) : null,
      status: order.status,
    }).catch((e) => this.logger.warn('Notif grup invoice gagal: ' + e.message));
    if (order.noHp) {
      this.notif.notifyCustomerOrder({
        noHp: order.noHp,
        namaCustomer: order.namaCustomer,
        items: notifItems,
        totalHarga: Number(order.totalHarga),
        ongkir: dto.ongkir ? Number(dto.ongkir) : null,
        alamat: order.alamat ?? null,
        metodePembayaran: dto.metodePembayaran ?? dto.paymentMethod ?? null,
        status: order.status,
        lokasiToken: order.lokasiToken ?? null,
      }).catch((e) => this.logger.warn('Notif customer gagal: ' + e.message));
    }

    /* Kembalikan order + hasil kledo agar frontend bisa tampilkan status akurat */
    return { data: order, kledo: kledoResult };
  }

  private async pushInvoiceToKledo(order: any, items: any[]) {
    const kledoItems = items.map((it: any) => ({
      kledoProductId: it.kledoProductId ?? it.product?.kledoProductId ?? null,
      nama: it.nama ?? it.name ?? '',
      qty: Number(it.qty) || 1,
      harga: Number(it.harga) || Number(it.price) || 0,
      unitId: it.unitId ?? 1,
    }));
    const result = await this.kledo.createInvoice({ namaCustomer: order.namaCustomer, noHp: order.noHp, orderId: order.id, items: kledoItems });
    if (result.success && result.kledoInvoiceId) {
      await this.prisma.order.update({ where: { id: order.id }, data: { kledoInvoiceId: result.kledoInvoiceId?.toString() } }).catch(() => null);
    }
    return result;
  }

  async kledoRetry(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { orderItems: { include: { product: true } } },
    });
    if (!order) return { data: null, kledo: { ok: false, error: 'Order tidak ditemukan' } };
    const result = await this.pushInvoiceToKledo(order, order.orderItems);
    return { data: { orderId: id }, kledo: { ok: result.success, error: result.message } };
  }

  async updateOrder(id: number, dto: any) { return this.prisma.order.update({ where: { id }, data: dto }); }
  async deleteOrder(id: number) { return this.prisma.order.update({ where: { id }, data: { status: 'cancelled' } }); }
  async updatePengiriman(id: number, dto: any) { return this.prisma.order.update({ where: { id }, data: dto }); }
  async uploadBuktiTransfer(id: number, base64Data: string, extraData?: { bankTujuan?: string }) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { fotoPengiriman: base64Data },
      include: { orderItems: true },
    });
    const appUrl = process.env.APP_URL ?? `http://${process.env.SERVER_IP ?? 'localhost'}:6000`;
    this.notif.notifyGrupBuktiTF({
      orderId: order.id,
      namaCustomer: order.namaCustomer,
      noHp: order.noHp ?? null,
      totalHarga: Number(order.totalHarga),
      bankTujuan: extraData?.bankTujuan ?? null,
      salesName: order.salesName ?? null,
      fotoUrl: `${appUrl}/api/orders/${order.id}/bukti-tf`,
    }).catch((e) => this.logger.warn('Notif grup bukti TF gagal: ' + e.message));
    return order;
  }
  async getCustomerLocation(token: string) {
    const order = await this.prisma.order.findFirst({ where: { lokasiToken: token }, select: { lokasiLat: true, lokasiLng: true, namaCustomer: true } });
    if (!order) throw new NotFoundException('Token tidak valid');
    return order;
  }
  async saveCustomerLocation(token: string, lat: string, lng: string) {
    return this.prisma.order.updateMany({ where: { lokasiToken: token }, data: { lokasiLat: lat, lokasiLng: lng, lokasiUpdatedAt: new Date() } });
  }
  async sendWhatsAppNotification(orderData: any) {
    const hp = orderData.noHp ?? orderData.nomorTelepon;
    if (!hp) return { skipped: true, reason: 'Nomor HP tidak tersedia' };
    const items = (orderData.orderItems ?? orderData.items ?? []).map((it: any) => ({
      nama: it.nama ?? it.name ?? '',
      qty: Number(it.qty) || 1,
      harga: Number(it.harga) || 0,
    }));
    return this.notif.notifyCustomerOrder({
      noHp: hp,
      namaCustomer: orderData.namaCustomer,
      items,
      totalHarga: Number(orderData.totalHarga ?? orderData.total ?? 0),
      ongkir: orderData.ongkir ? Number(orderData.ongkir) : null,
      alamat: orderData.alamat ?? null,
      metodePembayaran: orderData.metodePembayaran ?? orderData.paymentMethod ?? null,
      status: orderData.status ?? null,
      lokasiToken: orderData.lokasiToken ?? null,
    });
  }

  async getSales(query: any) {
    const { search, status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) where.noFaktur = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({ where, skip, take: Number(limit), include: { customer: true, items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.sale.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getSalesSummary(query: any) {
    const { from, to } = query;
    const where: any = {};
    if (from) where.createdAt = { gte: new Date(from) };
    if (to) where.createdAt = { ...where.createdAt, lte: new Date(to) };
    const [totalOrders, totalRevenue, pendingOrders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({ _sum: { totalHarga: true }, where: { ...where, status: { not: 'cancelled' } } }),
      this.prisma.order.count({ where: { ...where, status: 'pending' } }),
    ]);
    return { totalOrders, totalRevenue: totalRevenue._sum.totalHarga ?? 0, pendingOrders };
  }

  async getSalesList() { return ['Ahmad Santoso', 'Budi Pratama', 'CV Maju Jaya', 'PT Sumber Makmur', 'Dewi Lestari', 'Eko Prasetyo']; }

  // ─── QUOTATIONS ──────────────────────────────────────────────────────────────
  async getQuotations(query: any) {
    const { search, status, customerId, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) where.OR = [{ nomorQuotation: { contains: search, mode: 'insensitive' } }];
    const [data, total] = await Promise.all([
      this.prisma.salesQuotation.findMany({ where, skip, take: Number(limit), include: { customer: { select: { id: true, name: true } }, items: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.salesQuotation.count({ where }),
    ]);
    return { data, message: 'success', meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getQuotation(id: string) {
    const data = await this.prisma.salesQuotation.findUnique({ where: { id }, include: { customer: true, items: { include: { product: true } } } });
    if (!data) throw new NotFoundException('Quotation tidak ditemukan');
    return { data, message: 'success' };
  }

  async createQuotation(dto: any) {
    if (!dto.customerId) throw new BadRequestException('customerId harus diisi');
    const counter = await this.prisma.salesQuotation.count();
    const nomorQuotation = dto.nomorQuotation ?? `QT-${new Date().getFullYear()}${String(counter + 1).padStart(4, '0')}`;
    const { items, ...rest } = dto;
    const data = await this.prisma.salesQuotation.create({ data: { ...rest, nomorQuotation, items: items?.length ? { create: items } : undefined }, include: { items: true } });
    return { data, message: 'Quotation berhasil dibuat' };
  }

  async updateQuotation(id: string, dto: any) {
    await this.getQuotation(id);
    const { items, ...rest } = dto;
    const data = await this.prisma.salesQuotation.update({ where: { id }, data: rest, include: { items: true } });
    return { data, message: 'Quotation berhasil diupdate' };
  }

  async deleteQuotation(id: string) {
    await this.prisma.salesQuotation.update({ where: { id }, data: { deletedAt: new Date() } });
    return { data: null, message: 'Quotation berhasil dihapus' };
  }

  async confirmQuotation(id: string) {
    const q = await this.getQuotation(id);
    if (!['draft', 'sent'].includes(q.data.status)) throw new BadRequestException('Hanya quotation draft atau terkirim yang bisa dikonfirmasi');
    const data = await this.prisma.salesQuotation.update({ where: { id }, data: { status: 'confirmed' } });
    return { data, message: 'Quotation berhasil dikonfirmasi' };
  }

  async convertQuotationToInvoice(id: string) {
    const q = await this.getQuotation(id);
    const quotation = q.data;
    const count = await this.prisma.invoice.count();
    const noInvoice = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    const items = quotation.items.map((it: any) => ({
      productId: it.productId,
      nama: it.productName ?? it.product?.name ?? '',
      qty: Number(it.qty),
      harga: Number(it.hargaSatuan),
      subtotal: Number(it.subtotal),
    }));
    const invoice = await this.prisma.invoice.create({
      data: {
        noInvoice,
        customerId: quotation.customerId,
        salesName: quotation.salesName,
        subtotal: quotation.subtotal,
        diskon: quotation.discount,
        pajak: quotation.tax,
        grandTotal: quotation.total,
        status: 'draft',
        notes: quotation.note,
        items: items.length ? { create: (items as any[]) } : undefined,
      } as any,
      include: { items: true, customer: { select: { id: true, name: true } } },
    });
    await this.prisma.salesQuotation.update({ where: { id }, data: { status: 'converted' } });
    return { data: invoice, message: 'Quotation berhasil dikonversi ke invoice' };
  }

  async convertQuotationToOrder(id: string) {
    const q = await this.getQuotation(id);
    const quotation = q.data;
    const items = quotation.items.map((it: any) => ({ productId: it.productId, productName: it.productName, qty: it.qty, hargaSatuan: it.hargaSatuan, subtotal: it.subtotal }));
    const order = await this.createOrder({ customerId: quotation.customerId, salesName: quotation.salesName, items, quotationId: quotation.id });
    await this.prisma.salesQuotation.update({ where: { id }, data: { status: 'converted' } });
    return { data: order, message: 'Quotation berhasil dikonversi ke order' };
  }

  async sendQuotationWhatsApp(id: string, dto: any) {
    const q = await this.getQuotation(id);
    const quotation = q.data;
    const phone = dto?.phone ?? quotation.customer?.phone ?? '';
    if (!phone) return { message: 'Tidak ada nomor telepon' };
    const fmt = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    const message = dto?.message ?? `Halo ${quotation.customer?.name ?? 'Pelanggan'}, kami mengirimkan penawaran ${quotation.nomorQuotation} senilai ${fmt(Number(quotation.total))}. Berlaku hingga ${quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('id-ID') : '-'}. Terima kasih.`;
    if (process.env.FONNTE_TOKEN) {
      try {
        const resp = await fetch('https://api.fonnte.com/send', { method: 'POST', headers: { Authorization: process.env.FONNTE_TOKEN }, body: JSON.stringify({ target: phone, message }) });
        return { data: await resp.json(), message: 'WhatsApp berhasil dikirim' };
      } catch (e: any) { return { error: e.message }; }
    }
    return { skipped: true, preview: message };
  }

  async sendQuotationEmail(id: string, dto: any) {
    await this.getQuotation(id);
    return { skipped: true, message: 'Email service belum dikonfigurasi. Gunakan SMTP atau third-party provider.' };
  }

  // ─── SALES RETURNS ───────────────────────────────────────────────────────────
  async getSalesReturns(query: any) {
    const { orderId, invoiceId, status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (orderId) where.orderId = Number(orderId);
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.salesReturn.findMany({ where, skip, take: Number(limit), include: { customer: { select: { id: true, name: true } }, items: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.salesReturn.count({ where }),
    ]);
    return { data, message: 'success', meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getSalesReturn(id: string) {
    const data = await this.prisma.salesReturn.findUnique({ where: { id }, include: { customer: true, items: true } });
    if (!data) throw new NotFoundException('Sales return tidak ditemukan');
    return { data, message: 'success' };
  }

  async createSalesReturn(dto: any) {
    if (!dto.customerId) throw new BadRequestException('customerId harus diisi');
    const { items, ...rest } = dto;
    const counter = await this.prisma.salesReturn.count();
    const noReturn = dto.noReturn ?? `SR-${new Date().getFullYear()}${String(counter + 1).padStart(4, '0')}`;
    const data = await this.prisma.salesReturn.create({ data: { ...rest, noReturn, items: items?.length ? { create: items } : undefined }, include: { items: true } });
    return { data, message: 'Sales return berhasil dibuat' };
  }

  async updateSalesReturn(id: string, dto: any) {
    await this.getSalesReturn(id);
    const { items, ...rest } = dto;
    const data = await this.prisma.salesReturn.update({ where: { id }, data: rest, include: { items: true } });
    return { data, message: 'Sales return berhasil diupdate' };
  }

  async validateSalesReturn(id: string) {
    const r = await this.getSalesReturn(id);
    const ret = r.data;
    if (ret.status === 'validated') throw new BadRequestException('Return sudah divalidasi');

    for (const item of ret.items) {
      if (item.productId) {
        await this.prisma.product.update({ where: { id: item.productId }, data: { stok: { increment: item.qty } } }).catch(() => null);
      }
    }
    const data = await this.prisma.salesReturn.update({ where: { id }, data: { status: 'validated' } });
    return { data, message: 'Sales return berhasil divalidasi dan stok dikembalikan' };
  }

  // ─── PRICELISTS ──────────────────────────────────────────────────────────────
  async getPricelists(query: any) {
    const { search, active, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (active !== undefined) where.active = active === 'true' || active === true;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.pricelist.findMany({ where, skip, take: Number(limit), include: { items: true }, orderBy: { name: 'asc' } }),
      this.prisma.pricelist.count({ where }),
    ]);
    return { data, message: 'success', meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getPricelist(id: string) {
    const data = await this.prisma.pricelist.findUnique({ where: { id }, include: { items: true } });
    if (!data) throw new NotFoundException('Pricelist tidak ditemukan');
    return { data, message: 'success' };
  }

  async createPricelist(dto: any) {
    if (!dto.name && !dto.nama) throw new BadRequestException('Nama pricelist harus diisi');
    const { items, ...rest } = dto;
    if (rest.nama && !rest.name) { rest.name = rest.nama; delete rest.nama; }
    const data = await this.prisma.pricelist.create({ data: { ...rest, items: items?.length ? { create: items } : undefined }, include: { items: true } });
    return { data, message: 'Pricelist berhasil dibuat' };
  }

  async updatePricelist(id: string, dto: any) {
    await this.getPricelist(id);
    const { items, ...rest } = dto;
    const data = await this.prisma.pricelist.update({ where: { id }, data: rest, include: { items: true } });
    return { data, message: 'Pricelist berhasil diupdate' };
  }

  async deletePricelist(id: string) {
    await this.prisma.pricelist.delete({ where: { id } });
    return { data: null, message: 'Pricelist berhasil dihapus' };
  }

  async getPricelistItems(id: string) {
    await this.getPricelist(id);
    const data = await this.prisma.pricelistItem.findMany({ where: { pricelistId: id } });
    return { data, message: 'success' };
  }

  async addPricelistItem(id: string, dto: any) {
    await this.getPricelist(id);
    const data = await this.prisma.pricelistItem.create({ data: { ...dto, pricelistId: id } });
    return { data, message: 'Item berhasil ditambahkan' };
  }
}
