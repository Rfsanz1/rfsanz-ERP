import { getLocalSetting } from '@/lib/localDb';

function formatPhone(raw: string): string {
  if (!raw) return '';
  if (raw.includes('@')) return raw;
  let phone = raw.replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
  else if (!phone.startsWith('62')) phone = '62' + phone;
  return phone;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const nowStr = () =>
  new Date().toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

async function getFonnteToken(): Promise<string> {
  if (process.env.FONNTE_TOKEN) return process.env.FONNTE_TOKEN;
  try {
    const dbToken = await getLocalSetting('fonnte_token');
    if (dbToken) return dbToken;
  } catch {}
  return '';
}

async function getFonnteGroupInvoice(): Promise<string> {
  if (process.env.FONNTE_GROUP_INVOICE) return process.env.FONNTE_GROUP_INVOICE;
  try {
    const v = await getLocalSetting('fonnte_group_invoice');
    if (v) return v;
  } catch {}
  return '';
}

async function getFonnteGroupPayment(): Promise<string> {
  if (process.env.FONNTE_GROUP_PAYMENT) return process.env.FONNTE_GROUP_PAYMENT;
  try {
    const v = await getLocalSetting('fonnte_group_payment');
    if (v) return v;
  } catch {}
  return '';
}

async function sendWa(target: string, message: string): Promise<{ ok: boolean; reason?: string }> {
  const token = await getFonnteToken();
  if (!token) return { ok: false, reason: 'FONNTE_TOKEN tidak dikonfigurasi. Atur di Settings → WA Gateway.' };
  if (!target) return { ok: false, reason: 'Target WA kosong' };

  const formatted = formatPhone(target);
  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: formatted, message, countryCode: '62' }),
    });
    const data = await res.json();
    if (res.ok && data?.status !== false) return { ok: true };
    return { ok: false, reason: data?.reason ?? data?.message ?? 'Gagal kirim WA' };
  } catch (e: any) {
    return { ok: false, reason: e.message };
  }
}

export interface WaOrderVars {
  soNumber: string;
  namaCustomer: string;
  noHp?: string | null;
  salesName?: string | null;
  items: Array<{ nama: string; qty: number; harga: number }>;
  totalHarga: number;
  metodePembayaran?: string | null;
  bankPilihan?: string | null;
  status?: string;
}

const TEMPLATE_ORDER =
  `🛒 *ORDER BARU MASUK*\n` +
  `━━━━━━━━━━━━━━━━━━━\n` +
  `📋 No. Invoice : *{order_no}*\n` +
  `👤 Customer    : *{customer_name}*\n` +
  `📞 Telepon     : {phone}\n` +
  `👨‍💼 Sales       : {sales}\n` +
  `━━━━━━━━━━━━━━━━━━━\n` +
  `📦 *Detail Produk*\n{items}\n` +
  `━━━━━━━━━━━━━━━━━━━\n` +
  `💰 Total Tagihan : *{total}*\n` +
  `💳 Pembayaran    : {payment_method}\n` +
  `📌 Status        : {status}\n` +
  `━━━━━━━━━━━━━━━━━━━\n` +
  `_Gentong Mas ERP • {datetime}_`;

const TEMPLATE_PAYMENT =
  `💸 *BUKTI TRANSFER MASUK*\n` +
  `━━━━━━━━━━━━━━━━━━━\n` +
  `📋 No. Invoice : *{order_no}*\n` +
  `👤 Customer    : {customer_name}\n` +
  `📞 Telepon     : {phone}\n` +
  `💰 Total       : *{total}*\n` +
  `🏦 Metode      : {bank}\n` +
  `👨‍💼 Sales       : {sales}\n` +
  `━━━━━━━━━━━━━━━━━━━\n` +
  `_Gentong Mas ERP • {datetime}_`;

const TEMPLATE_KONSUMEN =
  `Halo Kak *{customer_name}*, terima kasih telah berbelanja di *Gentong Mas* 🙏✨\n\n` +
  `Berikut ringkasan pesanan Anda:\n` +
  `📋 No. Invoice : *{order_no}*\n\n` +
  `📦 *Detail Pesanan*\n{items}\n\n` +
  `💰 Total Belanja : *{total}*\n` +
  `📌 Status Bayar  : {status}\n\n` +
  `Pesanan akan segera kami proses dan kabari kembali untuk info pengiriman 🚚\n\n` +
  `Ada pertanyaan? Balas chat ini saja ya, kami siap membantu 😊\n` +
  `Terima kasih atas kepercayaan Anda! 🙌`;

function apply(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export async function sendAllOrderNotifications(order: WaOrderVars): Promise<{
  grupOrder: { ok: boolean; reason?: string };
  grupPayment: { ok: boolean; reason?: string };
  konsumen: { ok: boolean; reason?: string };
}> {
  const [grupInvoice, grupPayment] = await Promise.all([
    getFonnteGroupInvoice(),
    getFonnteGroupPayment(),
  ]);

  const MAX_ITEMS_IN_MSG = 15;
  const rawItems = order.items ?? [];
  const itemLines = rawItems
    .slice(0, MAX_ITEMS_IN_MSG)
    .map((it, i) => {
      const namaBersih = String(it.nama ?? '-').replace(/[\r\n]+/g, ' ').trim();
      return `${i + 1}. ${namaBersih}\n   ${it.qty} × ${fmt(Number(it.harga))} = ${fmt(Number(it.harga) * Number(it.qty))}`;
    });
  if (rawItems.length > MAX_ITEMS_IN_MSG) {
    itemLines.push(`… dan ${rawItems.length - MAX_ITEMS_IN_MSG} produk lainnya`);
  }
  const itemsStr = itemLines.join('\n') || '(tidak ada item)';

  const statusLabel =
    order.status === 'paid' || order.status === 'lunas' ? '✅ Lunas'
    : order.status === 'partial' ? '⏳ Sebagian' : '🕐 Pending';

  const bankLabel = [order.bankPilihan, order.metodePembayaran]
    .filter(Boolean).join(' / ') || '-';

  const datetime = nowStr();

  const msgOrder = apply(TEMPLATE_ORDER, {
    order_no: order.soNumber,
    customer_name: order.namaCustomer,
    phone: order.noHp ?? '-',
    sales: order.salesName ?? '-',
    items: itemsStr,
    total: fmt(order.totalHarga),
    payment_method: bankLabel,
    status: statusLabel,
    datetime,
  });

  const msgPayment = apply(TEMPLATE_PAYMENT, {
    order_no: order.soNumber,
    customer_name: order.namaCustomer,
    phone: order.noHp ?? '-',
    total: fmt(order.totalHarga),
    bank: bankLabel,
    sales: order.salesName ?? '-',
    datetime,
  });

  const msgKonsumen = apply(TEMPLATE_KONSUMEN, {
    order_no: order.soNumber,
    customer_name: order.namaCustomer,
    items: itemsStr,
    total: fmt(order.totalHarga),
    status: statusLabel,
  });

  const [grupOrderRes, grupPaymentRes, konsumenRes] = await Promise.all([
    grupInvoice ? sendWa(grupInvoice, msgOrder) : Promise.resolve({ ok: false, reason: 'Group ID Notif Order belum dikonfigurasi di Settings → WA Gateway' }),
    grupPayment ? sendWa(grupPayment, msgPayment) : Promise.resolve({ ok: false, reason: 'Group ID Payment belum dikonfigurasi di Settings → WA Gateway' }),
    order.noHp ? sendWa(order.noHp, msgKonsumen) : Promise.resolve({ ok: false, reason: 'Nomor HP konsumen tidak tersedia' }),
  ]);

  return { grupOrder: grupOrderRes, grupPayment: grupPaymentRes, konsumen: konsumenRes };
}
