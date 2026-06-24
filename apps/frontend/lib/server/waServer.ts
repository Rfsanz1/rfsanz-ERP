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
  `🛒 *Order Baru Masuk!*\n\n` +
  `📋 Invoice     : *{order_no}*\n` +
  `👤 Customer    : *{customer_name}*\n` +
  `📞 Telepon     : {phone}\n` +
  `👨‍💼 Sales       : {sales}\n\n` +
  `📦 *Detail Order:*\n{items}\n\n` +
  `💰 Total       : *{total}*\n` +
  `💳 Pembayaran  : {payment_method}\n` +
  `📌 Status      : {status}\n\n` +
  `_Gentong Mas ERP • {datetime}_`;

const TEMPLATE_PAYMENT =
  `💸 *Bukti Transfer Masuk*\n\n` +
  `📋 Order       : #{order_no}\n` +
  `👤 Customer    : {customer_name}\n` +
  `📞 Telepon     : {phone}\n` +
  `💰 Total       : {total}\n` +
  `🏦 Pembayaran  : {bank}\n` +
  `👨‍💼 Sales       : {sales}\n\n` +
  `_Gentong Mas ERP • {datetime}_`;

const TEMPLATE_KONSUMEN =
  `Halo Kak *{customer_name}* 👋\n\n` +
  `Terima kasih sudah memesan di *Gentong Mas* 🙏\n\n` +
  `📦 Produk : {item_name}\n` +
  `🔢 Jumlah : {qty} unit\n` +
  `💰 Total  : *{total}*\n` +
  `✅ Status : {status}\n\n` +
  `Jika ada pertanyaan, silakan hubungi kami 😊\nTerima kasih! 🙌`;

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

  const itemsStr = (order.items ?? [])
    .map(it => `  • ${it.nama} ×${it.qty} = ${fmt(Number(it.harga) * Number(it.qty))}`)
    .join('\n') || '  (tidak ada item)';

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

  const first = order.items?.[0];
  const msgKonsumen = apply(TEMPLATE_KONSUMEN, {
    customer_name: order.namaCustomer,
    item_name: first?.nama ?? '-',
    qty: String(first?.qty ?? 0),
    total: fmt(order.totalHarga),
    status: statusLabel,
    datetime,
  });

  const [grupOrderRes, grupPaymentRes, konsumenRes] = await Promise.all([
    grupInvoice ? sendWa(grupInvoice, msgOrder) : Promise.resolve({ ok: false, reason: 'Group ID Notif Order belum dikonfigurasi di Settings → WA Gateway' }),
    grupPayment ? sendWa(grupPayment, msgPayment) : Promise.resolve({ ok: false, reason: 'Group ID Payment belum dikonfigurasi di Settings → WA Gateway' }),
    order.noHp ? sendWa(order.noHp, msgKonsumen) : Promise.resolve({ ok: false, reason: 'Nomor HP konsumen tidak tersedia' }),
  ]);

  return { grupOrder: grupOrderRes, grupPayment: grupPaymentRes, konsumen: konsumenRes };
}
