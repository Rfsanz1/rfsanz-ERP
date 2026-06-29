const BACKEND_RAW = process.env.BACKEND_URL || '';
const BACKEND = BACKEND_RAW && !BACKEND_RAW.startsWith('http')
  ? `https://${BACKEND_RAW}`
  : BACKEND_RAW;

export async function getKledoCfg(authHeader: string): Promise<{ token: string; baseUrl: string } | null> {
  const BASE = 'https://api.kledo.com/api/v1';

  // 1. Env var (Replit / Docker env)
  if (process.env.KLEDO_TOKEN) {
    return { token: process.env.KLEDO_TOKEN, baseUrl: BASE };
  }

  // 2a. Tabel local_settings (frontend-managed settings)
  try {
    const { getLocalSetting, ensureTables } = await import('./localDb');
    await ensureTables();
    const dbToken = await getLocalSetting('kledo_token');
    if (dbToken) return { token: dbToken, baseUrl: BASE };
  } catch {}

  // 2b. Tabel "AppSetting" (Prisma/NestJS backend — dipakai di aaPanel/self-hosted)
  //     Backend menyimpan kledo_token di sini via halaman Pengaturan
  if (process.env.DATABASE_URL) {
    try {
      const { getDb } = await import('./localDb');
      const db = getDb();
      const r = await db.query(
        `SELECT value FROM "AppSetting" WHERE key = 'kledo_token' LIMIT 1`,
      );
      const token = r.rows[0]?.value;
      if (token) return { token, baseUrl: BASE };
    } catch {}
  }

  // 3. Fallback: ambil dari backend API (coba port 3000 dulu, lalu BACKEND_URL)
  const backendCandidates = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    BACKEND,
  ].filter(Boolean);

  for (const base of backendCandidates) {
    try {
      const r = await fetch(`${base}/api/settings`, {
        headers: { Authorization: authHeader, 'ngrok-skip-browser-warning': '1' },
        signal: AbortSignal.timeout(3000),
      });
      if (r.ok) {
        const d = await r.json();
        const token = d?.data?.kledo_token ?? '';
        if (token) return { token, baseUrl: BASE };
      }
    } catch {}
  }

  return null;
}

/**
 * Cari finance_account_id yang valid untuk item invoice Kledo.
 * Kledo memakai "product account" (akun produk/pendapatan penjualan) yang
 * BERBEDA dari akun chart-of-accounts biasa. Endpoint /finance/accounts
 * hanya menampilkan COA (id ≤ 1500-an); akun produk seperti id 3234 tidak
 * muncul di sana. Kita ambil dari produk pertama yang ada sebagai referensi,
 * dan fallback ke KLEDO_DEFAULT_INCOME_ACCOUNT (env) atau 3234 jika gagal.
 */
export async function getDefaultFinanceAccount(baseUrl: string, token: string): Promise<number | null> {
  // Env override — bisa diset manual jika tahu account id yang valid
  if (process.env.KLEDO_DEFAULT_INCOME_ACCOUNT) {
    return Number(process.env.KLEDO_DEFAULT_INCOME_ACCOUNT);
  }

  // Ambil dari produk pertama Kledo — finance_account_id produk sudah pasti valid
  try {
    const r = await fetch(`${baseUrl}/finance/products?per_page=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      const d = await r.json();
      const products: any[] = d?.data?.data ?? d?.data ?? [];
      if (products.length > 0) {
        const accId = products[0].income_account_id ?? products[0].account_id;
        if (accId) return Number(accId);
      }
    }
  } catch {}

  // Fallback hardcoded: akun "Penjualan" Kledo yang diketahui valid (dari invoice existing)
  return 3234;
}

/**
 * Cari kontak Kledo berdasarkan nama/telepon; jika tidak ada, buat baru.
 * Kembalikan contact_id (number) atau null jika gagal.
 * CATATAN: param yang benar di Kledo adalah `?search=` bukan `?keyword=`
 */
export async function findOrCreateKledoContact(
  baseUrl: string,
  token: string,
  namaCustomer: string,
  noHp?: string | null,
): Promise<number | null> {
  if (!namaCustomer) return null;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const nameLower   = namaCustomer.toLowerCase();
  const phoneClean  = (noHp ?? '').replace(/\D/g, '').slice(-8);

  const findInList = (items: any[]): number | null => {
    const match = items.find(c => {
      const cName  = (c.name  ?? '').toLowerCase();
      const cPhone = (c.phone ?? '').replace(/\D/g, '');
      return cName === nameLower || (phoneClean && cPhone.endsWith(phoneClean));
    });
    return match ? Number(match.id) : null;
  };

  // 1. Cari dulu pakai ?search= (parameter yang benar di Kledo, bukan ?keyword=)
  try {
    const sr = await fetch(
      `${baseUrl}/finance/contacts?search=${encodeURIComponent(namaCustomer)}&per_page=100`,
      { headers },
    );
    if (sr.ok) {
      const sd    = await sr.json();
      const items = sd?.data?.data ?? sd?.data ?? [];
      const found = findInList(items);
      if (found) return found;
    }
  } catch {}

  // 2. Belum ketemu → buat kontak baru (type_id:3 = customer di Kledo)
  try {
    const body: any = { name: namaCustomer, type_id: 3 };
    if (noHp) body.phone = noHp;
    const cr = await fetch(`${baseUrl}/finance/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const cd = await cr.json();
    // Sukses buat baru
    if (cr.ok && cd?.data?.id) return Number(cd.data.id);
    // Gagal karena nama sudah ada → cari lagi (mungkin dibuat sebelumnya)
    if (!cr.ok && (cd?.message ?? '').includes('sudah ada')) {
      // Cari ulang dengan search lebih luas
      const sr2 = await fetch(
        `${baseUrl}/finance/contacts?search=${encodeURIComponent(namaCustomer)}&per_page=200`,
        { headers },
      );
      if (sr2.ok) {
        const sd2   = await sr2.json();
        const items2 = sd2?.data?.data ?? sd2?.data ?? [];
        const found2 = findInList(items2);
        if (found2) return found2;
      }
    }
  } catch {}

  return null;
}

/**
 * Keyword mapping: bankKey → kata kunci pencarian di nama akun Kledo.
 *
 * Pemetaan akun Kledo:
 *   Transfer BCA     → "BCA Giro"
 *   Transfer BRI     → "BRI EDC"
 *   Transfer Mandiri → "Mandiri"
 *   Transfer BNI     → "BNI"
 *   Debit BCA EDC   → "BCA EDC"   (akun berbeda dari BCA Giro)
 *   Debit BRI EDC   → "BRI EDC"   (sama dengan transfer BRI)
 *   Debit BNI       → "BNI"
 *   Cash Elektronik  → "KAS ELEKTRONIK"
 *   Cash Sulawesi    → "KAS SULAWESI"
 */
const BANK_KEYWORDS: Record<string, string[]> = {
  /* Transfer Bank */
  bca:            ['bca giro', 'giro bca'],            // Transfer BCA → BCA Giro
  bri:            ['bri edc', 'edc bri', 'bri'],       // Transfer BRI → BRI EDC
  mandiri:        ['mandiri'],
  bni:            ['bni'],

  /* Debit EDC */
  bca_edc:        ['bca edc', 'edc bca'],              // EDC BCA → BCA EDC (bukan BCA Giro)
  bri_edc:        ['bri edc', 'edc bri', 'bri'],       // EDC BRI → BRI EDC
  bni_edc:        ['bni'],

  /* Cash unit bisnis */
  elektronik:     ['kas elektronik', 'elektronik'],
  bahan_bangunan: ['kas sulawesi', 'sulawesi'],
};

/** Cari finance account Kledo berdasarkan nama bank (semua tipe akun) */
export async function getBankAccountId(
  baseUrl: string,
  token: string,
  bankKey: string,
): Promise<number | null> {
  try {
    const r = await fetch(`${baseUrl}/finance/accounts?per_page=200`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const d = await r.json();
    const accounts: any[] = d?.data?.data ?? d?.data ?? [];
    const keywords = BANK_KEYWORDS[bankKey.toLowerCase()] ?? [bankKey.toLowerCase()];

    // Coba match dari keyword yang paling spesifik dulu
    for (const kw of keywords) {
      const match = accounts.find((a: any) =>
        (a.name ?? '').toLowerCase().includes(kw),
      );
      if (match) return match.id;
    }
    return null;
  } catch {
    return null;
  }
}

/** Tandai invoice Kledo sebagai lunas */
export async function markKledoInvoicePaid(
  baseUrl: string,
  token: string,
  invoiceId: number,
  financeAccountId: number,
  amount: number,
  date: string,
  memo?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const payload = {
      trans_date: date,
      finance_account_id: financeAccountId,
      memo: memo ?? 'Pembayaran lunas',
      pay_from: [{ id: invoiceId, amount }],
    };
    const res = await fetch(`${baseUrl}/finance/invoicepayments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) return { ok: true };
    return { ok: false, error: data?.message ?? 'Gagal tandai lunas di Kledo' };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

interface KledoOrderInput {
  soNumber?: string;
  tanggal: string;
  dueDate?: string | null;
  catatan?: string;
  contactId?: number | null;
  contactName?: string;
  diskonTotal?: number;
  pajak?: number;
  ongkir?: number;
  totalHarga?: number;
  metodePembayaran?: string;
  bankPilihan?: string | null;
  edcPilihan?: string | null;
  unitBisnis?: string | null;
  metodeDp?: string | null;
  items: { nama: string; qty: number; harga: number; subtotal: number; diskon?: number; kledoProductId?: string | null }[];
}

export async function pushOrderToKledo(
  authHeader: string,
  order: KledoOrderInput,
): Promise<{
  ok: boolean;
  kledoInvoiceId: number | null;
  kledoRef: string | null;
  kledoPaid?: boolean;
  kledoPaidError?: string;
  error?: string;
}> {
  try {
    const cfg = await getKledoCfg(authHeader);
    if (!cfg) return { ok: false, kledoInvoiceId: null, kledoRef: null, error: 'Token Kledo tidak ditemukan' };

    const defaultAccountId = await getDefaultFinanceAccount(cfg.baseUrl, cfg.token);

    // Resolusi contact_id — wajib di Kledo
    let resolvedContactId = order.contactId ?? null;
    if (!resolvedContactId && order.contactName) {
      resolvedContactId = await findOrCreateKledoContact(
        cfg.baseUrl,
        cfg.token,
        order.contactName,
        (order as any).noHp ?? null,
      );
    }

    const kledoItems = order.items.map(it => {
      const qty    = Number(it.qty ?? 1);
      const rate   = Number(it.harga ?? 0);
      const diskon = Number(it.diskon ?? 0);
      const amount = Math.max(0, qty * rate - diskon);
      const item: any = {
        finance_account_id: defaultAccountId,
        name: it.nama,
        qty,
        rate,
        price: rate,
        amount,
      };
      if (diskon > 0) item.discount = diskon;
      if (it.kledoProductId) item.product_id = Number(it.kledoProductId);
      return item;
    });

    if (order.ongkir && order.ongkir > 0) {
      kledoItems.push({
        finance_account_id: defaultAccountId,
        name: 'Biaya Pengiriman',
        qty: 1,
        rate: order.ongkir,
        price: order.ongkir,
        amount: order.ongkir,
      });
    }

    // due_date wajib di Kledo — pakai dueDate jika ada, fallback ke trans_date
    const payload: any = {
      trans_date: order.tanggal,
      due_date: order.dueDate ?? order.tanggal,
      include_tax: (order.pajak ?? 0) > 0 ? 1 : 0,
      items: kledoItems,
    };
    if (order.soNumber)         payload.ref_number   = order.soNumber;
    if (order.catatan)          payload.memo         = order.catatan;
    if (resolvedContactId)      payload.contact_id   = resolvedContactId;
    else if (order.contactName) payload.contact_name = order.contactName;
    if (order.diskonTotal)  payload.discount     = order.diskonTotal;

    const res = await fetch(`${cfg.baseUrl}/finance/invoices`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data?.data?.id) {
      return { ok: false, kledoInvoiceId: null, kledoRef: null, error: data?.message ?? 'Gagal push ke Kledo' };
    }

    const invoiceId: number = data.data.id;
    const kledoRef: string  = data.data.ref_number ?? null;

    /* ── Auto tandai LUNAS sesuai jalur pembayaran masing-masing ── */
    /*
     * BCA (transfer/EDC) → akun "BCA CV" di Kledo
     * BRI (transfer/EDC) → akun "BRI CV" di Kledo
     * Mandiri / BNI      → akun sesuai nama bank
     * Cash               → KAS ELEKTRONIK / KAS SULAWESI (sesuai unit bisnis)
     * DP                 → ikut sub-metode DP (transfer/debit/cash)
     * COD                → tidak ditandai lunas otomatis (bayar saat tiba)
     */
    let kledoPaid      = false;
    let kledoPaidError: string | undefined;

    const isTransfer = order.metodePembayaran === 'transfer';
    const isDebit    = order.metodePembayaran === 'debit';
    const isCash     = order.metodePembayaran === 'cash';
    const isDp       = order.metodePembayaran === 'dp';
    const bankKey    = order.bankPilihan?.toLowerCase() ?? '';
    const edcKey     = order.edcPilihan?.toLowerCase() ?? '';
    const unitKey    = order.unitBisnis?.toLowerCase() ?? '';
    const dpMetode   = order.metodeDp?.toLowerCase() ?? '';

    const EDC_MEMO: Record<string, string> = {
      bca_edc: 'BCA EDC',
      bri_edc: 'BRI EDC',
      bni_edc: 'BNI',
    };
    const UNIT_MEMO: Record<string, string> = {
      elektronik:     'KAS ELEKTRONIK',
      bahan_bangunan: 'KAS SULAWESI',
    };
    const BANK_MEMO: Record<string, string> = {
      bca:     'BCA Giro',
      bri:     'BRI EDC',
      mandiri: 'Mandiri',
      bni:     'BNI',
    };

    /* Tentukan akun & memo berdasarkan metode — tanpa fallback generik */
    let activeKey  = '';
    let activeMemo = '';

    if (isTransfer && bankKey) {
      activeKey  = bankKey;
      activeMemo = BANK_MEMO[bankKey] ?? bankKey.toUpperCase();
    } else if (isDebit && edcKey) {
      activeKey  = edcKey;
      activeMemo = EDC_MEMO[edcKey] ?? edcKey.toUpperCase();
    } else if (isCash && unitKey) {
      activeKey  = unitKey;
      activeMemo = UNIT_MEMO[unitKey] ?? unitKey.toUpperCase();
    } else if (isDp) {
      if (dpMetode === 'transfer' && bankKey) {
        activeKey  = bankKey;
        activeMemo = BANK_MEMO[bankKey] ?? bankKey.toUpperCase();
      } else if (dpMetode === 'debit' && edcKey) {
        activeKey  = edcKey;
        activeMemo = EDC_MEMO[edcKey] ?? edcKey.toUpperCase();
      } else if (dpMetode === 'cash' && unitKey) {
        activeKey  = unitKey;
        activeMemo = UNIT_MEMO[unitKey] ?? unitKey.toUpperCase();
      }
    }
    /* COD: tidak otomatis lunas — bayar saat barang tiba, dicatat manual */

    const totalAmount = order.totalHarga ?? order.items.reduce((s, it) => s + (it.subtotal ?? 0), 0);
    if (activeKey) {
      const bankAccountId = await getBankAccountId(cfg.baseUrl, cfg.token, activeKey);
      if (bankAccountId) {
        const paid = await markKledoInvoicePaid(
          cfg.baseUrl,
          cfg.token,
          invoiceId,
          bankAccountId,
          totalAmount,
          order.tanggal,
          `Pembayaran ${activeMemo} — ${order.soNumber ?? ''}`.trim(),
        );
        kledoPaid      = paid.ok;
        kledoPaidError = paid.error;
      } else {
        kledoPaidError = `Akun ${activeMemo} tidak ditemukan di Kledo`;
      }
    }

    return { ok: true, kledoInvoiceId: invoiceId, kledoRef, kledoPaid, kledoPaidError };
  } catch (e: any) {
    return { ok: false, kledoInvoiceId: null, kledoRef: null, error: e.message };
  }
}
