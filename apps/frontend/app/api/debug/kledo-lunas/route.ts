/**
 * DEBUG: Trace auto-lunas Kledo — HANYA TERSEDIA DI DEVELOPMENT
 *
 * GET  /api/debug/kledo-lunas
 *   → List semua akun Kledo, dikelompokkan per kategori
 *
 * POST /api/debug/kledo-lunas
 *   body: { invoiceId: number, bankKey: string, amount: number, date?: string }
 *   bankKey contoh: "kas", "bca", "bri", "mandiri", "transfer"
 *   → Trace penuh: cari akun → coba tandai lunas → tampilkan semua response
 *   PERHATIAN: POST ini BENAR-BENAR menandai invoice di Kledo — pakai dengan hati-hati
 */
import { NextRequest, NextResponse } from 'next/server';
import { getKledoCfg } from '@/lib/kledoSync';

/** Blokir semua akses di production */
function guardDev() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Endpoint debug tidak tersedia di production' }, { status: 404 });
  }
  return null;
}

async function fetchAllAccounts(baseUrl: string, token: string) {
  const all: any[] = [];
  for (let page = 1; page <= 10; page++) {
    const r = await fetch(`${baseUrl}/finance/accounts?per_page=200&page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) break;
    const d = await r.json();
    const items: any[] = d?.data?.data ?? d?.data ?? [];
    all.push(...items);
    if (items.length < 200) break;
  }
  return all;
}

export async function GET(req: NextRequest) {
  const guard = guardDev(); if (guard) return guard;
  try {
    const cfg = await getKledoCfg(req.headers.get('authorization') ?? '');
    if (!cfg) return NextResponse.json({ error: 'Token Kledo tidak ditemukan' }, { status: 401 });

    const accounts = await fetchAllAccounts(cfg.baseUrl, cfg.token);

    // Kelompokkan berdasarkan kategori/tipe
    const grouped: Record<string, any[]> = {};
    for (const acc of accounts) {
      const cat = acc.category?.name ?? acc.type ?? acc.account_type ?? 'Lain-lain';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ id: acc.id, name: acc.name, code: acc.code ?? null });
    }

    // Daftar keyword kas yang dicari
    const kasKeywords = ['kas masuk', 'kas tunai', 'petty cash', 'kas'];
    const transferKeywords = ['transfer', 'giro', 'tabungan', 'bank'];

    const kasMatches  = accounts.filter(a => kasKeywords.some(kw  => a.name?.toLowerCase().includes(kw)));
    const trfMatches  = accounts.filter(a => transferKeywords.some(kw => a.name?.toLowerCase().includes(kw)));
    const bcaMatches  = accounts.filter(a => ['bca giro','giro bca'].some(kw => a.name?.toLowerCase().includes(kw)));
    const briMatches  = accounts.filter(a => ['bri edc','edc bri','bri'].some(kw => a.name?.toLowerCase().includes(kw)));

    return NextResponse.json({
      total: accounts.length,
      auto_match: {
        kas:      kasMatches.map(a => ({ id: a.id, name: a.name })),
        transfer: trfMatches.map(a => ({ id: a.id, name: a.name })),
        bca:      bcaMatches.map(a => ({ id: a.id, name: a.name })),
        bri:      briMatches.map(a => ({ id: a.id, name: a.name })),
      },
      grouped,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = guardDev(); if (guard) return guard;
  try {
    const cfg = await getKledoCfg(req.headers.get('authorization') ?? '');
    if (!cfg) return NextResponse.json({ error: 'Token Kledo tidak ditemukan' }, { status: 401 });

    const body = await req.json();
    const { invoiceId, bankKey, amount, date } = body;
    if (!invoiceId || !bankKey || !amount) {
      return NextResponse.json({ error: 'Butuh: invoiceId, bankKey, amount' }, { status: 400 });
    }
    const today = date ?? new Date().toISOString().split('T')[0];

    // Step 1: cari akun
    const accounts = await fetchAllAccounts(cfg.baseUrl, cfg.token);
    const BANK_KEYWORDS: Record<string, string[]> = {
      kas:      ['kas masuk', 'kas tunai', 'petty cash', 'kas'],
      transfer: ['transfer', 'giro', 'tabungan', 'bank'],
      bca:      ['bca giro', 'giro bca'],
      bri:      ['bri edc', 'edc bri', 'bri'],
      mandiri:  ['mandiri'],
      bni:      ['bni'],
    };
    const keywords = BANK_KEYWORDS[bankKey.toLowerCase()] ?? [bankKey.toLowerCase()];
    let foundAccount: any = null;
    for (const kw of keywords) {
      foundAccount = accounts.find((a: any) => (a.name ?? '').toLowerCase().includes(kw));
      if (foundAccount) break;
    }

    const trace: any = {
      step1_cari_akun: {
        bankKey,
        keywords,
        total_accounts_fetched: accounts.length,
        found: foundAccount ? { id: foundAccount.id, name: foundAccount.name } : null,
      },
    };

    if (!foundAccount) {
      trace.step2_lunas = { skipped: true, reason: 'Akun tidak ditemukan' };
      trace.semua_akun = accounts.map(a => `${a.id}: ${a.name}`);
      return NextResponse.json({ ok: false, trace });
    }

    // Step 2: coba tandai lunas — dua variasi
    const headers = {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    };
    const base = {
      trans_date: today,
      finance_account_id: Number(foundAccount.id),
      memo: `Test lunas debug — invoice ${invoiceId}`,
    };

    const v1body = JSON.stringify({ ...base, pay_from: [{ id: Number(invoiceId), amount: Number(amount) }] });
    const r1 = await fetch(`${cfg.baseUrl}/finance/invoicepayments`, { method: 'POST', headers, body: v1body });
    const d1 = await r1.json();

    trace.step2_lunas = {
      variasi1: { payload: JSON.parse(v1body), status: r1.status, ok: r1.ok, response: d1 },
    };

    if (!r1.ok) {
      const v2body = JSON.stringify({ ...base, items: [{ invoice_id: Number(invoiceId), amount: Number(amount) }] });
      const r2 = await fetch(`${cfg.baseUrl}/finance/invoicepayments`, { method: 'POST', headers, body: v2body });
      const d2 = await r2.json();
      trace.step2_lunas.variasi2 = { payload: JSON.parse(v2body), status: r2.status, ok: r2.ok, response: d2 };
      return NextResponse.json({ ok: r2.ok, trace });
    }

    return NextResponse.json({ ok: true, trace });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
