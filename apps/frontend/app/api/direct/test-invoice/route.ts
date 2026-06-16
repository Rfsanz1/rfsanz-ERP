import { NextRequest, NextResponse } from 'next/server';

const BACKEND_RAW = process.env.BACKEND_URL || '';
const BACKEND = BACKEND_RAW && !BACKEND_RAW.startsWith('http')
  ? `https://${BACKEND_RAW}`
  : BACKEND_RAW;

async function getKledoToken(authHeader: string): Promise<{ token: string; baseUrl: string } | null> {
  try {
    const r = await fetch(`${BACKEND}/api/settings`, {
      headers: { Authorization: authHeader, 'ngrok-skip-browser-warning': '1' },
    });
    if (r.ok) {
      const d = await r.json();
      const token = d?.data?.kledo_token ?? '';
      if (token) return { token, baseUrl: 'https://api.kledo.com/api/v1' };
    }
  } catch {}
  return null;
}

async function getKledoFinanceAccount(baseUrl: string, token: string): Promise<number | null> {
  try {
    const r = await fetch(`${baseUrl}/finance/accounts?type=income&per_page=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      const d = await r.json();
      const accounts: any[] = d?.data?.data ?? d?.data ?? [];
      if (accounts.length > 0) return accounts[0].id;
    }
  } catch {}
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoice, fonnte_token, wa_phone } = body;
    const authHeader = req.headers.get('authorization') ?? '';

    const kledoCfg = await getKledoToken(authHeader);
    if (!kledoCfg) {
      return NextResponse.json({ success: false, kledo: false, wa: false, message: 'Tidak bisa ambil token Kledo dari backend.' }, { status: 400 });
    }

    const { token: kledoToken, baseUrl } = kledoCfg;
    const defaultAccountId = await getKledoFinanceAccount(baseUrl, kledoToken);

    const kledoItems = (invoice.items ?? []).map((it: any) => ({
      finance_account_id: it.finance_account_id ?? defaultAccountId,
      name: it.name_item ?? it.name ?? '',
      qty: it.qty ?? 1,
      rate: it.rate ?? it.harga ?? 0,
      discount: it.discount ?? 0,
      unit: it.unit ?? undefined,
    }));

    const kledoPayload: Record<string, any> = {
      trans_date: invoice.trans_date,
      due_date: invoice.due_date,
      include_tax: invoice.include_tax ?? 0,
      items: kledoItems,
    };
    if (invoice.ref_number) kledoPayload.ref_number = invoice.ref_number;
    if (invoice.memo) kledoPayload.memo = invoice.memo;
    if (invoice.contact_id) kledoPayload.contact_id = invoice.contact_id;
    if (invoice.contact_name) kledoPayload.contact_name = invoice.contact_name;
    if (invoice.discount) kledoPayload.discount = invoice.discount;

    const kledoRes = await fetch(`${baseUrl}/finance/invoices`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kledoToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(kledoPayload),
    });

    const kledoData = await kledoRes.json();
    const kledoOk = kledoRes.ok && (kledoData?.status === true || kledoData?.data);
    const kledoInvoiceId = kledoData?.data?.id ?? null;
    const kledoRefNumber = kledoData?.data?.ref_number ?? invoice.ref_number ?? null;

    let waOk = false;
    let waMsg = '';
    if (fonnte_token && wa_phone) {
      let phone = String(wa_phone).replace(/\D/g, '');
      if (phone.startsWith('0')) phone = '62' + phone.slice(1);
      else if (!phone.startsWith('62')) phone = '62' + phone;

      const grandTotal = (invoice.items ?? []).reduce((s: number, it: any) => s + (it.qty ?? 1) * (it.rate ?? it.harga ?? 0), 0);
      const dueFmt = invoice.due_date
        ? new Date(invoice.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';
      const message = `Halo ${invoice.contact_name ?? 'Pelanggan'}, invoice ${kledoRefNumber ?? 'baru'} senilai Rp ${grandTotal.toLocaleString('id-ID')} jatuh tempo pada ${dueFmt}. Mohon segera melakukan pembayaran. Terima kasih.`;

      const waRes = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: fonnte_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: phone, message, countryCode: '62' }),
      });
      const waData = await waRes.json();
      waOk = waRes.ok && waData?.status !== false;
      waMsg = waData?.reason ?? waData?.message ?? (waOk ? 'Terkirim' : 'Gagal');
    }

    return NextResponse.json({
      success: kledoOk,
      kledo: kledoOk,
      kledo_invoice_id: kledoInvoiceId,
      kledo_ref: kledoRefNumber,
      kledo_detail: kledoData,
      wa: waOk,
      wa_message: waMsg,
      message: kledoOk
        ? `Invoice berhasil dibuat di Kledo${waOk ? ' dan WA terkirim' : ''}`
        : `Gagal buat invoice di Kledo: ${kledoData?.message ?? JSON.stringify(kledoData)}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message ?? 'Error tidak diketahui' }, { status: 500 });
  }
}
