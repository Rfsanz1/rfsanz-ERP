import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/localDb';
import { pushOrderToKledo } from '@/lib/kledoSync';
import { proxyToBackend } from '@/lib/backendProxy';

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return proxyToBackend(req, '/api/sales/invoices/resync', { method: 'POST' });
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
    const authHeader = req.headers.get('authorization') ?? '';

    const result = await pushOrderToKledo(authHeader, {
      soNumber:         order.so_number,
      tanggal:          order.tanggal,
      catatan:          order.catatan ?? undefined,
      contactId:        order.kledo_contact_id ? Number(order.kledo_contact_id) : null,
      contactName:      order.nama_customer,
      diskonTotal:      Number(order.diskon_total ?? 0),
      pajak:            Number(order.pajak ?? 0),
      ongkir:           Number(order.ongkir ?? 0),
      totalHarga:       Number(order.total_harga ?? 0),
      metodePembayaran: order.metode_pembayaran ?? 'transfer',
      bankPilihan:      null,
      items: (order.items ?? []).map((it: any) => ({
        nama:           it.nama,
        qty:            Number(it.qty ?? 1),
        harga:          Number(it.harga ?? 0),
        subtotal:       Number(it.subtotal ?? 0),
        diskon:         Number(it.diskon ?? 0),
        kledoProductId: it.kledo_product_id ?? null,
      })),
    });

    if (result.ok && result.kledoInvoiceId) {
      await db.query(
        `UPDATE local_orders SET kledo_invoice_id=$1, kledo_synced=true, updated_at=NOW() WHERE id=$2`,
        [String(result.kledoInvoiceId), orderId],
      );
    }

    return NextResponse.json({
      ok:         result.ok,
      invoiceId:  result.kledoInvoiceId,
      ref:        result.kledoRef,
      error:      result.error,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
