/**
 * DEBUG: Test auto-lunas Kledo
 * GET  /api/debug/kledo-lunas          → list semua akun Kledo
 * POST /api/debug/kledo-lunas          → test tandai invoice sebagai lunas
 *      body: { invoiceId, accountId, amount, date }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getKledoCfg } from '@/lib/kledoSync';

export async function GET(req: NextRequest) {
  try {
    const cfg = await getKledoCfg(req.headers.get('authorization') ?? '');
    if (!cfg) return NextResponse.json({ error: 'Token Kledo tidak ditemukan' }, { status: 401 });

    // Ambil semua akun — coba beberapa halaman
    const allAccounts: any[] = [];
    for (let page = 1; page <= 5; page++) {
      const r = await fetch(
        `${cfg.baseUrl}/finance/accounts?per_page=200&page=${page}`,
        { headers: { Authorization: `Bearer ${cfg.token}` } },
      );
      if (!r.ok) break;
      const d = await r.json();
      const items: any[] = d?.data?.data ?? d?.data ?? [];
      allAccounts.push(...items);
      if (items.length < 200) break; // halaman terakhir
    }

    // Kelompokkan berdasarkan category/type agar mudah dibaca
    const grouped: Record<string, any[]> = {};
    for (const acc of allAccounts) {
      const cat = acc.category?.name ?? acc.type ?? acc.account_type ?? 'lain-lain';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ id: acc.id, name: acc.name, code: acc.code });
    }

    return NextResponse.json({
      total: allAccounts.length,
      grouped,
      raw_sample: allAccounts.slice(0, 10),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cfg = await getKledoCfg(req.headers.get('authorization') ?? '');
    if (!cfg) return NextResponse.json({ error: 'Token Kledo tidak ditemukan' }, { status: 401 });

    const body = await req.json();
    const { invoiceId, accountId, amount, date } = body;

    if (!invoiceId || !accountId || !amount) {
      return NextResponse.json({ error: 'Butuh: invoiceId, accountId, amount' }, { status: 400 });
    }

    const today = date ?? new Date().toISOString().split('T')[0];

    // Coba dua variasi payload — Kledo kadang berubah format
    const payloads = [
      // Variasi 1: pay_from
      {
        trans_date: today,
        finance_account_id: Number(accountId),
        memo: 'Test auto-lunas',
        pay_from: [{ id: Number(invoiceId), amount: Number(amount) }],
      },
      // Variasi 2: items dengan invoice_id
      {
        trans_date: today,
        finance_account_id: Number(accountId),
        memo: 'Test auto-lunas',
        items: [{ invoice_id: Number(invoiceId), amount: Number(amount) }],
      },
    ];

    const results: any[] = [];
    for (const [i, payload] of payloads.entries()) {
      const res = await fetch(`${cfg.baseUrl}/finance/invoicepayments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      results.push({
        variasi: i + 1,
        payload,
        status: res.status,
        ok: res.ok,
        response: data,
      });
      if (res.ok) break; // berhasil, stop
    }

    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
