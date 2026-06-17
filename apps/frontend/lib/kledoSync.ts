const BACKEND_RAW = process.env.BACKEND_URL || '';
const BACKEND = BACKEND_RAW && !BACKEND_RAW.startsWith('http')
  ? `https://${BACKEND_RAW}`
  : BACKEND_RAW;

export async function getKledoCfg(authHeader: string): Promise<{ token: string; baseUrl: string } | null> {
  try {
    const r = await fetch(`${BACKEND}/api/settings`, {
      headers: { Authorization: authHeader, 'ngrok-skip-browser-warning': '1' },
    });
    if (r.ok) {
      const d = await r.json();
      const token = d?.data?.kledo_token ?? '';
      if (token) return { token, baseUrl: 'https://api.kledo.com/api/v1' };
    }
  } catch {}
  return null;
}

export async function getDefaultFinanceAccount(baseUrl: string, token: string): Promise<number | null> {
  try {
    const r = await fetch(`${baseUrl}/finance/accounts?type=income&per_page=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      const d = await r.json();
      const accounts: any[] = d?.data?.data ?? d?.data ?? [];
      if (accounts.length > 0) return accounts[0].id;
    }
  } catch {}
  return null;
}

/** Keyword mapping: bankKey → kata kunci pencarian di nama akun Kledo */
const BANK_KEYWORDS: Record<string, string[]> = {
  bca:     ['bca giro', 'giro bca', 'bca'],
  bri:     ['bri edc', 'edc bri', 'bri'],
  mandiri: ['mandiri'],
  bni:     ['bni'],
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
  catatan?: string;
  contactId?: number | null;
  contactName?: string;
  diskonTotal?: number;
  pajak?: number;
  ongkir?: number;
  totalHarga?: number;
  metodePembayaran?: string;
  bankPilihan?: string | null;
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

    const kledoItems = order.items.map(it => {
      const qty   = Number(it.qty ?? 1);
      const price = Number(it.harga ?? 0);
      const item: any = {
        finance_account_id: defaultAccountId,
        name: it.nama,
        qty,
        price,
        amount: qty * price,
      };
      if (it.diskon) item.discount_percent = Number(it.diskon);
      if (it.kledoProductId) item.product_id = Number(it.kledoProductId);
      return item;
    });

    if (order.ongkir && order.ongkir > 0) {
      kledoItems.push({
        finance_account_id: defaultAccountId,
        name: 'Biaya Pengiriman',
        qty: 1,
        price: order.ongkir,
        amount: order.ongkir,
      });
    }

    const payload: any = {
      trans_date: order.tanggal,
      include_tax: (order.pajak ?? 0) > 0 ? 1 : 0,
      items: kledoItems,
    };
    if (order.soNumber)     payload.ref_number   = order.soNumber;
    if (order.catatan)      payload.memo         = order.catatan;
    if (order.contactId)    payload.contact_id   = order.contactId;
    if (order.contactName)  payload.contact_name = order.contactName;
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

    /* ── Auto tandai LUNAS jika Transfer Bank + bank dipilih ── */
    let kledoPaid      = false;
    let kledoPaidError: string | undefined;

    const isTransfer = order.metodePembayaran === 'transfer';
    const bankKey    = order.bankPilihan?.toLowerCase() ?? '';

    if (isTransfer && bankKey) {
      const bankAccountId = await getBankAccountId(cfg.baseUrl, cfg.token, bankKey);
      if (bankAccountId) {
        const totalAmount = order.totalHarga ?? order.items.reduce((s, it) => s + (it.subtotal ?? 0), 0);
        const paid = await markKledoInvoicePaid(
          cfg.baseUrl,
          cfg.token,
          invoiceId,
          bankAccountId,
          totalAmount,
          order.tanggal,
          `Pembayaran ${bankKey.toUpperCase()} — ${order.soNumber ?? ''}`.trim(),
        );
        kledoPaid      = paid.ok;
        kledoPaidError = paid.error;
      } else {
        kledoPaidError = `Akun ${bankKey.toUpperCase()} tidak ditemukan di Kledo`;
      }
    }

    return { ok: true, kledoInvoiceId: invoiceId, kledoRef, kledoPaid, kledoPaidError };
  } catch (e: any) {
    return { ok: false, kledoInvoiceId: null, kledoRef: null, error: e.message };
  }
}
