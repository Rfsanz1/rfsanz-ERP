export interface FonnteConfig {
  token: string;
  groupInvoice: string;
  groupBuktiTf: string;
  templateOrder: string;
  templatePayment: string;
  templateKonsumen: string;
}

export const DEFAULT_TEMPLATE_ORDER =
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

export const DEFAULT_TEMPLATE_PAYMENT =
  `💸 *Bukti Transfer Masuk*\n\n` +
  `📋 Order       : #{order_no}\n` +
  `👤 Customer    : {customer_name}\n` +
  `📞 Telepon     : {phone}\n` +
  `💰 Total       : {total}\n` +
  `🏦 Bank Tujuan : {bank}\n` +
  `👨‍💼 Sales       : {sales}\n\n` +
  `_Gentong Mas ERP • {datetime}_`;

export const DEFAULT_TEMPLATE_KONSUMEN =
  `Halo Kak {customer_name} 👋\n\n` +
  `Terima kasih sudah memesan di *Gentong Mas* 🙏\n\n` +
  `📦 Produk : {item_name}\n` +
  `🔢 Jumlah : {qty} unit\n` +
  `💰 Total  : *{total}*\n` +
  `✅ Status : {status}\n\n` +
  `Jika ada pertanyaan, silakan hubungi kami 😊\n` +
  `Terima kasih! 🙌`;

export function getFonnteConfig(): FonnteConfig | null {
  try {
    const raw = localStorage.getItem('erp_intg_fonnte');
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d.token) return null;
    return {
      token: d.token,
      groupInvoice: d.groupInvoice ?? '',
      groupBuktiTf: d.groupBuktiTf ?? '',
      templateOrder: d.templateOrder ?? DEFAULT_TEMPLATE_ORDER,
      templatePayment: d.templatePayment ?? DEFAULT_TEMPLATE_PAYMENT,
      templateKonsumen: d.templateKonsumen ?? DEFAULT_TEMPLATE_KONSUMEN,
    };
  } catch { return null; }
}

export function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const nowStr = () =>
  new Date().toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

async function doSend(token: string, target: string, message: string) {
  const res = await fetch('/api/direct/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, target, message }),
  });
  return res.json();
}

export async function sendGrupOrder(vars: {
  order_no: string;
  customer_name: string;
  phone?: string | null;
  sales?: string | null;
  items: Array<{ nama: string; qty: number; harga: number }>;
  total: number;
  payment_method?: string | null;
  status?: string | null;
}) {
  const cfg = getFonnteConfig();
  if (!cfg?.token) return { skipped: true, reason: 'Fonnte token belum dikonfigurasi di Settings → WA Gateway' };
  if (!cfg.groupInvoice) return { skipped: true, reason: 'Group ID Notif Order belum diisi di Settings → WA Gateway' };

  const itemsStr = (vars.items ?? [])
    .map(it => `  • ${it.nama} ×${it.qty} = ${fmt(Number(it.harga) * Number(it.qty))}`)
    .join('\n');
  const statusLabel =
    vars.status === 'paid' || vars.status === 'lunas' ? '✅ Lunas'
    : vars.status === 'partial' ? '⏳ Sebagian' : '🕐 Pending';

  const message = applyTemplate(cfg.templateOrder, {
    order_no: vars.order_no,
    customer_name: vars.customer_name,
    phone: vars.phone ?? '-',
    sales: vars.sales ?? '-',
    items: itemsStr || '  (tidak ada item)',
    total: fmt(vars.total),
    payment_method: vars.payment_method ?? '-',
    status: statusLabel,
    datetime: nowStr(),
  });

  return doSend(cfg.token, cfg.groupInvoice, message);
}

export async function sendGrupPayment(vars: {
  order_no: string;
  customer_name: string;
  phone?: string | null;
  total: number;
  bank?: string | null;
  sales?: string | null;
}) {
  const cfg = getFonnteConfig();
  if (!cfg?.token) return { skipped: true, reason: 'Fonnte token belum dikonfigurasi' };
  if (!cfg.groupBuktiTf) return { skipped: true, reason: 'Group ID Payment belum diisi di Settings → WA Gateway' };

  const message = applyTemplate(cfg.templatePayment, {
    order_no: vars.order_no,
    customer_name: vars.customer_name,
    phone: vars.phone ?? '-',
    total: fmt(vars.total),
    bank: vars.bank ?? '-',
    sales: vars.sales ?? '-',
    datetime: nowStr(),
  });

  return doSend(cfg.token, cfg.groupBuktiTf, message);
}

export async function sendKonsumen(vars: {
  phone: string;
  customer_name: string;
  items: Array<{ nama: string; qty: number; harga: number }>;
  total: number;
  status?: string | null;
}) {
  const cfg = getFonnteConfig();
  if (!cfg?.token) return { skipped: true, reason: 'Fonnte token belum dikonfigurasi' };
  if (!vars.phone) return { skipped: true, reason: 'Nomor HP konsumen tidak tersedia' };

  const first = vars.items?.[0];
  const statusLabel =
    vars.status === 'paid' || vars.status === 'lunas' ? 'Lunas'
    : vars.status === 'partial' ? 'Sebagian' : 'Pending';

  const message = applyTemplate(cfg.templateKonsumen, {
    customer_name: vars.customer_name,
    item_name: first?.nama ?? '-',
    qty: String(first?.qty ?? 0),
    total: fmt(vars.total),
    status: statusLabel,
    datetime: nowStr(),
  });

  return doSend(cfg.token, vars.phone, message);
}
