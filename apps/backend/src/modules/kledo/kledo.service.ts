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

// ── In-memory cache untuk getProducts (cegah 429 rate limit) ─────────
const _productsCache: { data: any; ts: number } = { data: null, ts: 0 };
const _PRODUCTS_TTL = 5 * 60 * 1000; // 5 menit

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

  /* ── Cari atau buat default tenant ────────────────────────────────── */
  private async getOrCreateTenant() {
    let tenant = await this.prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          name: 'RFSANZ',
          slug: 'rfsanz',
          plan: 'trial',
          isActive: true,
        },
      });
      this.logger.log('Default tenant dibuat otomatis untuk menyimpan konfigurasi.');
    }
    return tenant;
  }

  /* ── Simpan config ke DB ───────────────────────────────────────────── */
  async saveConfig(token: string, baseUrl?: string) {
    const tenant = await this.getOrCreateTenant();

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
    const { page = 1, per_page = 500, search, name } = query;
    const searchTerm = search ?? name ?? '';

    // Gunakan cache jika tidak ada search term khusus dan cache masih valid
    const now = Date.now();
    if (!searchTerm && _productsCache.data && (now - _productsCache.ts) < _PRODUCTS_TTL) {
      return _productsCache.data;
    }

    const params: any = { page, per_page };
    if (searchTerm) params.name = searchTerm;
    const headers = await this.getHeaders();
    const baseUrl = await this.getBaseUrl();
    const res = await firstValueFrom(this.http.get(`${baseUrl}/finance/products`, { headers, params }));

    // Simpan ke cache hanya jika tidak ada filter search
    if (!searchTerm) {
      _productsCache.data = res.data;
      _productsCache.ts = now;
    }

    return res.data;
  }

  async getContacts(query: any = {}) {
    const token = await this.getToken();
    if (!token) return { data: { data: [], total: 0, last_page: 1 } };
    const { page = 1, per_page = 500, search, type } = query;
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

  // ── Purchase Invoices (Tagihan Pembelian dari Kledo) ─────────────────
  async getPurchaseInvoices(query: any = {}) {
    const token = await this.getToken();
    if (!token) return { data: { data: [], total: 0, last_page: 1 } };
    const { page = 1, per_page = 25, search, status } = query;
    const params: any = { page, per_page };
    if (search) params.search = search;
    if (status) params.status_id = status;
    const headers = await this.getHeaders();
    const baseUrl = await this.getBaseUrl();
    try {
      const res = await firstValueFrom(this.http.get(`${baseUrl}/finance/purchase-invoices`, { headers, params }));
      return res.data;
    } catch {
      return { data: { data: [], total: 0, last_page: 1 } };
    }
  }

  // ── Expenses (Pengeluaran dari Kledo) ─────────────────────────────────
  async getExpenses(query: any = {}) {
    const token = await this.getToken();
    if (!token) return { data: { data: [], total: 0, last_page: 1 } };
    const { page = 1, per_page = 25, search } = query;
    const params: any = { page, per_page };
    if (search) params.search = search;
    const headers = await this.getHeaders();
    const baseUrl = await this.getBaseUrl();
    try {
      const res = await firstValueFrom(this.http.get(`${baseUrl}/finance/expenses`, { headers, params }));
      return res.data;
    } catch {
      return { data: { data: [], total: 0, last_page: 1 } };
    }
  }

  async findOrCreateContact(name: string, phone?: string): Promise<number> {
    const token = await this.getToken();
    if (!token) return 0;
    const headers = await this.getHeaders();
    const baseUrl = await this.getBaseUrl();
    const TIMEOUT = 8000; // 8 detik max per request

    try {
      /* Gunakan ?search= (bukan ?keyword= yang tidak bekerja) untuk cari cepat */
      const res = await firstValueFrom(
        this.http.get(`${baseUrl}/finance/contacts`, {
          headers,
          params: { search: name, per_page: 10, page: 1 },
          timeout: TIMEOUT,
        }),
      );
      const body = res.data?.data ?? res.data;
      const contacts: any[] = body?.data ?? body ?? [];
      const found = contacts.find(
        (c: any) =>
          c.name?.toLowerCase() === name?.toLowerCase() ||
          (phone && c.phone && c.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')),
      );
      if (found) return found.id;
    } catch (e) {
      this.logger.warn('Gagal cari contact Kledo: ' + e);
    }

    /* Buat kontak baru jika tidak ditemukan */
    try {
      const createRes = await firstValueFrom(
        this.http.post(
          `${baseUrl}/finance/contacts`,
          { name, phone: phone ?? null, type_id: 4, is_customer: 1 },
          { headers, timeout: TIMEOUT },
        ),
      );
      const newId = createRes.data?.data?.id;
      if (newId) return newId;
    } catch (e) {
      this.logger.warn('Gagal buat contact Kledo: ' + e);
    }
    return 0;
  }

  /**
   * Cari finance_account_id Kledo berdasarkan nama produk.
   * Digunakan sebagai fallback ketika kledoProductId tidak tersedia.
   */
  private async findKledoAccountIdByName(nama: string, headers: any, baseUrl: string): Promise<number | null> {
    try {
      const res = await firstValueFrom(
        this.http.get(`${baseUrl}/finance/products`, {
          headers,
          params: { name: nama, per_page: 5, page: 1 },
          timeout: 5000,
        }),
      );
      const body = res.data?.data ?? res.data;
      const list: any[] = body?.data ?? body ?? [];
      const found = list.find(
        (p: any) => p.name?.toLowerCase().trim() === nama?.toLowerCase().trim(),
      ) ?? list[0];
      return found?.id ? Number(found.id) : null;
    } catch {
      return null;
    }
  }

  async createInvoice(dto: {
    namaCustomer: string; noHp?: string; memo?: string; orderId?: number | string;
    noInvoice?: string; salesName?: string;
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

      // Resolusi finance_account_id untuk setiap item
      const resolvedItems: any[] = [];
      for (const it of dto.items) {
        let accountId = it.kledoProductId ? Number(it.kledoProductId) : null;

        // Fallback: cari by nama di Kledo jika ID tidak tersedia
        if (!accountId && it.nama) {
          accountId = await this.findKledoAccountIdByName(it.nama, headers, baseUrl);
          if (accountId) {
            this.logger.log(`[Kledo] Item "${it.nama}" ditemukan by nama → account_id ${accountId}`);
          }
        }

        if (!accountId) {
          this.logger.warn(`[Kledo] Item "${it.nama}" tidak memiliki Kledo Product ID dan tidak ditemukan by nama — item dilewati`);
          continue;
        }

        // unit_id TIDAK dikirim sama sekali — Kledo akan pakai satuan default produk
        const itemPayload: any = {
          finance_account_id: accountId,
          qty: it.qty,
          price: it.harga,
          amount: it.qty * it.harga,
          discount_percent: 0,
          desc: it.nama,
        };
        // Jangan tambah unit_id — biarkan Kledo pakai satuan milik produknya sendiri

        resolvedItems.push(itemPayload);
      }

      if (resolvedItems.length === 0) {
        return {
          success: false,
          message: 'Tidak ada produk yang dapat dipetakan ke Kledo. Pastikan produk dipilih dari dropdown (bukan diketik manual) agar Kledo Product ID tersimpan.',
        };
      }

      // contact_id hanya dikirim jika valid (bukan 0)
      // PENTING: di Kledo, field "memo" tampil sebagai "Referensi" (bukan catatan)
      // ref_number TIDAK dikirim → biar Kledo auto-generate nomor invoice (INV/53xxx)
      const payload: any = {
        trans_date: transDate,
        due_date: dueDate,
        include_tax: 0,
        memo: dto.salesName ?? dto.memo ?? '',
        items: resolvedItems,
      };
      if (contactId && contactId > 0) payload.contact_id = contactId;

      this.logger.log(`[Kledo] Mengirim invoice — contact_id=${contactId}, items=${resolvedItems.length}`);
      this.logger.debug(`[Kledo] Payload: ${JSON.stringify(payload)}`);

      const res = await firstValueFrom(
        this.http.post(`${baseUrl}/finance/invoices`, payload, { headers, timeout: 15000 }),
      );
      // Kledo mengembalikan: { data: { id: ..., trans_no: "INV/53135" } }
      const kledoId    = res.data?.data?.id ?? res.data?.id;
      const kledoTransNo = res.data?.data?.trans_no ?? res.data?.trans_no ?? null;
      this.logger.log(`[Kledo] Response: ${JSON.stringify(res.data)}`);
      return { success: true, kledoInvoiceId: kledoId, kledoTransNo, message: res.data?.message ?? 'Tagihan berhasil dibuat di Kledo' };
    } catch (e: any) {
      const apiMsg = e.response?.data?.message ?? JSON.stringify(e.response?.data) ?? '';
      const msg = e.code === 'ECONNABORTED'
        ? 'Kledo timeout (15 detik)'
        : (apiMsg || e.message);
      this.logger.error(`[Kledo] createInvoice error: status=${e.response?.status} msg=${msg}`);
      return { success: false, message: msg };
    }
  }

  getSpmBrands() { return Object.entries(SPM_BRAND_PIC).map(([brand, pic]) => ({ brand, pic })); }
  isSpmBrand(brand: string) { return brand?.toUpperCase() in SPM_BRAND_PIC; }
  withMargin(price: number, margin = 0.15) { return Math.ceil(price * (1 + margin)); }

  /**
   * Import produk dari Kledo → simpan/update ke tabel Product lokal.
   * Dipakai oleh POST /api/kledo/import-products
   */
  async importProducts() {
    const token = await this.getToken();
    if (!token) return { success: false, imported: 0, message: 'KLEDO_TOKEN belum dikonfigurasi.' };

    const baseUrl = await this.getBaseUrl();
    const headers = await this.getHeaders();
    let page = 1; let imported = 0; let totalPages = 1;

    while (page <= totalPages) {
      const res = await this.http.axiosRef.get(`${baseUrl}/finance/products`, {
        headers,
        params: { page, per_page: 500 },
      });
      const body = res.data?.data ?? res.data;
      const items: any[] = body?.data ?? body ?? [];
      totalPages = body?.last_page ?? 1;

      for (const item of items) {
        try {
          await this.prisma.appSetting.upsert({
            where: { key: `kledo_product_${item.id}` },
            update: { value: JSON.stringify(item) },
            create: {
              key: `kledo_product_${item.id}`,
              value: JSON.stringify(item),
              tenantId: (await this.getOrCreateTenant()).id,
            },
          });
          imported++;
        } catch { /* skip individual failures */ }
      }
      page++;
    }

    return { success: true, imported, message: `${imported} produk berhasil diimport dari Kledo.` };
  }

  /**
   * Push invoice lokal ERP ke Kledo.
   * Dipakai oleh POST /api/kledo/push-invoice/:localInvoiceId
   */
  async pushInvoice(localInvoiceId: string) {
    const token = await this.getToken();
    if (!token) return { success: false, message: 'KLEDO_TOKEN belum dikonfigurasi.' };

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: localInvoiceId },
      include: { items: true, customer: true },
    }).catch(() => null);

    if (!invoice) return { success: false, message: `Invoice ${localInvoiceId} tidak ditemukan.` };

    const contactId = await this.findOrCreateContact(
      invoice.customer?.name ?? 'Customer ERP',
      invoice.customer?.phone ?? undefined,
    );

    const result = await this.createInvoice({
      contactId,
      dueDate: invoice.dueDate?.toISOString() ?? new Date().toISOString(),
      items: (invoice.items ?? []).map((it: any) => ({
        productId: it.kledoProductId ?? 0,
        qty: it.qty ?? 1,
        price: it.price ?? 0,
        discount: it.discount ?? 0,
      })),
    } as any);

    if (result.success && result.kledoInvoiceId) {
      await this.prisma.invoice.update({
        where: { id: localInvoiceId },
        data: { kledoInvoiceId: String(result.kledoInvoiceId) } as any,
      }).catch(() => { /* field may not exist in all schemas */ });
    }

    return result;
  }

  /**
   * Ambil semua halaman produk dari Kledo, simpan/update ke tabel Product lokal.
   */
  async syncProducts(): Promise<{ success: boolean; imported: number; updated: number; message: string }> {
    const token = await this.getToken();
    if (!token) return { success: false, imported: 0, updated: 0, message: 'KLEDO_TOKEN belum dikonfigurasi.' };

    const tenant = await this.getOrCreateTenant();
    const baseUrl = await this.getBaseUrl();
    const headers = await this.getHeaders();

    let page = 1;
    let totalPages = 1;
    let imported = 0;
    let updated = 0;

    while (page <= totalPages) {
      try {
        const res = await this.http.axiosRef.get(`${baseUrl}/finance/products`, {
          headers,
          params: { page, per_page: 500 },
        });
        const body = res.data?.data ?? res.data;
        const items: any[] = body?.data ?? body ?? [];
        totalPages = body?.last_page ?? 1;

        for (const item of items) {
          try {
            const kledoId = String(item.id);
            const sku = (item.code || item.sku || `KLEDO-${kledoId}`).trim().substring(0, 100);
            const hargaJualKledo = Number(item.price         ?? item.sell_price      ?? 0);
            const hargaBeli      = Number(item.base_price    ?? item.buy_price       ?? item.purchase_price ?? 0);
            const hpp            = Number(item.avg_base_price ?? item.hpp            ?? item.cost_price     ?? item.cogs ?? 0);
            const price          = Math.max(hargaJualKledo, hargaBeli, hpp);

            const existing = await this.prisma.product.findFirst({
              where: { kledoProductId: kledoId, tenantId: tenant.id },
            });

            const hargaJual = price; // harga tertinggi dari max(jual, beli, hpp)

            if (existing) {
              await this.prisma.product.update({
                where: { id: existing.id },
                data: {
                  name: item.name ?? existing.name,
                  hargaKledo: hargaJualKledo,
                  hargaBeli: hargaBeli > 0 ? hargaBeli : existing.hargaBeli,
                  hargaJual: hargaJual,
                  updatedAt: new Date(),
                },
              });
              updated++;
            } else {
              const skuFinal = await this.prisma.product.findUnique({ where: { sku } })
                ? `${sku}-K${kledoId}`
                : sku;
              await this.prisma.product.create({
                data: {
                  tenantId: tenant.id,
                  sku: skuFinal,
                  name: item.name ?? 'Produk Kledo',
                  kledoProductId: kledoId,
                  hargaKledo: hargaJualKledo,
                  hargaJual: hargaJual,
                  hargaBeli: hargaBeli,
                  stok: 0,
                  active: true,
                },
              });
              imported++;
            }
          } catch { /* skip individual failures */ }
        }

        page++;
      } catch (e: any) {
        this.logger.error('syncProducts page error: ' + e?.message);
        break;
      }
    }

    const message = `Produk: ${imported} ditambahkan, ${updated} diperbarui dari Kledo.`;
    this.logger.log(message);
    return { success: true, imported, updated, message };
  }

  /**
   * Ambil semua halaman kontak customer dari Kledo, simpan/update ke tabel Customer lokal.
   */
  async syncContacts(): Promise<{ success: boolean; imported: number; updated: number; message: string }> {
    const token = await this.getToken();
    if (!token) return { success: false, imported: 0, updated: 0, message: 'KLEDO_TOKEN belum dikonfigurasi.' };

    const tenant = await this.getOrCreateTenant();
    const baseUrl = await this.getBaseUrl();
    const headers = await this.getHeaders();

    let page = 1;
    let totalPages = 1;
    let imported = 0;
    let updated = 0;

    while (page <= totalPages) {
      try {
        const res = await this.http.axiosRef.get(`${baseUrl}/finance/contacts`, {
          headers,
          params: { page, per_page: 500 },
        });
        const body = res.data?.data ?? res.data;
        const items: any[] = body?.data ?? body ?? [];
        totalPages = body?.last_page ?? 1;

        this.logger.log(`syncContacts: halaman ${page}/${totalPages}, ${items.length} kontak`);

        for (const item of items) {
          try {
            const kledoId = String(item.id);

            const existing = await this.prisma.customer.findFirst({
              where: { kledoId, tenantId: tenant.id },
            });

            if (existing) {
              await this.prisma.customer.update({
                where: { id: existing.id },
                data: {
                  name: item.name ?? existing.name,
                  phone: item.phone ?? existing.phone,
                  email: item.email ?? existing.email,
                  address: item.address ?? existing.address,
                },
              });
              updated++;
            } else {
              await this.prisma.customer.create({
                data: {
                  tenantId: tenant.id,
                  name: item.name ?? 'Kontak Kledo',
                  phone: item.phone ?? null,
                  email: item.email ?? null,
                  address: item.address ?? null,
                  kledoId,
                  active: true,
                },
              });
              imported++;
            }
          } catch (err: any) {
            this.logger.warn(`syncContacts skip kontak ${item?.id}: ${err?.message}`);
          }
        }

        page++;
      } catch (e: any) {
        this.logger.error('syncContacts page error: ' + e?.message);
        break;
      }
    }

    const message = `Kontak: ${imported} ditambahkan, ${updated} diperbarui dari Kledo.`;
    this.logger.log(message);
    return { success: true, imported, updated, message };
  }

  async syncInvoices(_limit = 500) { return { success: true, message: 'Invoice diambil langsung dari Kledo saat dibutuhkan.' }; }

  async syncAll() {
    const [prodResult, contResult] = await Promise.allSettled([
      this.syncProducts(),
      this.syncContacts(),
    ]);
    const prod = prodResult.status === 'fulfilled' ? prodResult.value : { imported: 0, updated: 0 };
    const cont = contResult.status === 'fulfilled' ? contResult.value : { imported: 0, updated: 0 };
    return {
      success: true,
      productsImported: prod.imported,
      productsUpdated: prod.updated,
      contactsImported: cont.imported,
      contactsUpdated: cont.updated,
      message: `Sync selesai — Produk: ${prod.imported} baru, ${prod.updated} diperbarui. Kontak: ${cont.imported} baru, ${cont.updated} diperbarui.`,
    };
  }

  async syncNow() { return this.syncAll(); }

  async autoSync() {
    const token = await this.getToken();
    if (!token) return { success: false, message: 'Token belum dikonfigurasi.' };
    return this.syncAll();
  }

  async getSyncLogs(_query: any) { return { data: [], total: 0 }; }
}
