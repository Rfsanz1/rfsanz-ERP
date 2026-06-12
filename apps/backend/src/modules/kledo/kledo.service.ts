import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../database/prisma.service.js';
import { firstValueFrom } from 'rxjs';

const SPM_BRAND_PIC: Record<string, string> = {
  'ASPIRA': 'Ahmad Santoso', 'FEDERAL': 'Budi Pratama', 'YAMAHA': 'CV Maju Jaya',
  'HONDA': 'PT Sumber Makmur', 'SUZUKI': 'Dewi Lestari', 'KAWASAKI': 'Eko Prasetyo',
};

@Injectable()
export class KledoService {
  private readonly logger = new Logger(KledoService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(
    @Inject(HttpService) private readonly http: HttpService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {
    this.baseUrl = process.env.KLEDO_BASE_URL || 'https://api.kledo.com/api/v1';
    this.token = process.env.KLEDO_TOKEN || '';
  }

  private get headers() {
    return { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' };
  }

  /** Ambil tenantId default (tenant pertama) untuk operasi sync */
  private async getDefaultTenantId(): Promise<string> {
    const tenant = await this.prisma.tenant.findFirst({ select: { id: true } });
    if (!tenant) throw new Error('Tidak ada tenant di database');
    return tenant.id;
  }

  async getStatus() {
    if (!this.token) return { connected: false, message: 'KLEDO_TOKEN tidak dikonfigurasi' };
    try {
      await firstValueFrom(this.http.get(`${this.baseUrl}/finance/products?per_page=1`, { headers: this.headers }));
      return { connected: true, message: 'Kledo terhubung' };
    } catch (e: any) {
      return { connected: false, message: e.message };
    }
  }

  async getProducts(query: any = {}) {
    const { page = 1, per_page = 50, search } = query;
    const params: any = { page, per_page };
    if (search) params.name = search;
    const res = await firstValueFrom(this.http.get(`${this.baseUrl}/finance/products`, { headers: this.headers, params }));
    return res.data;
  }

  async getContacts(query: any = {}) {
    if (!this.token) return { data: { data: [], total: 0, last_page: 1 } };
    const { page = 1, per_page = 50, search, type } = query;
    const params: any = { page, per_page };
    if (search) params.name = search;
    if (type === 'customer') params.is_customer = 1;
    else if (type === 'vendor') params.is_vendor = 1;
    const res = await firstValueFrom(this.http.get(`${this.baseUrl}/finance/contacts`, { headers: this.headers, params }));
    return res.data;
  }

  async createContact(dto: { name: string; phone?: string; email?: string; address?: string }) {
    if (!this.token) throw new Error('KLEDO_TOKEN tidak dikonfigurasi');
    const res = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/finance/contacts`,
        { name: dto.name, phone: dto.phone ?? null, email: dto.email ?? null, address: dto.address ?? null, type_id: 4, is_customer: 1 },
        { headers: this.headers },
      ),
    );
    return res.data;
  }

  async updateContact(id: number, dto: { name?: string; phone?: string; email?: string; address?: string }) {
    if (!this.token) throw new Error('KLEDO_TOKEN tidak dikonfigurasi');
    const res = await firstValueFrom(
      this.http.put(`${this.baseUrl}/finance/contacts/${id}`, dto, { headers: this.headers }),
    );
    return res.data;
  }

  async deleteContact(id: number) {
    if (!this.token) throw new Error('KLEDO_TOKEN tidak dikonfigurasi');
    const res = await firstValueFrom(
      this.http.delete(`${this.baseUrl}/finance/contacts/${id}`, { headers: this.headers }),
    );
    return res.data;
  }

  async getInvoices(query: any = {}) {
    const res = await firstValueFrom(this.http.get(`${this.baseUrl}/finance/invoices`, { headers: this.headers, params: query }));
    return res.data;
  }

  async findOrCreateContact(name: string, phone?: string): Promise<number> {
    try {
      const res = await firstValueFrom(
        this.http.get(`${this.baseUrl}/finance/contacts`, {
          headers: this.headers,
          params: { per_page: 100 },
        }),
      );
      const contacts: any[] = res.data?.data?.data ?? [];
      const found = contacts.find(
        (c: any) =>
          c.name?.toLowerCase() === name?.toLowerCase() ||
          (phone && c.phone && c.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')),
      );
      if (found) return found.id;
    } catch (e) {
      this.logger.warn('Gagal cari contact Kledo: ' + e);
    }
    try {
      const createRes = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/finance/contacts`,
          { name, phone: phone ?? null, type_id: 4, is_customer: 1 },
          { headers: this.headers },
        ),
      );
      const newId = createRes.data?.data?.id;
      if (newId) return newId;
    } catch (e) {
      this.logger.warn('Gagal buat contact Kledo: ' + e);
    }
    return 2806;
  }

  async createInvoice(dto: {
    namaCustomer: string; noHp?: string; memo?: string; orderId?: number | string;
    items: Array<{ kledoProductId?: string | null; nama: string; qty: number; harga: number; unitId?: number }>;
    dueDays?: number;
  }) {
    if (!this.token) return { success: false, message: 'KLEDO_TOKEN tidak dikonfigurasi' };
    try {
      const contactId = await this.findOrCreateContact(dto.namaCustomer, dto.noHp);
      const today = new Date();
      const transDate = today.toISOString().split('T')[0];
      const dueDate = new Date(today.getTime() + (dto.dueDays ?? 30) * 86400000).toISOString().split('T')[0];
      const items = dto.items
        .filter((it) => it.kledoProductId)
        .map((it) => ({
          finance_account_id: Number(it.kledoProductId),
          qty: it.qty, price: it.harga, amount: it.qty * it.harga,
          discount_percent: 0, unit_id: it.unitId ?? 1, desc: it.nama,
        }));
      if (items.length === 0) return { success: false, message: 'Tidak ada produk dengan Kledo Product ID' };
      const payload = {
        trans_date: transDate, due_date: dueDate, contact_id: contactId,
        status_id: 3, term_id: 1, include_tax: 0,
        memo: dto.memo ?? (dto.orderId ? `Order #${dto.orderId} - ${dto.namaCustomer}` : dto.namaCustomer),
        items,
      };
      const res = await firstValueFrom(this.http.post(`${this.baseUrl}/finance/invoices`, payload, { headers: this.headers }));
      const kledoId = res.data?.id ?? res.data?.data?.id;
      return { success: true, kledoInvoiceId: kledoId, message: res.data?.message ?? 'Tagihan berhasil dibuat' };
    } catch (e: any) {
      return { success: false, message: e.response?.data?.message ?? e.message };
    }
  }

  getSpmBrands() { return Object.entries(SPM_BRAND_PIC).map(([brand, pic]) => ({ brand, pic })); }
  isSpmBrand(brand: string) { return brand?.toUpperCase() in SPM_BRAND_PIC; }
  withMargin(price: number, margin = 0.15) { return Math.ceil(price * (1 + margin)); }

  /** ─── BACKGROUND SYNC HELPERS ─── */

  /** Jalankan fn di background, update log saat selesai */
  private runBackground(logId: string, fn: () => Promise<{ synced: number }>) {
    setImmediate(async () => {
      try {
        const result = await fn();
        await this.prisma.kledoSyncLog.update({
          where: { id: logId },
          data: { status: 'success', message: `Selesai: ${result.synced} item disync` },
        });
      } catch (err: any) {
        await this.prisma.kledoSyncLog.update({
          where: { id: logId },
          data: { status: 'error', message: err.message ?? 'Error tidak diketahui' },
        }).catch(() => null);
      }
    });
  }

  /** Delay helper */
  private sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

  /** Fetch satu halaman Kledo — dengan retry otomatis saat 429 */
  private async fetchPage(path: string, page: number, perPage = 100, retries = 3): Promise<{ items: any[]; lastPage: number; total: number }> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await firstValueFrom(
          this.http.get(`${this.baseUrl}${path}`, {
            headers: this.headers,
            params: { page, per_page: perPage },
          }),
        );
        const paged = res.data?.data;
        return {
          items: paged?.data ?? [],
          lastPage: paged?.last_page ?? 1,
          total: paged?.total ?? 0,
        };
      } catch (err: any) {
        const status = err?.response?.status ?? err?.status;
        if (status === 429 && attempt < retries) {
          // Rate limited — tunggu makin lama tiap percobaan
          const waitMs = 2000 * (attempt + 1);
          this.logger.warn(`[Kledo] 429 rate limit halaman ${page}. Tunggu ${waitMs}ms lalu coba lagi (percobaan ${attempt + 1}/${retries})...`);
          await this.sleep(waitMs);
          continue;
        }
        throw err;
      }
    }
    // Seharusnya tidak pernah sampai sini
    return { items: [], lastPage: 1, total: 0 };
  }

  /** ─── PRODUK SYNC ─── */
  async syncProducts(): Promise<{ jobId: string; message: string; total?: number }> {
    if (!this.token) return { jobId: '', message: 'KLEDO_TOKEN tidak dikonfigurasi' };

    const tenantId = await this.getDefaultTenantId();
    const PER_PAGE = 100;
    const { total, lastPage } = await this.fetchPage('/finance/products', 1, PER_PAGE);
    const log = await this.prisma.kledoSyncLog.create({
      data: { tenantId, type: 'products', status: 'running', message: `Sync ${total} produk dimulai (${lastPage} halaman)` },
    });

    this.runBackground(log.id, async () => {
      let synced = 0;
      for (let page = 1; page <= lastPage; page++) {
        if (page > 1) await this.sleep(350);
        const { items } = await this.fetchPage('/finance/products', page, PER_PAGE);
        for (const p of items) {
          const sku = p.code?.trim() || p.id?.toString();
          if (!sku) continue;
          await this.prisma.product.upsert({
            where: { sku },
            update: {
              name: p.name ?? sku,
              kledoProductId: p.id?.toString(),
              hargaKledo: p.price ?? p.base_price ?? 0,
              hargaJual: p.price ?? 0,
              hargaBeli: p.base_price ?? 0,
              stok: p.qty ?? 0,
            },
            create: {
              tenantId, sku, name: p.name ?? sku,
              kledoProductId: p.id?.toString(),
              hargaKledo: p.price ?? p.base_price ?? 0,
              hargaJual: p.price ?? 0,
              hargaBeli: p.base_price ?? 0,
              stok: p.qty ?? 0,
            },
          }).catch(() => null);
          synced++;
        }
        if (page % 10 === 0) {
          await this.prisma.kledoSyncLog.update({
            where: { id: log.id },
            data: { message: `Halaman ${page}/${lastPage} — ${synced} produk diproses` },
          }).catch(() => null);
        }
      }
      return { synced };
    });

    return { jobId: log.id, message: `Sync ${total} produk dimulai di background`, total };
  }

  /** ─── KONTAK SYNC ─── */
  async syncContacts(): Promise<{ jobId: string; message: string; total?: number }> {
    if (!this.token) return { jobId: '', message: 'KLEDO_TOKEN tidak dikonfigurasi' };

    const tenantId = await this.getDefaultTenantId();
    const PER_PAGE = 100;
    const { total, lastPage } = await this.fetchPage('/finance/contacts', 1, PER_PAGE);
    const log = await this.prisma.kledoSyncLog.create({
      data: { tenantId, type: 'contacts', status: 'running', message: `Sync ${total} kontak dimulai (${lastPage} halaman)` },
    });

    this.runBackground(log.id, async () => {
      let synced = 0;
      for (let page = 1; page <= lastPage; page++) {
        if (page > 1) await this.sleep(350);
        const { items } = await this.fetchPage('/finance/contacts', page, PER_PAGE);
        for (const c of items) {
          if (!c.name?.trim()) continue;
          await this.prisma.customer.upsert({
            where: { kledoId: c.id?.toString() },
            update: { name: c.name, email: c.email || null, phone: c.phone || null, address: c.address || null },
            create: {
              tenantId, name: c.name, email: c.email || null, phone: c.phone || null,
              address: c.address || null, kledoId: c.id?.toString(),
            },
          }).catch(() => null);
          synced++;
        }
        if (page % 20 === 0) {
          await this.prisma.kledoSyncLog.update({
            where: { id: log.id },
            data: { message: `Halaman ${page}/${lastPage} — ${synced} kontak diproses` },
          }).catch(() => null);
        }
      }
      return { synced };
    });

    return { jobId: log.id, message: `Sync ${total} kontak dimulai di background`, total };
  }

  /** ─── INVOICE SYNC ─── */
  async syncInvoices(limit = 500): Promise<{ jobId: string; message: string }> {
    if (!this.token) return { jobId: '', message: 'KLEDO_TOKEN tidak dikonfigurasi' };

    const tenantId = await this.getDefaultTenantId();
    const log = await this.prisma.kledoSyncLog.create({
      data: { tenantId, type: 'invoices', status: 'running', message: `Sync ${limit} invoice terbaru dimulai` },
    });

    this.runBackground(log.id, async () => {
      const perPage = 100;
      const pages = Math.ceil(limit / perPage);
      let synced = 0;
      for (let page = 1; page <= pages; page++) {
        const res = await firstValueFrom(
          this.http.get(`${this.baseUrl}/finance/invoices`, {
            headers: this.headers,
            params: { page, per_page: perPage, sort: 'trans_date', order: 'desc' },
          }),
        );
        const items: any[] = res.data?.data?.data ?? [];
        if (items.length === 0) break;
        for (const inv of items) {
          if (!inv.ref_number) continue;
          await this.prisma.order.upsert({
            where: { kledoInvoiceId: inv.ref_number },
            update: {
              kledoSynced: true,
              totalHarga: inv.amount ?? 0,
              status: inv.status_id === 4 ? 'paid' : inv.status_id === 1 ? 'draft' : 'pending',
            },
            create: {
              namaCustomer: inv.contact?.name ?? 'Kledo Customer',
              totalHarga: inv.amount ?? 0,
              kledoInvoiceId: inv.ref_number,
              kledoSynced: true,
              status: inv.status_id === 4 ? 'paid' : inv.status_id === 1 ? 'draft' : 'pending',
            },
          }).catch(() => null);
          synced++;
        }
      }
      return { synced };
    });

    return { jobId: log.id, message: `Sync ${limit} invoice terbaru dimulai di background` };
  }

  /** ─── SYNC ALL (background semua) ─── */
  async syncAll(): Promise<{ jobs: { products: string; contacts: string; invoices: string }; message: string }> {
    if (!this.token) throw new Error('KLEDO_TOKEN tidak dikonfigurasi');
    const [p, c, i] = await Promise.all([
      this.syncProducts(),
      this.syncContacts(),
      this.syncInvoices(500),
    ]);
    return {
      jobs: { products: p.jobId, contacts: c.jobId, invoices: i.jobId },
      message: `Sync berjalan di background. Produk: ${p.total}, Kontak: ${c.total}. Pantau via /kledo/sync-logs`,
    };
  }

  /** ─── LEGACY ─── */
  async syncNow() { return this.syncProducts(); }
  async autoSync() { this.syncProducts().catch(() => null); return { message: 'Auto sync dimulai' }; }

  async getSyncLogs(query: any) {
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.prisma.kledoSyncLog.findMany({ skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      this.prisma.kledoSyncLog.count(),
    ]);
    return { data, total };
  }
}
