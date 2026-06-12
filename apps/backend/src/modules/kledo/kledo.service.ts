import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const SPM_BRAND_PIC: Record<string, string> = {
  'ASPIRA': 'Ahmad Santoso', 'FEDERAL': 'Budi Pratama', 'YAMAHA': 'CV Maju Jaya',
  'HONDA': 'PT Sumber Makmur', 'SUZUKI': 'Dewi Lestari', 'KAWASAKI': 'Eko Prasetyo',
};

@Injectable()
export class KledoService {
  private readonly logger = new Logger(KledoService.name);

  constructor(@Inject(HttpService) private readonly http: HttpService) {}

  private get baseUrl(): string {
    return process.env.KLEDO_BASE_URL || 'https://api.kledo.com/api/v1';
  }

  private get token(): string {
    return process.env.KLEDO_TOKEN || '';
  }

  private get headers() {
    return { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' };
  }

  async getStatus() {
    if (!this.token) return { connected: false, message: 'KLEDO_TOKEN tidak dikonfigurasi di .env' };
    try {
      await firstValueFrom(this.http.get(`${this.baseUrl}/finance/products?per_page=1`, { headers: this.headers }));
      return { connected: true, message: 'Kledo terhubung' };
    } catch (e: any) {
      return { connected: false, message: e.message };
    }
  }

  async getProducts(query: any = {}) {
    if (!this.token) return { data: { data: [], total: 0, last_page: 1 } };
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
    if (!this.token) return { data: { data: [], total: 0, last_page: 1 } };
    const res = await firstValueFrom(this.http.get(`${this.baseUrl}/finance/invoices`, { headers: this.headers, params: query }));
    return res.data;
  }

  async findOrCreateContact(name: string, phone?: string): Promise<number> {
    if (!this.token) return 0;
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
    return 0;
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

  async syncProducts() { return { jobId: '', message: 'Sync ke database lokal dinonaktifkan. Data langsung dari Kledo.' }; }
  async syncContacts() { return { jobId: '', message: 'Sync ke database lokal dinonaktifkan. Data langsung dari Kledo.' }; }
  async syncInvoices(_limit = 500) { return { jobId: '', message: 'Sync ke database lokal dinonaktifkan. Data langsung dari Kledo.' }; }
  async syncAll() { return { jobs: { products: '', contacts: '', invoices: '' }, message: 'Sync ke database lokal dinonaktifkan. Data langsung dari Kledo.' }; }
  async syncNow() { return this.syncProducts(); }
  async autoSync() { return { message: 'Auto sync dinonaktifkan' }; }
  async getSyncLogs(_query: any) { return { data: [], total: 0 }; }
}
