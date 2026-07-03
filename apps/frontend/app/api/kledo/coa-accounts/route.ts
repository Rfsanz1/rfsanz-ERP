/**
 * GET /api/kledo/coa-accounts
 * List semua akun COA Kledo — dipakai untuk dropdown pilih akun pembayaran.
 * Bekerja di production: ambil token via getKledoCfg (dari backend jika perlu).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getKledoCfg } from '@/lib/kledoSync';

async function fetchAllAccounts(baseUrl: string, token: string) {
  const all: any[] = [];
  for (let page = 1; page <= 10; page++) {
    try {
      const r = await fetch(`${baseUrl}/finance/accounts?per_page=200&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) break;
      const d = await r.json();
      const items: any[] = d?.data?.data ?? d?.data ?? [];
      all.push(...items);
      if (items.length < 200) break;
    } catch { break; }
  }
  return all;
}

export async function GET(req: NextRequest) {
  try {
    const cfg = await getKledoCfg(req.headers.get('authorization') ?? '');
    if (!cfg) return NextResponse.json({ error: 'Token Kledo tidak ditemukan' }, { status: 401 });

    const accounts = await fetchAllAccounts(cfg.baseUrl, cfg.token);
    // Kelompokkan untuk memudahkan user memilih
    const grouped: Record<string, any[]> = {};
    for (const acc of accounts) {
      const cat = acc.category?.name ?? acc.type ?? 'Lain-lain';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ id: acc.id, name: acc.name, code: acc.code ?? null });
    }

    return NextResponse.json({
      data: accounts.map((a: any) => ({ id: a.id, name: a.name, code: a.code ?? null })),
      grouped,
      total: accounts.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
