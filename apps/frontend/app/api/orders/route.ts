import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/localDb';
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return proxyToBackend(req, '/api/orders');
  }
  try {
    await ensureTables();
    const { searchParams } = new URL(req.url);
    const limit  = Number(searchParams.get('limit')  ?? 30);
    const page   = Number(searchParams.get('page')   ?? 1);
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? '';
    const offset = (page - 1) * limit;

    const db = getDb();

    let where = 'WHERE 1=1';
    const params: any[] = [];
    let pi = 1;

    if (search) {
      where += ` AND (o.nama_customer ILIKE $${pi} OR o.so_number ILIKE $${pi})`;
      params.push(`%${search}%`);
      pi++;
    }
    if (status) {
      where += ` AND o.status = $${pi}`;
      params.push(status);
      pi++;
    }

    const countRes = await db.query(
      `SELECT COUNT(*) FROM local_orders o ${where}`, params,
    );
    const total = Number(countRes.rows[0].count);

    const rows = await db.query(
      `SELECT o.*,
         COALESCE(
           json_agg(
             json_build_object('id',i.id,'nama',i.nama,'qty',i.qty,'harga',i.harga,'subtotal',i.subtotal,'diskon',i.diskon,'unit',i.unit)
             ORDER BY i.id
           ) FILTER (WHERE i.id IS NOT NULL), '[]'
         ) AS "orderItems"
       FROM local_orders o
       LEFT JOIN local_order_items i ON i.order_id = o.id
       ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, limit, offset],
    );

    const data = rows.rows.map(r => ({
      id:           r.id,
      soNumber:     r.so_number,
      namaCustomer: r.nama_customer,
      noHp:         r.no_hp,
      alamat:       r.alamat,
      catatan:      r.catatan,
      salesName:    r.sales_name,
      tanggal:      r.tanggal,
      diskonTotal:  Number(r.diskon_total ?? 0),
      pajak:        Number(r.pajak ?? 0),
      ongkir:       Number(r.ongkir ?? 0),
      totalHarga:   Number(r.total_harga ?? 0),
      status:       r.status,
      statusPengiriman: r.status_pengiriman,
      customerId:   r.customer_id,
      kledoInvoiceId: r.kledo_invoice_id,
      kledoSynced:  r.kledo_synced,
      createdAt:    r.created_at,
      updatedAt:    r.updated_at,
      orderItems:   r.orderItems ?? [],
      source: 'local',
    }));

    return NextResponse.json({
      data,
      meta: { total, page, totalPages: Math.ceil(total / limit), limit },
      total,
      error: null,
    });
  } catch (e: any) {
    console.error('[GET /api/orders]', e);
    return NextResponse.json({ data: [], meta: { total: 0 }, error: e.message }, { status: 500 });
  }
}
