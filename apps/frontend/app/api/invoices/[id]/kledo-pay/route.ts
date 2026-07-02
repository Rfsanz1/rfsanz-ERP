/**
 * POST /api/invoices/:id/kledo-pay
 * Tandai pembayaran invoice di Kledo setelah berhasil dicatat lokal.
 *
 * Body:
 *   kledoInvoiceId : string | number   — ID invoice di Kledo
 *   amount         : number            — jumlah bayar
 *   method         : 'transfer' | 'debit' | 'cash' | 'tunai' | 'kartu'
 *   bankPilihan?   : 'bca' | 'bri' | 'bni' | 'mandiri'
 *   edcPilihan?    : 'bca_edc' | 'bri_edc' | 'bni_edc'
 *   unitBisnis?    : 'elektronik' | 'bahan_bangunan'
 *   date?          : 'YYYY-MM-DD'
 *
 * Mapping ke akun Kledo:
 *   transfer + bca        → BCA Giro        (keywords: bca giro, giro bca)
 *   transfer + bri        → BRI EDC         (keywords: bri edc, bri)
 *   transfer + bni        → BNI             (keywords: bni)
 *   transfer + mandiri    → Mandiri         (keywords: mandiri)
 *   debit   + bca_edc     → BCA EDC         (keywords: bca edc, edc bca)
 *   debit   + bri_edc     → BRI EDC         (keywords: bri edc, edc bri)
 *   debit   + bni_edc     → BNI             (keywords: bni)
 *   cash    + elektronik  → KAS ELEKTRONIK  (keywords: kas elektronik, elektronik)
 *   cash    + bahan_bangunan → KAS SULAWESI (keywords: kas sulawesi, sulawesi)
 *   cash    (default)     → Kas umum        (keywords: kas masuk, kas tunai, kas)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getKledoCfg, getBankAccountId, markKledoInvoicePaid } from '@/lib/kledoSync';

function resolveKey(
  method: string,
  bankPilihan?: string,
  edcPilihan?: string,
  unitBisnis?: string,
): { key: string; label: string } {
  const m = method.toLowerCase();

  if (m === 'transfer') {
    const b = bankPilihan?.toLowerCase() ?? '';
    if (b === 'bca')     return { key: 'bca',     label: 'BCA Giro' };
    if (b === 'bri')     return { key: 'bri',     label: 'BRI EDC' };
    if (b === 'bni')     return { key: 'bni',     label: 'BNI' };
    if (b === 'mandiri') return { key: 'mandiri', label: 'Mandiri' };
    return { key: 'transfer', label: 'Transfer Bank' };
  }

  if (m === 'debit' || m === 'kartu') {
    const e = edcPilihan?.toLowerCase() ?? '';
    if (e === 'bca_edc') return { key: 'bca_edc', label: 'BCA EDC' };
    if (e === 'bri_edc') return { key: 'bri_edc', label: 'BRI EDC' };
    if (e === 'bni_edc') return { key: 'bni_edc', label: 'BNI EDC' };
    return { key: 'edc', label: 'Debit/EDC' };
  }

  if (m === 'cash' || m === 'tunai') {
    const u = unitBisnis?.toLowerCase() ?? '';
    if (u === 'elektronik')     return { key: 'elektronik',     label: 'KAS ELEKTRONIK' };
    if (u === 'bahan_bangunan') return { key: 'bahan_bangunan', label: 'KAS SULAWESI' };
    return { key: 'kas', label: 'Kas' };
  }

  // fallback
  return { key: 'transfer', label: method };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const cfg = await getKledoCfg(authHeader);
    if (!cfg) {
      return NextResponse.json(
        { ok: false, error: 'Token Kledo tidak ditemukan — atur di Settings → Integrasi → Kledo' },
        { status: 200 },
      );
    }

    const body = await req.json();
    const { kledoInvoiceId, amount, method, bankPilihan, edcPilihan, unitBisnis, date } = body;

    if (!kledoInvoiceId) {
      return NextResponse.json({ ok: false, error: 'Invoice ini belum pernah di-push ke Kledo' }, { status: 200 });
    }
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ ok: false, error: 'Jumlah pembayaran tidak valid' }, { status: 200 });
    }

    const { key, label } = resolveKey(method ?? 'transfer', bankPilihan, edcPilihan, unitBisnis);
    const payDate = date ?? new Date().toISOString().split('T')[0];
    const memo    = `Pembayaran ${label} — ${params.id}`;

    const accountId = await getBankAccountId(cfg.baseUrl, cfg.token, key);
    if (!accountId) {
      return NextResponse.json(
        { ok: false, error: `Akun "${label}" tidak ditemukan di COA Kledo. Cek nama akun di Kledo agar mengandung kata kunci yang sesuai.` },
        { status: 200 },
      );
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
