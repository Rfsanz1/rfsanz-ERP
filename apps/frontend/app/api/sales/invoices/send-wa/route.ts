import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/localDb';
import { sendAllOrderNotifications } from '@/lib/server/waServer';
import { proxyToBackend } from '@/lib/backendProxy';

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return proxyToBackend(req, '/api/sales/invoices/send-wa', { method: 'POST' });
  }
  try {
    await ensureTables();
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ ok: false, error: 'orderId wajib diisi' }, { status: 400 });

    const db = getDb();
    const orderRes = await db.query(
      `SELECT o.*, COALESCE(json_agg(i.* ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
         FROM local_orders o
         LEFT JOIN local_order_items i ON i.order_id = o.id
        WHERE o.id = $1
        GROUP BY o.id`,
      [orderId],
    );
    if (!orderRes.rows.length) return NextResponse.json({ ok: false, error: 'Invoice tidak ditemukan' }, { status: 404 });

    const order = orderRes.rows[0];

    const waResult = await sendAllOrderNotifications({
      soNumber:         order.so_number,
      namaCustomer:     order.nama_customer,
      noHp:             order.no_hp ?? null,
      salesName:        order.sales_name ?? null,
      items: (order.items ?? []).map((it: any) => ({
        nama:  it.nama,
        qty:   Number(it.qty ?? 1),
        harga: Number(it.harga ?? 0),
      })),
      totalHarga:       Number(order.total_harga ?? 0),
      metodePembayaran: order.metode_pembayaran ?? 'transfer',
      bankPilihan:      null,
      status:           order.status ?? 'pending',
    });

    const grupOk = waResult?.grupOrder?.ok === true;
    const konsOk = waResult?.konsumen?.ok === true;
    const ok     = grupOk || konsOk;

    return NextResponse.json({
      ok,
      grupOrder: waResult?.grupOrder,
      konsumen:  waResult?.konsumen,
      error:     ok ? undefined : (waResult?.grupOrder?.reason ?? waResult?.konsumen?.reason ?? 'Gagal kirim WA'),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
