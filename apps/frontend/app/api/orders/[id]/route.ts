import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/localDb';
import { proxyToBackend } from '@/lib/backendProxy';

async function getOrderById(db: any, id: string) {
  const res = await db.query(
    `SELECT o.*,
       COALESCE(
         json_agg(
           json_build_object('id',i.id,'nama',i.nama,'qty',i.qty,'harga',i.harga,'subtotal',i.subtotal,'diskon',i.diskon,'unit',i.unit,'productId',i.product_id,'kledoProductId',i.kledo_product_id)
           ORDER BY i.id
         ) FILTER (WHERE i.id IS NOT NULL), '[]'
       ) AS "orderItems"
     FROM local_orders o
     LEFT JOIN local_order_items i ON i.order_id = o.id
     WHERE o.id = $1
     GROUP BY o.id`,
    [id],
  );
  if (!res.rows[0]) return null;
  const r = res.rows[0];
  return {
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
  };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!process.env.DATABASE_URL) {
    return proxyToBackend(_req, `/api/orders/${params.id}`);
  }
  try {
    await ensureTables();
    const db = getDb();
    const order = await getOrderById(db, params.id);
    if (!order) return NextResponse.json({ data: null, error: 'Order tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ data: order, error: null });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!process.env.DATABASE_URL) {
    return proxyToBackend(req, `/api/orders/${params.id}`, { method: 'PATCH' });
  }
  try {
    await ensureTables();
    const body = await req.json();
    const db = getDb();

    const allowed = ['status', 'status_pengiriman', 'catatan', 'sales_name', 'kledo_invoice_id', 'kledo_synced'];
    const sets: string[] = [];
    const vals: any[] = [];
    let pi = 1;

    const fieldMap: Record<string, string> = {
      status: 'status',
      statusPengiriman: 'status_pengiriman',
      catatan: 'catatan',
      salesName: 'sales_name',
      kledoInvoiceId: 'kledo_invoice_id',
      kledoSynced: 'kledo_synced',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (body[key] !== undefined) {
        sets.push(`${col} = $${pi}`);
        vals.push(body[key]);
        pi++;
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ data: null, error: 'Tidak ada field yang diupdate' }, { status: 400 });
    }

    sets.push(`updated_at = NOW()`);
    vals.push(params.id);

    await db.query(
      `UPDATE local_orders SET ${sets.join(', ')} WHERE id = $${pi}`,
      vals,
    );

    const order = await getOrderById(db, params.id);
    return NextResponse.json({ data: order, error: null });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!process.env.DATABASE_URL) {
    return proxyToBackend(_req, `/api/orders/${params.id}`, { method: 'DELETE' });
  }
  try {
    await ensureTables();
    const db = getDb();
    await db.query('DELETE FROM local_orders WHERE id = $1', [params.id]);
    return NextResponse.json({ data: { id: params.id }, error: null });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}
