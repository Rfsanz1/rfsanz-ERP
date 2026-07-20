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

export interface WaPembayaranEntry {
  metode: string;
  jumlah: number;
  bankPilihan?: string | null;
  edcPilihan?: string | null;
  unitBisnis?: string | null;
}

export interface WaOrderVars {
  soNumber: string;
  namaCustomer: string;
  noHp?: string | null;
  alamat?: string | null;
  catatan?: string | null;
  salesName?: string | null;
  items: Array<{ nama: string; qty: number; harga: number }>;
  totalHarga: number;
  metodePembayaran?: string | null;
  bankPilihan?: string | null;
  status?: string;
  pembayaranList?: WaPembayaranEntry[];
  buktiCount?: number;
}

const BANK_LABEL: Record<string, string> = {
  bca: 'BCA', bri: 'BRI', mandiri: 'Mandiri', bni: 'BNI',
};
const EDC_LABEL: Record<string, string> = {
  bca_edc: 'BCA EDC', bri_edc: 'BRI EDC', bni_edc: 'BNI EDC',
};

function metodeLabel(p: WaPembayaranEntry): string {
  if (p.metode === 'transfer') {
    const bank = p.bankPilihan ? ` – ${BANK_LABEL[p.bankPilihan] ?? p.bankPilihan.toUpperCase()}` : '';
    return `Transfer${bank}`;
  }
  if (p.metode === 'debit') {
    const edc = p.edcPilihan ? ` – ${EDC_LABEL[p.edcPilihan] ?? p.edcPilihan.toUpperCase()}` : '';
    return `Debit${edc}`;
  }
  if (p.metode === 'cash') {
    if (p.unitBisnis === 'elektronik') return 'Cash (Elektronik)';
    if (p.unitBisnis === 'bahan_bangunan') return 'Cash (Bangunan)';
    return 'Cash';
  }
  if (p.metode === 'cod') return 'COD';
  if (p.metode === 'dp')  return 'DP';
  return (p.metode ?? '-').toUpperCase();
}

function buildOrderMessage(order: WaOrderVars): string {
  const datetime = nowStr();
  const total    = order.totalHarga;

  /* Items */
  const MAX_ITEMS = 15;
  const rawItems  = order.items ?? [];
  const itemLines = rawItems.slice(0, MAX_ITEMS).map((it, i) => {
    const nama = String(it.nama ?? '-').replace(/[\r\n]+/g, ' ').trim();
    return `${i + 1}. ${nama} (${it.qty}x @ ${fmt(Number(it.harga))})`;
  });
  if (rawItems.length > MAX_ITEMS)
    itemLines.push(`… dan ${rawItems.length - MAX_ITEMS} produk lainnya`);

  /* Pembayaran */
  const list        = order.pembayaranList ?? [];
  const totalBayar  = list.reduce((s, p) => s + (p.jumlah || 0), 0);
  const sisa        = Math.max(0, total - totalBayar);

  let paymentSummary = '';
  const paymentDetail: string[] = [];

  if (list.length > 0) {
    const dpStr    = sisa > 0 ? `DP ${fmt(list[0].jumlah)} (sisa ${fmt(sisa)})` : fmt(list[0].jumlah);
    const buktiStr = order.buktiCount ? ` ✅ (${order.buktiCount} bukti TF)` : '';
    paymentSummary = `💳 Pembayaran: ${dpStr}${buktiStr}`;

    list.forEach(p => paymentDetail.push(`• ${metodeLabel(p)}: ${fmt(p.jumlah)}`));
    if (sisa > 0) paymentDetail.push(`• ⏳ *Belum Bayar (sisa): ${fmt(sisa)}*`);
  } else {
    const bank = order.bankPilihan
      ? ` – ${BANK_LABEL[order.bankPilihan] ?? order.bankPilihan.toUpperCase()}`
      : '';
    const metode = order.metodePembayaran ?? 'transfer';
    paymentSummary = `💳 Pembayaran: ${metode === 'transfer' ? `Transfer${bank}` : metode.toUpperCase()}: ${fmt(total)}`;
    paymentDetail.push(`• ${metode === 'transfer' ? `Transfer${bank}` : metode.toUpperCase()}: ${fmt(total)}`);
  }

  const lines: string[] = [
    `🔔 *Order masuk bossku!* 👀`,
    ``,
    `📌 *Customer:*`,
    `${order.namaCustomer}${order.noHp ? ` – ${order.noHp}` : ''}`,
  ];

  if (order.alamat)  lines.push(``, `📍 *Alamat:* ${order.alamat}`);
  if (order.catatan) lines.push(`🏠 *Patokan:* ${order.catatan}`);

  lines.push(
    ``,
    `📦 *Pesanan:*`,
    ...itemLines,
    ``,
    `💰 *Total: ${fmt(total)}*`,
    paymentSummary,
  );

  if (paymentDetail.length > 0) {
    lines.push(``, `💰 *Rincian Pembayaran:*`, ...paymentDetail);
  }

  lines.push(
    ``,
    `👨‍💼 *Sales:* ${order.salesName ?? '-'}`,
    ``,
    `🕒 ${datetime}`,
  );

  return lines.join('\n');
}

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

  /* Pesan grup invoice — format baru */
  const msgOrder = buildOrderMessage(order);

  /* Pesan konsumen — tetap pakai format lama yang ramah */
  const MAX_ITEMS_IN_MSG = 15;
  const rawItems  = order.items ?? [];
  const itemLines = rawItems.slice(0, MAX_ITEMS_IN_MSG).map((it, i) => {
    const namaBersih = String(it.nama ?? '-').replace(/[\r\n]+/g, ' ').trim();
    return `${i + 1}. ${namaBersih}\n   ${it.qty} × ${fmt(Number(it.harga))} = ${fmt(Number(it.harga) * Number(it.qty))}`;
  });
  if (rawItems.length > MAX_ITEMS_IN_MSG)
    itemLines.push(`… dan ${rawItems.length - MAX_ITEMS_IN_MSG} produk lainnya`);
  const itemsStr    = itemLines.join('\n') || '(tidak ada item)';
  const statusLabel = order.status === 'paid' || order.status === 'lunas' ? '✅ Lunas'
    : order.status === 'partial' ? '⏳ Sebagian' : '🕐 Pending';

  const msgKonsumen = apply(TEMPLATE_KONSUMEN, {
    order_no:      order.soNumber,
    customer_name: order.namaCustomer,
    items:         itemsStr,
    total:         fmt(order.totalHarga),
    status:        statusLabel,
  });

  const [grupOrderRes, grupPaymentRes, konsumenRes] = await Promise.all([
    grupInvoice ? sendWa(grupInvoice, msgOrder) : Promise.resolve({ ok: false, reason: 'Group ID Notif Order belum dikonfigurasi di Settings → WA Gateway' }),
    grupPayment ? sendWa(grupPayment, msgOrder) : Promise.resolve({ ok: false, reason: 'Group ID Payment belum dikonfigurasi di Settings → WA Gateway' }),
    order.noHp  ? sendWa(order.noHp, msgKonsumen) : Promise.resolve({ ok: false, reason: 'Nomor HP konsumen tidak tersedia' }),
  ]);

  return { grupOrder: grupOrderRes, grupPayment: grupPaymentRes, konsumen: konsumenRes };
}
