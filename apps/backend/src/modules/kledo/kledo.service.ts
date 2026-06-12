import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../database/prisma.service.js';

const SPM_BRAND_PIC: Record<string, string> = {
  'ASPIRA': 'Ahmad Santoso', 'FEDERAL': 'Budi Pratama', 'YAMAHA': 'CV Maju Jaya',
  'HONDA': 'PT Sumber Makmur', 'SUZUKI': 'Dewi Lestari', 'KAWASAKI': 'Eko Prasetyo',
};

const DB_KEY_TOKEN   = 'kledo_token';
const DB_KEY_BASEURL = 'kledo_base_url';

@Injectable()
export class KledoService {
  private readonly logger = new Logger(KledoService.name);

  constructor(
    @Inject(HttpService) private readonly http: HttpService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  /* ── Token: baca dari DB dulu, fallback ke env var ────────────────── */
  async getToken(): Promise<string> {
    try {
      const row = await this.prisma.appSetting.findUnique({ where: { key: DB_KEY_TOKEN } });
      if (row?.value) return row.value;
    } catch { /* ignore */ }
    return process.env.KLEDO_TOKEN || '';
  }

  async getBaseUrl(): Promise<string> {
    try {
      const row = await this.prisma.appSetting.findUnique({ where: { key: DB_KEY_BASEURL } });
      if (row?.value) return row.value;
    } catch { /* ignore */ }
    return process.env.KLEDO_BASE_URL || 'https://api.kledo.com/api/v1';
  }

  private async getHeaders() {
    const token = await this.getToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  /* ── Simpan config ke DB ───────────────────────────────────────────── */
  async saveConfig(token: string, baseUrl?: string) {
    const tenant = await this.prisma.tenant.findFirst();
    if (!tenant) throw new Error('Tenant belum ada di database. Jalankan seed terlebih dahulu.');

    await this.prisma.appSetting.upsert({
      where: { key: DB_KEY_TOKEN },
      update: { value: token },
      create: { key: DB_KEY_TOKEN, value: token, tenantId: tenant.id },
    });

    if (baseUrl) {
      await this.prisma.appSetting.upsert({
        where: { key: DB_KEY_BASEURL },
        update: { value: baseUrl },
        create: { key: DB_KEY_BASEURL, value: baseUrl, tenantId: tenant.id },
      });
    }

    return { message: 'Konfigurasi Kledo berhasil disimpan' };
  }

  /* ── Ambil config (token di-mask) ─────────────────────────────────── */
  async getConfig() {
    const token   = await this.getToken();
    const baseUrl = await this.getBaseUrl();
    const source  = (() => {
      try {
        // jika ada di DB, source = 'database'; jika dari env, source = 'env'
      } catch { /* ignore */ }
    })();
    void source;

    const masked = token
      ? token.length > 8
        ? token.slice(0, 4) + '••••••••••••' + token.slice(-4)
        : '••••••••'
      : '';

    return {
      tokenSet: !!token,
      tokenMasked: masked,
      baseUrl,
      source: process.env.KLEDO_TOKEN ? 'env' : token ? 'database' : 'none',
    };
  }

  /* ── Status koneksi ────────────────────────────────────────────────── */
  async getStatus() {
    const token = await this.getToken();
    if (!token) return { connected: false, message: 'KLEDO_TOKEN belum dikonfigurasi. Isi di Settings → API & Integrasi.' };
    try {
      const headers = await this.getHeaders();
      const baseUrl = await this.getBaseUrl();
      await firstValueFrom(this.http.get(`${baseUrl}/finance/products?per_page=1`, { headers }));
      return { connected: true, message: 'Kledo terhubung' };
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Koneksi gagal';
      return { connected: false, message: msg };
    }
  }

  async getProducts(query: any = {}) {
    const token = await this.getToken();
    if (!token) return { data: { data: [], total: 0, last_page: 1 } };
    const { page = 1, per_page = 50, search } = query;
    const params: any = { page, per_page };
    if (search) params.name = search;
    const headers = await this.getHeaders();
    const baseUrl = await this.getBaseUrl();
    const res = await firstValueFrom(this.http.get(`${baseUrl}/finance/products`, { headers, params }));
    return res.data;
  }

  async getContacts(query: any = {}) {
    const token = await this.getToken();
    if (!token) return { data: { data: [], total: 0, last_page: 1 } };
    const { page = 1, per_page = 50, search, type } = query;
    const params: any = { page, per_page };
    if (search) params.name = search;
    if (type === 'customer') params.is_customer = 1;
    else if (type === 'vendor') params.is_vendor = 1;
    const headers = await this.getHeaders();
    const baseUrl = await this.getBaseUrl();
    const res = await firstValueFrom(this.http.get(`${baseUrl}/finance/contacts`, { headers, params }));
    return res.data;
  }

  async createContact(dto: { name: string; phone?: string; email?: string; address?: string }) {
    const token = await this.getToken();
    if (!token) throw new Error('KLEDO_TOKEN belum dikonfigurasi');
    const headers = await this.getHeaders();
    const baseUrl = await this.getBaseUrl();
    const res = await firstValueFrom(
      this.http.post(
        `${baseUrl}/finance/contacts`,
        { name: dto.name, phone: dto.phone ?? null, email: dto.email ?? null, address: dto.address ?? null, type_id: 4, is_customer: 1 },
        { headers },
      ),
    );
    return res.data;
  }

  async updateContact(id: number, dto: { name?: string; phone?: string; email?: string; address?: string }) {
    const token = await this.getToken();
    if (!token) throw new Error('KLEDO_TOKEN belum dikonfigurasi');
    const headers = await this.getHeaders();
    const baseUrl = await this.getBaseUrl();
    const res = await firstValueFrom(this.http.put(`${baseUrl}/finance/contacts/${id}`, dto, { headers }));
    return res.data;
  }

  async deleteContact(id: number) {
    const token = await this.getToken();
    if (!token) throw new Error('KLEDO_TOKEN belum dikonfigurasi');
    const headers = await this.getHeaders();
    const baseUrl = await this.getBaseUrl();
    const res = await firstValueFrom(this.http.delete(`${baseUrl}/finance/contacts/${id}`, { headers }));
    return res.data;
  }

  async getInvoices(query: any = {}) {
    const token = await this.getToken();
    if (!token) return { data: { data: [], total: 0, last_page: 1 } };
    const headers = await this.getHeaders();
    const baseUrl = await this.getBaseUrl();
    const res = await firstValueFrom(this.http.get(`${baseUrl}/finance/invoices`, { headers, params: query }));
    return res.data;
  }

  async findOrCreateContact(name: string, phone?: string): Promise<number> {
    const token = await this.getToken();
    if (!token) return 0;
    const headers = await this.getHeaders();
    const baseUrl = await this.getBaseUrl();
    try {
      const res = await firstValueFrom(this.http.get(`${baseUrl}/finance/contacts`, { headers, params: { per_page: 100 } }));
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
        this.http.post(`${baseUrl}/finance/contacts`, { name, phone: phone ?? null, type_id: 4, is_customer: 1 }, { headers }),
      );
      const newId = createRes.data?.data?.id;
      if (newId) return newId;
    } catch (e) {
      this.logger.warn('Gagal buat contact Kledo: ' + e);
    }
    return 0;
  }

  async createInvoice(dto: {
    namaCustomer: string; noHp?: string; memo?: string; orderId?: number | string;
    items: Array<{ kledoProductId?: string | null; nama: string; qty: number; harga: number; unitId?: number }>;
    dueDays?: number;
  }) {
    const token = await this.getToken();
    if (!token) return { success: false, message: 'KLEDO_TOKEN belum dikonfigurasi' };
    try {
      const headers = await this.getHeaders();
      const baseUrl = await this.getBaseUrl();
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
      const res = await firstValueFrom(this.http.post(`${baseUrl}/finance/invoices`, payload, { headers }));
      const kledoId = res.data?.id ?? res.data?.data?.id;
      return { success: true, kledoInvoiceId: kledoId, message: res.data?.message ?? 'Tagihan berhasil dibuat' };
    } catch (e: any) {
      return { success: false, message: e.response?.data?.message ?? e.message };
    }
  }

  getSpmBrands() { return Object.entries(SPM_BRAND_PIC).map(([brand, pic]) => ({ brand, pic })); }
  isSpmBrand(brand: string) { return brand?.toUpperCase() in SPM_BRAND_PIC; }
  withMargin(price: number, margin = 0.15) { return Math.ceil(price * (1 + margin)); }

  async syncProducts() { return { jobId: '', message: 'Sync ke database lokal dinonaktifkan. Data langsung dari Kledo.' }; }
  async syncContacts() { return { jobId: '', message: 'Sync ke database lokal dinonaktifkan. Data langsung dari Kledo.' }; }
  async syncInvoices(_limit = 500) { return { jobId: '', message: 'Sync ke database lokal dinonaktifkan. Data langsung dari Kledo.' }; }
  async syncAll() { return { jobs: { products: '', contacts: '', invoices: '' }, message: 'Sync ke database lokal dinonaktifkan. Data langsung dari Kledo.' }; }
  async syncNow() { return this.syncProducts(); }
  async autoSync() { return { message: 'Auto sync dinonaktifkan' }; }
  async getSyncLogs(_query: any) { return { data: [], total: 0 }; }
}
