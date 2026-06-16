import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token, baseUrl, invoice } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token Kledo belum dikonfigurasi. Atur di Settings → API Integration → Kledo.' },
        { status: 400 },
      );
    }

    const base = (baseUrl || 'https://api.kledo.com').replace(/\/$/, '');
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    let defaultAccountId: number | null = null;
    try {
      const accRes = await fetch(`${base}/api/v1/finance/accounts?type=income&per_page=50`, { headers });
      if (accRes.ok) {
        const accData = await accRes.json();
        const accounts: any[] = accData.data?.data ?? accData.data ?? [];
        if (accounts.length > 0) defaultAccountId = accounts[0].id;
      }
    } catch {}

    const items = (invoice.items ?? []).map((item: any) => ({
      finance_account_id: item.finance_account_id ?? defaultAccountId,
      product_id: item.product_id ?? undefined,
      name: item.name_item ?? item.name ?? '',
      qty: item.qty ?? 1,
      rate: item.rate ?? 0,
      discount: item.discount ?? 0,
      unit: item.unit ?? undefined,
    }));

    const payload: Record<string, any> = {
      trans_date: invoice.trans_date,
      due_date: invoice.due_date,
      include_tax: invoice.include_tax ?? 0,
      items,
    };
    if (invoice.ref_number) payload.ref_number = invoice.ref_number;
    if (invoice.memo) payload.memo = invoice.memo;
    if (invoice.contact_id) payload.contact_id = invoice.contact_id;
    if (invoice.contact_name) payload.contact_name = invoice.contact_name;
    if (invoice.discount) payload.discount = invoice.discount;

    const res = await fetch(`${base}/api/v1/finance/invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: data?.message ?? 'Gagal membuat invoice di Kledo', detail: data },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message ?? 'Error tidak diketahui' }, { status: 500 });
  }
}
