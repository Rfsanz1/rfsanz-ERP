import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/localDb';
import { pushOrderToKledo } from '@/lib/kledoSync';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orderId } = body;

  if (!orderId) {
    return NextResponse.json({ data: null, error: 'orderId wajib diisi' }, { status: 400 });
  }

  /* Jika tidak ada local DB, forward retry ke backend */
  if (!process.env.DATABASE_URL) {
    const BACKEND = process.env.BACKEND_URL ?? '';
    if (!BACKEND) {
      return NextResponse.json({ data: null, error: 'BACKEND_URL tidak dikonfigurasi' }, { status: 500 });
    }
    const authHeader = req.headers.get('authorization') ?? '';
    try {
      const r = await fetch(`${BACKEND}/api/sales/orders/${orderId}/kledo-retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeader ? { Authorization: authHeader } : {}) },
        signal: AbortSignal.timeout(25000),
      });
      const data = await r.json().catch(() => ({ data: null, error: 'Respons tidak valid' }));
      return NextResponse.json(data, { status: r.status });
    } catch (e: any) {
      const msg = e?.name === 'TimeoutError' ? 'Backend timeout' : (e.message ?? 'Gagal menghubungi backend');
      return NextResponse.json({ data: null, error: msg }, { status: 502 });
    }
  }

  try {
    const db = getDb();

    const orderRes = await db.query(
      `SELECT o.*, 
         COALESCE(
           json_agg(
             json_build_object(
               'nama',i.nama,'qty',i.qty,'harga',i.harga,'subtotal',i.subtotal,
               'diskon',i.diskon,'unit',i.unit,'kledoProductId',i.kledo_product_id
             ) ORDER BY i.id
           ) FILTER (WHERE i.id IS NOT NULL), '[]'
         ) AS items
       FROM local_orders o
       LEFT JOIN local_order_items i ON i.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [orderId],
    );

    if (!orderRes.rows[0]) {
      return NextResponse.json({ data: null, error: 'Order tidak ditemukan' }, { status: 404 });
    }

    const o = orderRes.rows[0];
    const authHeader = req.headers.get('authorization') ?? '';

    const result = await pushOrderToKledo(authHeader, {
      soNumber:         o.so_number,
      salesName:        o.sales_name ?? null,
      tanggal:          o.tanggal instanceof Date
                          ? o.tanggal.toISOString().slice(0, 10)
                          : String(o.tanggal).slice(0, 10),
      catatan:          o.catatan ?? undefined,
      contactId:        o.kledo_contact_id ? Number(o.kledo_contact_id) : null,
      contactName:      o.nama_customer,
      diskonTotal:      Number(o.diskon_total ?? 0),
      pajak:            Number(o.pajak ?? 0),
      ongkir:           Number(o.ongkir ?? 0),
      totalHarga:       Number(o.total_harga ?? 0),
      metodePembayaran: o.metode_pembayaran ?? 'transfer',
      unitBisnis:       o.unit_bisnis ?? null,
      items:            (o.items ?? []).map((it: any) => ({
        nama:           it.nama,
        qty:            Number(it.qty ?? 1),
        harga:          Number(it.harga ?? 0),
        subtotal:       Number(it.subtotal ?? 0),
        diskon:         Number(it.diskon ?? 0) || undefined,
        kledoProductId: it.kledoProductId ?? null,
      })),
    });

    if (result.ok && result.kledoInvoiceId) {
      await db.query(
        `UPDATE local_orders SET kledo_invoice_id=$1, kledo_synced=true, updated_at=NOW() WHERE id=$2`,
        [String(result.kledoInvoiceId), orderId],
      );
    }

    return NextResponse.json({
      data: { orderId },
      error: null,
      kledo: { ok: result.ok, invoiceId: result.kledoInvoiceId, error: result.error },
    });
  } catch (e: any) {
    console.error('[POST /api/sales/orders/kledo-retry]', e);
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}
