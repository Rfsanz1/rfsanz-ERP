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

interface KledoOrderInput {
  soNumber?: string;
  tanggal: string;
  catatan?: string;
  contactId?: number | null;
  contactName?: string;
  diskonTotal?: number;
  pajak?: number;
  ongkir?: number;
  items: { nama: string; qty: number; harga: number; subtotal: number; diskon?: number; kledoProductId?: string | null }[];
}

export async function pushOrderToKledo(
  authHeader: string,
  order: KledoOrderInput,
): Promise<{ ok: boolean; kledoInvoiceId: number | null; kledoRef: string | null; error?: string }> {
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
    if (order.soNumber) payload.ref_number = order.soNumber;
    if (order.catatan)  payload.memo = order.catatan;
    if (order.contactId) payload.contact_id = order.contactId;
    if (order.contactName) payload.contact_name = order.contactName;
    if (order.diskonTotal) payload.discount = order.diskonTotal;

    const res = await fetch(`${cfg.baseUrl}/finance/invoices`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data?.data?.id) {
      return { ok: true, kledoInvoiceId: data.data.id, kledoRef: data.data.ref_number ?? null };
    }
    return { ok: false, kledoInvoiceId: null, kledoRef: null, error: data?.message ?? 'Gagal push ke Kledo' };
  } catch (e: any) {
    return { ok: false, kledoInvoiceId: null, kledoRef: null, error: e.message };
  }
}
