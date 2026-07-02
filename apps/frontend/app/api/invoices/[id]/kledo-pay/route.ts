/**
 * POST /api/invoices/:id/kledo-pay
 * Tandai pembayaran invoice di Kledo setelah berhasil dicatat lokal.
 *
 * Body: { kledoInvoiceId: string|number, amount: number, method: string, date: string }
 * method: transfer | tunai | cek | giro | kartu
 */
import { NextRequest, NextResponse } from 'next/server';
import { getKledoCfg, getBankAccountId, markKledoInvoicePaid } from '@/lib/kledoSync';

/** Peta metode pembayaran ERP → kunci akun Kledo */
const METHOD_TO_KEY: Record<string, string> = {
  transfer: 'transfer',
  tunai:    'kas',
  cash:     'kas',
  cek:      'transfer',  // cek/giro → akun bank/transfer
  giro:     'transfer',
  kartu:    'edc',
  debit:    'edc',
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const cfg = await getKledoCfg(authHeader);
    if (!cfg) {
      return NextResponse.json({ ok: false, error: 'Token Kledo tidak ditemukan — atur di Settings → Integrasi → Kledo' }, { status: 200 });
    }

    const body = await req.json();
    const { kledoInvoiceId, amount, method, date } = body;

    if (!kledoInvoiceId) {
      return NextResponse.json({ ok: false, error: 'Invoice ini belum pernah di-push ke Kledo' }, { status: 200 });
    }
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ ok: false, error: 'Jumlah pembayaran tidak valid' }, { status: 200 });
    }

    const bankKey  = METHOD_TO_KEY[String(method).toLowerCase()] ?? 'transfer';
    const payDate  = date ?? new Date().toISOString().split('T')[0];
    const memo     = `Pembayaran ${method ?? 'transfer'} — Invoice ${params.id}`;

    const accountId = await getBankAccountId(cfg.baseUrl, cfg.token, bankKey);
    if (!accountId) {
      return NextResponse.json({
        ok: false,
        error: `Akun "${bankKey}" tidak ditemukan di Kledo. Pastikan nama akun COA Kledo mengandung kata kunci yang sesuai.`,
      }, { status: 200 });
    }

    const result = await markKledoInvoicePaid(
      cfg.baseUrl,
      cfg.token,
      Number(kledoInvoiceId),
      accountId,
      Number(amount),
      payDate,
      memo,
    );

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
