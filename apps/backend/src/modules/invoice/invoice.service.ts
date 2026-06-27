import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { KledoService } from '../kledo/kledo.service.js';
import { randomBytes } from 'crypto';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationService) private readonly notif: NotificationService,
    @Inject(KledoService) private readonly kledo: KledoService,
  ) {}

  private async generateNumber() {
    const count = await this.prisma.invoice.count();
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async findAll(query: any) {
    const { search, status, customerId, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) where.OR = [
      { noInvoice: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];
    if (dateFrom || dateTo) {
      where.tanggal = {};
      if (dateFrom) where.tanggal.gte = new Date(dateFrom);
      if (dateTo) where.tanggal.lte = new Date(dateTo);
    }
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where, skip, take: Number(limit),
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: true,
          payments: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { data, message: 'success', meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async findOne(id: string) {
    const data = await this.prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, items: true, payments: { orderBy: { createdAt: 'desc' } }, creditNotes: true },
    });
    if (!data) throw new NotFoundException('Invoice tidak ditemukan');
    return { data, message: 'success' };
  }

  private toDate(v: any): Date | undefined {
    if (!v) return undefined;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }

  async create(dto: any) {
    if (!dto.customerId) throw new BadRequestException('customerId harus diisi');
    const noInvoice = dto.noInvoice ?? dto.nomorInvoice ?? await this.generateNumber();
    const { items, nomorInvoice, tenantId: _tid, tanggal, dueDate, jatuhTempo, ...rest } = dto;
    const tid = 'default';
    const data = await this.prisma.invoice.create({
      data: {
        ...rest,
        tenantId: tid,
        noInvoice,
        tanggal: this.toDate(tanggal) ?? new Date(),
        dueDate: this.toDate(dueDate ?? jatuhTempo),
        status: rest.status ?? 'draft',
        items: items?.length
          ? { create: items.map((it: any) => ({ ...it, tenantId: tid })) }
          : undefined,
      },
      include: {
        items: true,
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    // Notifikasi WhatsApp (fire & forget)
    this.notif.notifyGrupInvoice({
      orderId: data.id,
      noInvoice: data.noInvoice,
      namaCustomer: data.customer?.name ?? 'Customer',
      totalHarga: Number((data as any).grandTotal ?? 0),
      items: [],
    }).catch(() => null);

    // Push ke Kledo secara otomatis (fire & forget, tidak memblokir response)
    this.pushToKledo(data).catch(() => null);

    return { data, message: 'Invoice berhasil dibuat' };
  }

  private async pushToKledo(invoice: any) {
    try {
      const kledoStatus = await this.kledo.getStatus();
      if (!kledoStatus.connected) {
        this.logger.warn(`[Kledo] Tidak terhubung — invoice ${invoice.noInvoice} tidak di-push: ${kledoStatus.message}`);
        return;
      }

      const itemsForKledo = (invoice.items ?? []).map((it: any) => ({
        kledoProductId: it.kledoProductId ?? it.kledoId ?? null,
        nama: it.nama ?? it.name ?? it.productName ?? 'Item',
        qty: Number(it.qty ?? it.quantity ?? 1),
        harga: Number(it.harga ?? it.price ?? it.unitPrice ?? 0),
        unitId: it.unitId ?? 1,
      }));

      const result = await this.kledo.createInvoice({
        namaCustomer: invoice.customer?.name ?? 'Customer ERP',
        noHp: invoice.customer?.phone ?? undefined,
        memo: `${invoice.noInvoice} - ${invoice.customer?.name ?? ''}`,
        orderId: invoice.id,
        items: itemsForKledo,
        dueDays: invoice.dueDate
          ? Math.max(0, Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / 86400000))
          : 30,
      });

      if (result.success && result.kledoInvoiceId) {
        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            kledoInvoiceId: String(result.kledoInvoiceId),
            kledoSynced: true,
          } as any,
        }).catch(() => null);
        this.logger.log(`[Kledo] Invoice ${invoice.noInvoice} berhasil di-push → Kledo ID ${result.kledoInvoiceId}`);
      } else {
        this.logger.warn(`[Kledo] Invoice ${invoice.noInvoice} gagal di-push: ${result.message}`);
      }
    } catch (e: any) {
      this.logger.error(`[Kledo] Error push invoice ${invoice.noInvoice}: ${e?.message}`);
    }
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    const { items, ...rest } = dto;
    const data = await this.prisma.invoice.update({ where: { id }, data: rest, include: { items: true } });
    return { data, message: 'Invoice berhasil diupdate' };
  }

  async delete(id: string) {
    const inv = await this.prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Invoice tidak ditemukan');
    if (inv.status !== 'draft') throw new BadRequestException('Hanya invoice draft yang dapat dihapus');
    await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await this.prisma.invoice.delete({ where: { id } });
    return { data: null, message: 'Invoice berhasil dihapus' };
  }

  async send(id: string) {
    await this.findOne(id);
    const data = await this.prisma.invoice.update({ where: { id }, data: { status: 'sent', sentAt: new Date() } });
    return { data, message: 'Invoice berhasil dikirim' };
  }

  async addPayment(invoiceId: string, dto: any) {
    if (!dto.amount || dto.amount <= 0) throw new BadRequestException('Jumlah pembayaran harus diisi');
    const inv = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: { select: { name: true } } },
    });
    if (!inv) throw new NotFoundException('Invoice tidak ditemukan');
    const payment = await this.prisma.invoicePayment.create({
      data: { invoiceId, tenantId: 'default', amount: dto.amount, method: dto.method ?? 'transfer', referensi: dto.reference ?? dto.referensi, notes: dto.note ?? dto.notes } as any,
    });
    const agg = await this.prisma.invoicePayment.aggregate({ where: { invoiceId }, _sum: { amount: true } });
    const paid = Number(agg._sum.amount ?? 0);
    const total = Number(inv.grandTotal ?? 0);
    const sisa = Math.max(0, total - paid);
    const newStatus = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'sent';
    await this.prisma.invoice.update({ where: { id: invoiceId }, data: { status: newStatus, paidAmount: paid } });
    this.notif.notifyGrupBuktiTF({
      orderId: (inv as any).noInvoice ?? inv.id,
      namaCustomer: (inv as any).customer?.name ?? 'Customer',
      totalHarga: Number(dto.amount),
    }).catch(() => null);
    return { data: payment, message: 'Pembayaran berhasil dicatat' };
  }

  async getPayments(invoiceId: string) {
    const data = await this.prisma.invoicePayment.findMany({ where: { invoiceId }, orderBy: { tanggal: 'desc' } });
    return { data, message: 'success' };
  }

  async issueCreditNote(invoiceId: string, dto: any) {
    if (!dto.amount || dto.amount <= 0) throw new BadRequestException('Jumlah credit note harus diisi');
    await this.findOne(invoiceId);
    const counter = await this.prisma.creditNote.count();
    const noCreditNote = dto.nomor ?? dto.noCreditNote ?? `CN-${new Date().getFullYear()}-${String(counter + 1).padStart(4, '0')}`;
    const data = await this.prisma.creditNote.create({ data: { invoiceId, tenantId: 'default', noCreditNote, amount: dto.amount, reason: dto.reason ?? '', status: 'issued' } as any });
    return { data, message: 'Credit note berhasil diterbitkan' };
  }

  async getCreditNotes(invoiceId: string) {
    const data = await this.prisma.creditNote.findMany({ where: { invoiceId }, orderBy: { createdAt: 'desc' } });
    return { data, message: 'success' };
  }

  async getStats() {
    const now = new Date();
    const [total, draft, sent, paid, partial, overdue, revenue] = await Promise.all([
      this.prisma.invoice.count(),
      this.prisma.invoice.count({ where: { status: 'draft' } }),
      this.prisma.invoice.count({ where: { status: 'sent' } }),
      this.prisma.invoice.count({ where: { status: 'paid' } }),
      this.prisma.invoice.count({ where: { status: 'partial' } }),
      this.prisma.invoice.count({ where: { status: { in: ['sent', 'partial'] }, dueDate: { lt: now } } }),
      this.prisma.invoice.aggregate({ _sum: { grandTotal: true }, where: { status: 'paid' } }),
    ]);
    return { data: { total, draft, sent, paid, partial, overdue, totalRevenue: revenue._sum.grandTotal ?? 0 }, message: 'success' };
  }

  async getAging() {
    const now = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: { status: { in: ['sent', 'partial'] } },
      include: { customer: { select: { id: true, name: true } } },
    });
    const buckets: Record<string, any[]> = { current: [], d30: [], d60: [], d90: [], over90: [] };
    for (const inv of invoices) {
      const outstanding = Number(inv.grandTotal) - Number(inv.paidAmount ?? 0);
      if (outstanding <= 0) continue;
      const days = inv.dueDate ? Math.max(0, Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000)) : 0;
      const row = { id: inv.id, noInvoice: inv.noInvoice, customer: inv.customer?.name, dueDate: inv.dueDate, outstanding, daysOverdue: days };
      if (days === 0) buckets.current.push(row);
      else if (days <= 30) buckets.d30.push(row);
      else if (days <= 60) buckets.d60.push(row);
      else if (days <= 90) buckets.d90.push(row);
      else buckets.over90.push(row);
    }
    const sum = (arr: any[]) => arr.reduce((s, r) => s + r.outstanding, 0);
    return {
      data: {
        current: { items: buckets.current, total: sum(buckets.current), label: 'Belum Jatuh Tempo' },
        d1_30:   { items: buckets.d30,    total: sum(buckets.d30),    label: '1–30 Hari' },
        d31_60:  { items: buckets.d60,    total: sum(buckets.d60),    label: '31–60 Hari' },
        d61_90:  { items: buckets.d90,    total: sum(buckets.d90),    label: '61–90 Hari' },
        over90:  { items: buckets.over90, total: sum(buckets.over90), label: '>90 Hari' },
        grandTotal: sum([...buckets.current, ...buckets.d30, ...buckets.d60, ...buckets.d90, ...buckets.over90]),
      },
      message: 'success',
    };
  }

  async sendWhatsApp(id: string, dto: { phone?: string; message?: string }) {
    const { data: inv } = await this.findOne(id);
    const phone = dto?.phone ?? inv.customer?.phone ?? '';
    if (!phone) return { message: 'Tidak ada nomor telepon' };
    const outstanding = Number(inv.grandTotal) - Number(inv.paidAmount ?? 0);
    const fmt = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
    const message = dto?.message ??
      `Halo ${inv.customer?.name ?? 'Pelanggan'}, berikut invoice ${inv.noInvoice} senilai ${fmt(Number(inv.grandTotal))} dengan saldo outstanding ${fmt(outstanding)}. Jatuh tempo: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '-'}. Terima kasih.`;
    if (process.env.FONNTE_TOKEN) {
      try {
        const resp = await fetch('https://api.fonnte.com/send', { method: 'POST', headers: { Authorization: process.env.FONNTE_TOKEN }, body: JSON.stringify({ target: phone, message }) });
        return { data: await resp.json(), message: 'WhatsApp berhasil dikirim' };
      } catch (e: any) { return { error: e.message }; }
    }
    return { skipped: true, preview: message, message: 'FONNTE_TOKEN tidak dikonfigurasi' };
  }

  async sendReminder(id: string, dto?: any) {
    return this.sendWhatsApp(id, dto ?? {});
  }

  async setRecurring(id: string, dto: { frequency: string; startDate: string; endDate?: string }) {
    await this.findOne(id);
    const start = new Date(dto.startDate);
    const existing = await this.prisma.invoiceRecurring.findUnique({ where: { invoiceId: id } });
    const payload = { frequency: dto.frequency, startDate: start, endDate: dto.endDate ? new Date(dto.endDate) : null, nextRunDate: start, isActive: true };
    const data = existing
      ? await this.prisma.invoiceRecurring.update({ where: { invoiceId: id }, data: payload })
      : await this.prisma.invoiceRecurring.create({ data: { invoiceId: id, ...payload } as any });
    return { data, message: 'Recurring invoice berhasil diset' };
  }

  async deleteRecurring(id: string) {
    await this.findOne(id);
    const existing = await this.prisma.invoiceRecurring.findUnique({ where: { invoiceId: id } });
    if (!existing) throw new NotFoundException('Recurring tidak ditemukan');
    await this.prisma.invoiceRecurring.update({ where: { invoiceId: id }, data: { isActive: false } });
    return { data: null, message: 'Recurring invoice dinonaktifkan' };
  }

  async createPaymentLink(id: string, dto: { provider?: string; expiredHours?: number }) {
    await this.findOne(id);
    const token = randomBytes(16).toString('hex');
    const expiredAt = new Date(Date.now() + (dto.expiredHours ?? 24) * 3600 * 1000);
    const paymentUrl = `${process.env.APP_URL ?? 'https://your-app.replit.app'}/payment/${token}`;
    const link = await this.prisma.paymentLink.create({ data: { invoiceId: id, token, provider: dto.provider ?? 'midtrans', paymentUrl, expiredAt, status: 'pending' } as any });
    return { data: { paymentUrl, token, expiredAt }, message: 'Payment link berhasil dibuat' };
  }

  async getPaymentByToken(token: string) {
    const link = await this.prisma.paymentLink.findUnique({ where: { token } });
    if (!link) throw new NotFoundException('Payment link tidak ditemukan');
    const inv = await this.prisma.invoice.findUnique({ where: { id: link.invoiceId }, include: { customer: true, items: true } });
    return { data: { link, invoice: inv }, message: 'success' };
  }

  async getPdfHtml(id: string) {
    const { data: inv } = await this.findOne(id);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:Arial,sans-serif;padding:32px;color:#333;font-size:13px}
      .top{display:flex;justify-content:space-between;margin-bottom:24px}
      .inv-title{font-size:28px;font-weight:bold;color:#7367F0}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th{background:#7367F0;color:#fff;padding:8px;text-align:left;font-size:11px}
      td{padding:8px;border-bottom:1px solid #eee}
      .totals{text-align:right;margin-top:8px}
      .grand{font-size:17px;font-weight:bold;color:#7367F0}
    </style></head><body>
      <div class="top">
        <div><div class="inv-title">INVOICE</div><div style="font-size:16px;margin-top:4px">${inv.noInvoice}</div></div>
        <div style="text-align:right">
          <div>Tanggal: <strong>${new Date(inv.tanggal).toLocaleDateString('id-ID')}</strong></div>
          <div>Jatuh Tempo: <strong>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID') : '-'}</strong></div>
          <div style="margin-top:8px;padding:4px 10px;background:#${inv.status === 'paid' ? '4CAF50' : inv.status === 'overdue' ? 'F44336' : '7367F0'};color:#fff;border-radius:4px">${inv.status.toUpperCase()}</div>
        </div>
      </div>
      <div style="margin-bottom:16px"><strong>Kepada:</strong><br>${inv.customer?.name ?? '-'}</div>
      <table><thead><tr><th>#</th><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
      <tbody>${(inv.items ?? []).map((it: any, i: number) =>
        `<tr><td>${i + 1}</td><td>${it.nama}</td><td>${it.qty}</td><td>Rp ${Number(it.harga).toLocaleString('id-ID')}</td><td>Rp ${Number(it.subtotal).toLocaleString('id-ID')}</td></tr>`
      ).join('')}</tbody></table>
      <div class="totals">
        <div>Subtotal: Rp ${Number(inv.subtotal ?? 0).toLocaleString('id-ID')}</div>
        <div>Diskon: Rp ${Number(inv.diskon ?? 0).toLocaleString('id-ID')}</div>
        <div>Pajak: Rp ${Number(inv.pajak ?? 0).toLocaleString('id-ID')}</div>
        <div class="grand">Grand Total: Rp ${Number(inv.grandTotal ?? 0).toLocaleString('id-ID')}</div>
      </div>
      ${inv.notes ? `<div style="margin-top:24px;padding:12px;background:#f5f5f5;border-radius:6px;color:#666">${inv.notes}</div>` : ''}
    </body></html>`;
  }
}
