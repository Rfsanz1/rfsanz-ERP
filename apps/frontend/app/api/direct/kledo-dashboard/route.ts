import { NextResponse } from 'next/server';

const KLEDO_BASE = 'https://api.kledo.com/api/v1';
const BACKEND_RAW = process.env.BACKEND_URL || '';
const BACKEND = BACKEND_RAW && !BACKEND_RAW.startsWith('http')
  ? `https://${BACKEND_RAW}` : BACKEND_RAW;

/* ── token cache 60 menit ─────────────────────────────────────────────── */
let _token: string | null = null;
let _tokenTs = 0;

async function getToken(): Promise<string | null> {
  if (_token && Date.now() - _tokenTs < 60 * 60 * 1000) return _token;
  if (process.env.KLEDO_TOKEN) {
    _token = process.env.KLEDO_TOKEN;
    _tokenTs = Date.now();
    return _token;
  }
  try {
    const r = await fetch(`${BACKEND}/api/settings`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) {
      const d = await r.json();
      const t = d?.data?.kledo_token ?? null;
      if (t) { _token = t; _tokenTs = Date.now(); return _token; }
    }
  } catch {}
  return null;
}

async function kfetch(token: string, path: string, params: Record<string, string> = {}) {
  const url = new URL(`${KLEDO_BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

/* ── dashboard cache 10 menit ─────────────────────────────────────────── */
let _cache: { ts: number; data: any } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET() {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return NextResponse.json({ success: true, data: _cache.data, cached: true });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json({
      success: false,
      message: 'Token Kledo tidak ditemukan. Set KLEDO_TOKEN di environment variable.',
    }, { status: 401 });
  }

  /* Hitung range 12 bulan lalu */
  const now = new Date();
  const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const dateFrom = yearAgo.toISOString().slice(0, 10);
  const todayStr  = now.toISOString().slice(0, 10);
  const monthStr  = now.toISOString().slice(0, 7);
  const yearStr   = String(now.getFullYear());

  /* Hitung range tanggal — "minggu" = 7 hari bergulir termasuk hari ini */
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  /*
   * Kledo API TIDAK mendukung filter trans_date_to secara akurat —
   * semua calls mengembalikan data lengkap (total=52002).
   * Solusi: fetch 500 invoice terbaru, lalu filter per-periode di JavaScript.
   * Ini akurat karena 500 invoice terbaru mencakup beberapa bulan terakhir.
   */
  const invoiceParams = { per_page: '100', trans_date_from: dateFrom, include: 'status' };
  const [pg1Res, expRes, bankRes] = await Promise.allSettled([
    kfetch(token, 'finance/invoices', { ...invoiceParams, page: '1' }),
    kfetch(token, 'finance/expenses', { per_page: '100', trans_date_from: `${yearStr}-01-01` }),
    kfetch(token, 'finance/bank_accounts'),
  ]);

  const pg1      = pg1Res.status   === 'fulfilled' ? pg1Res.value   : null;
  const expData  = expRes.status   === 'fulfilled' ? expRes.value   : null;
  const bankData = bankRes.status  === 'fulfilled' ? bankRes.value  : null;

  const firstPageItems: any[]     = pg1?.data?.data ?? [];
  const lastPage: number          = pg1?.data?.last_page ?? 1;
  const totalInvoiceCount: number = pg1?.data?.total ?? firstPageItems.length;

  /* Fetch sisa halaman (max 4 lagi = 500 invoice terbaru) */
  let allInvoices = [...firstPageItems];
  if (lastPage > 1) {
    const remainPages = Array.from({ length: Math.min(lastPage - 1, 4) }, (_, i) => i + 2);
    const moreRes = await Promise.allSettled(
      remainPages.map(p => kfetch(token, 'finance/invoices', { ...invoiceParams, page: String(p) }))
    );
    for (const r of moreRes) {
      if (r.status === 'fulfilled' && r.value?.data?.data) {
        allInvoices.push(...r.value.data.data);
      }
    }
  }

  /* ── Helper: hitung jumlah terbayar dari satu invoice ───────────────── */
  function calcPaid(inv: any): number {
    const amount = Number(inv.amount ?? inv.total ?? 0);
    /* inv.due = sisa belum bayar; 0 = lunas penuh */
    const due = (inv.due !== null && inv.due !== undefined)
      ? Number(inv.due)
      : Number(inv.amount_remaining ?? amount);
    return Math.max(amount - due, 0);
  }
  function calcDue(inv: any): number {
    const amount = Number(inv.amount ?? inv.total ?? 0);
    return (inv.due !== null && inv.due !== undefined)
      ? Number(inv.due)
      : Number(inv.amount_remaining ?? amount);
  }

  /* ── Hitung revenue & AR dari allInvoices, filter per periode ────────── */
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const monthBuckets: Record<string, number> = {};
  let todayRevenue = 0, weekRevenue = 0, monthRevenue = 0, yearRevenue = 0;
  let totalAR = 0, overdueCount = 0, unpaidCount = 0;

  for (const inv of allInvoices) {
    const paid      = calcPaid(inv);
    const dueAmt    = calcDue(inv);
    const transDate = (inv.trans_date ?? '').slice(0, 10);
    const dueDate   = (inv.due_date   ?? '').slice(0, 10);
    const monthKey  = transDate.slice(0, 7);

    if (paid > 0) {
      if (transDate === todayStr)                               todayRevenue += paid;
      if (transDate >= weekStartStr && transDate <= todayStr)   weekRevenue  += paid;
      if (transDate.startsWith(monthStr))                       monthRevenue += paid;
      if (transDate.startsWith(yearStr))                        yearRevenue  += paid;
      monthBuckets[monthKey] = (monthBuckets[monthKey] ?? 0) + paid;
    }

    if (dueAmt > 0) {
      totalAR += dueAmt;
      unpaidCount++;
      if (dueDate && dueDate < todayStr) overdueCount++;
    }
  }

  /* ── Expense ─────────────────────────────────────────────────────────── */
  const expItems: any[] = expData?.data?.data ?? [];
  const totalExpense = expItems
    .filter(e => (e.trans_date ?? '').startsWith(monthStr))
    .reduce((s, e) => s + Number(e.amount ?? 0), 0);

  /* ── Saldo bank ──────────────────────────────────────────────────────── */
  const bankAccounts: any[] = bankData?.data?.data ?? bankData?.data ?? [];
  const cashBalance = bankAccounts.reduce((s, a) => s + Number(a.balance ?? a.current_balance ?? 0), 0);

  /* ── Revenue chart 12 bulan ──────────────────────────────────────────── */
  const revenueChart = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { month: MONTH_LABELS[d.getMonth()], revenue: monthBuckets[key] ?? 0, expense: 0 };
  });

  /* ── 10 invoice terbaru ──────────────────────────────────────────────── */
  const sorted = [...allInvoices]
    .sort((a, b) => ((b.trans_date ?? '') > (a.trans_date ?? '') ? 1 : -1))
    .slice(0, 10);

  const recentInvoices = sorted.map(inv => {
    const sid    = Number(inv.status_id ?? inv.status?.id ?? 0);
    const amount = Number(inv.amount ?? inv.total ?? 0);
    const dueAmt = Number(inv.due ?? inv.amount_remaining ?? (sid === 3 ? 0 : amount));
    /* Kledo: 1=draft, 2=open/belum bayar, 3=lunas, lainnya=void */
    const statusName =
      sid === 3 ? 'paid' :
      sid === 2 ? (dueAmt < amount && amount > 0 ? 'partial' : 'open') :
      sid === 1 ? 'draft' : 'void';
    return {
      id:         inv.id,
      ref_number: inv.ref_number ?? `INV-${inv.id}`,
      contact:    inv.contact?.name ?? inv.contact_name ?? '—',
      amount,
      status:     statusName,
      due_date:   inv.due_date ?? '',
      trans_date: inv.trans_date ?? '',
    };
  });

  const result = {
    todayRevenue, weekRevenue, monthRevenue, yearRevenue,
    totalAR, totalExpense, overdueInvoiceCount: overdueCount,
    cashBalance, unpaidInvoiceCount: unpaidCount,
    totalInvoiceCount,
    revenueChart, recentInvoices,
    source: 'kledo',
  };

  _cache = { ts: Date.now(), data: result };
  return NextResponse.json({ success: true, data: result, cached: false });
}

export async function DELETE() {
  _cache = null; _token = null;
  return NextResponse.json({ success: true, message: 'Cache cleared' });
}
