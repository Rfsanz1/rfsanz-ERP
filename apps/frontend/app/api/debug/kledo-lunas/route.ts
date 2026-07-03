/**
 * DEBUG: Trace auto-lunas Kledo
 *
 * GET  /api/debug/kledo-lunas
 *   → List semua akun Kledo + keyword match per kategori bank
 *   (Tersedia di semua environment — read only, aman)
 *
 * POST /api/debug/kledo-lunas
 *   body: { invoiceId: number, bankKey: string, amount: number, date?: string }
 *   bankKey contoh: "kas", "bca", "bri", "mandiri", "transfer"
 *   → Trace penuh + BENAR-BENAR menandai invoice di Kledo
 *   PERHATIAN: POST ini BENAR-BENAR menandai invoice — hanya tersedia di development
 */
import { NextRequest, NextResponse } from 'next/server';
import { getKledoCfg } from '@/lib/kledoSync';

/** Keyword sama persis dengan kledoSync.ts */
const BANK_KEYWORDS: Record<string, string[]> = {
  bca:            ['bca giro', 'giro bca', 'bank bca', 'bca tabungan', 'bca'],
  bri:            ['bri edc', 'edc bri', 'bank bri', 'bri tabungan', 'bri'],
  mandiri:        ['bank mandiri', 'mandiri tabungan', 'mandiri giro', 'mandiri'],
  bni:            ['bank bni', 'bni tabungan', 'bni giro', 'bni'],
  bca_edc:        ['bca edc', 'edc bca', 'bca'],
  bri_edc:        ['bri edc', 'edc bri', 'bri'],
  bni_edc:        ['bni edc', 'edc bni', 'bni'],
  elektronik:     ['kas elektronik', 'elektronik'],
  bahan_bangunan: ['kas sulawesi', 'sulawesi'],
  kas:            ['kas masuk', 'kas tunai', 'petty cash', 'kas'],
  transfer:       ['transfer', 'giro', 'tabungan', 'bank'],
  edc:            ['edc', 'debit', 'kartu'],
};

async function fetchAllAccounts(baseUrl: string, token: string) {
  const all: any[] = [];
  for (let page = 1; page <= 10; page++) {
    const r = await fetch(`${baseUrl}/finance/accounts?per_page=200&page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) break;
    const d = await r.json();
    const items: any[] = d?.data?.data ?? d?.data ?? [];
    all.push(...items);
    if (items.length < 200) break;
  }
  return all;
}

/** GET — hanya baca, aman di semua environment */
export async function GET(req: NextRequest) {
  try {
    const cfg = await getKledoCfg(req.headers.get('authorization') ?? '');
    if (!cfg) return NextResponse.json({ error: 'Token Kledo tidak ditemukan. Konfigurasikan token di Integrasi > Kledo.' }, { status: 401 });

    const accounts = await fetchAllAccounts(cfg.baseUrl, cfg.token);

    // Semua akun dengan tipe (untuk debug)
    const allAccounts = accounts.map(a => ({
      id:       a.id,
      name:     a.name,
      code:     a.code ?? null,
      type:     a.type ?? a.account_type ?? null,
      category: a.category?.name ?? a.category ?? null,
      typeId:   a.type_id ?? null,
    }));

    // Untuk setiap bankKey, temukan akun yang cocok
    const matches: Record<string, any> = {};
    for (const [key, keywords] of Object.entries(BANK_KEYWORDS)) {
      let found: any = null;
      let matchedKw: string | null = null;
      for (const kw of keywords) {
        found = accounts.find(a => (a.name ?? '').toLowerCase().includes(kw));
        if (found) { matchedKw = kw; break; }
      }
      matches[key] = found
        ? { id: found.id, name: found.name, matchedKeyword: matchedKw, category: found.category?.name ?? null, type: found.type ?? null }
        : null;
    }

    // Kelompokkan per kategori (untuk overview)
    const grouped: Record<string, any[]> = {};
    for (const acc of accounts) {
      const cat = acc.category?.name ?? acc.type ?? 'Lain-lain';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ id: acc.id, name: acc.name, code: acc.code ?? null });
    }

    return NextResponse.json({
      total: accounts.length,
      baseUrl: cfg.baseUrl,
      keyword_matches: matches,
      grouped,
      all_accounts: allAccounts,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** POST — BENAR-BENAR menandai invoice; hanya tersedia di development */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Endpoint POST debug tidak tersedia di production — gunakan GET untuk cek akun' }, { status: 404 });
  }
  try {
    const cfg = await getKledoCfg(req.headers.get('authorization') ?? '');
    if (!cfg) return NextResponse.json({ error: 'Token Kledo tidak ditemukan' }, { status: 401 });

    const body = await req.json();
    const { invoiceId, bankKey, amount, date, financeAccountId } = body;
    if (!invoiceId || !amount) {
      return NextResponse.json({ error: 'Butuh: invoiceId, amount. Opsional: bankKey atau financeAccountId langsung' }, { status: 400 });
    }
    const today = date ?? new Date().toISOString().split('T')[0];
    const amountInt = Math.round(Number(amount));

    const accounts = await fetchAllAccounts(cfg.baseUrl, cfg.token);

    let foundAccount: any = null;
    let matchedKeyword: string | null = null;

    // Bisa pakai financeAccountId langsung (bypass keyword search)
    if (financeAccountId) {
      foundAccount = accounts.find(a => Number(a.id) === Number(financeAccountId))
        ?? { id: financeAccountId, name: `Account #${financeAccountId}` };
      matchedKeyword = 'langsung (override)';
    } else if (bankKey) {
      const keywords = BANK_KEYWORDS[bankKey.toLowerCase()] ?? [bankKey.toLowerCase()];
      for (const kw of keywords) {
        foundAccount = accounts.find((a: any) => (a.name ?? '').toLowerCase().includes(kw));
        if (foundAccount) { matchedKeyword = kw; break; }
      }
    }

    const trace: any = {
      step1_cari_akun: {
        bankKey: bankKey ?? null,
        financeAccountId: financeAccountId ?? null,
        total_accounts_fetched: accounts.length,
        found: foundAccount ? { id: foundAccount.id, name: foundAccount.name, matchedKeyword, category: foundAccount.category?.name ?? null } : null,
        semua_akun_jika_tidak_ketemu: foundAccount ? undefined : accounts.map(a => `${a.id}: ${a.name} [${a.category?.name ?? a.type ?? '-'}]`),
      },
    };

    if (!foundAccount) {
      return NextResponse.json({ ok: false, trace });
    }

    const headers = { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' };
    const base = {
      trans_date: today,
      finance_account_id: Number(foundAccount.id),
      memo: `Test lunas debug — invoice ${invoiceId}`,
    };

    const v1body = { ...base, pay_from: [{ id: Number(invoiceId), amount: amountInt }] };
    const r1 = await fetch(`${cfg.baseUrl}/finance/invoicepayments`, { method: 'POST', headers, body: JSON.stringify(v1body) });
    const d1 = await r1.json();
    trace.step2_lunas = { variasi1: { payload: v1body, status: r1.status, ok: r1.ok, response: d1 } };

    if (!r1.ok) {
      const v2body = { ...base, items: [{ invoice_id: Number(invoiceId), amount: amountInt }] };
      const r2 = await fetch(`${cfg.baseUrl}/finance/invoicepayments`, { method: 'POST', headers, body: JSON.stringify(v2body) });
      const d2 = await r2.json();
      trace.step2_lunas.variasi2 = { payload: v2body, status: r2.status, ok: r2.ok, response: d2 };
      return NextResponse.json({ ok: r2.ok, trace });
    }

    return NextResponse.json({ ok: true, trace });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
