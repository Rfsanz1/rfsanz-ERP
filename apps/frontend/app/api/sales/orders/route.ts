import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateSoNumber } from '@/lib/localDb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      namaCustomer, noHp, alamat, catatan, salesName,
      tanggal, diskonTotal, pajak, ongkir, totalHarga,
      status = 'pending', items = [], customerId,
    } = body;

    if (!namaCustomer) {
      return NextResponse.json({ data: null, error: 'namaCustomer wajib diisi' }, { status: 400 });
    }

    const db = getDb();
    const soNumber = generateSoNumber();

    const orderRes = await db.query(
      `INSERT INTO local_orders
        (nama_customer, no_hp, alamat, catatan, sales_name, tanggal,
         diskon_total, pajak, ongkir, total_harga, status, customer_id, so_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        namaCustomer, noHp ?? null, alamat ?? null, catatan ?? null,
        salesName ?? null, tanggal ?? new Date().toISOString().slice(0, 10),
        diskonTotal ?? 0, pajak ?? 0, ongkir ?? 0,
        totalHarga ?? 0, status, customerId ?? null, soNumber,
      ],
    );
    const order = orderRes.rows[0];

    if (Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        await db.query(
          `INSERT INTO local_order_items
            (order_id, nama, qty, harga, subtotal, diskon, product_id, kledo_product_id, unit)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            order.id, it.nama, it.qty ?? 1, it.harga ?? 0,
            it.subtotal ?? (it.qty ?? 1) * (it.harga ?? 0),
            it.diskon ?? 0, it.productId ?? null,
            it.kledoProductId ?? null, it.unit ?? null,
          ],
        );
      }
    }

    const fullOrder = await getOrderById(db, order.id);
    return NextResponse.json({ data: fullOrder, error: null });
  } catch (e: any) {
    console.error('[POST /api/sales/orders]', e);
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
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
             json_build_object('id',i.id,'nama',i.nama,'qty',i.qty,'harga',i.harga,'subtotal',i.subtotal,'diskon',i.diskon,'unit',i.unit,'productId',i.product_id,'kledoProductId',i.kledo_product_id)
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

    const data = rows.rows.map(normalizeOrder);
    return NextResponse.json({ data: { data, total, page, totalPages: Math.ceil(total / limit) }, error: null });
  } catch (e: any) {
    console.error('[GET /api/sales/orders]', e);
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}

async function getOrderById(db: any, id: number) {
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
  return res.rows[0] ? normalizeOrder(res.rows[0]) : null;
}

function normalizeOrder(r: any) {
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
