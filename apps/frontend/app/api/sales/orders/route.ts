import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateSoNumber, ensureTables } from '@/lib/localDb';
import { pushOrderToKledo } from '@/lib/kledoSync';
import { sendAllOrderNotifications } from '@/lib/server/waServer';

/** Jika DATABASE_URL tidak dikonfigurasi (mis. CasaOS tanpa local DB di frontend),
 *  forward langsung ke backend yang sudah punya semua logic (Kledo, WA, dsb). */
async function forwardToBackend(req: NextRequest, path: string, body?: unknown): Promise<NextResponse> {
  const BACKEND = process.env.BACKEND_URL ?? '';
  if (!BACKEND) {
    return NextResponse.json({ data: null, error: 'BACKEND_URL tidak dikonfigurasi' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization') ?? '';
  try {
    const r = await fetch(`${BACKEND}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });
    const data = await r.json().catch(() => ({ data: null, error: 'Respons tidak valid dari backend' }));
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    const msg = e?.name === 'TimeoutError' ? 'Backend timeout (25 detik)' : (e.message ?? 'Gagal menghubungi backend');
    return NextResponse.json({ data: null, error: msg }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  /* Jika tidak ada local DB, pakai backend langsung */
  if (!process.env.DATABASE_URL) {
    const body = await req.json();
    return forwardToBackend(req, '/api/sales/orders', body);
  }

  try {
    await ensureTables();
    const body = await req.json();
    const {
      namaCustomer, noHp, alamat, catatan, salesName,
      tanggal, diskonTotal, pajak, ongkir, totalHarga,
      status = 'pending', items = [], customerId,
      kledoContactId,
      metodePembayaran = 'transfer',
      bankPilihan = null,
      edcPilihan = null,
      unitBisnis = null,
      metodeDp = null,
      uangMuka = 0,
    } = body;

    if (!namaCustomer) {
      return NextResponse.json({ data: null, error: 'namaCustomer wajib diisi' }, { status: 400 });
    }

    const db = getDb();
    const soNumber = generateSoNumber();

    const orderRes = await db.query(
      `INSERT INTO local_orders
        (nama_customer, no_hp, alamat, catatan, sales_name, tanggal,
         diskon_total, pajak, ongkir, total_harga, status, customer_id, so_number,
         metode_pembayaran, uang_muka, kledo_contact_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        namaCustomer, noHp ?? null, alamat ?? null, catatan ?? null,
        salesName ?? null, tanggal ?? new Date().toISOString().slice(0, 10),
        diskonTotal ?? 0, pajak ?? 0, ongkir ?? 0,
        totalHarga ?? 0, status, customerId ?? null, soNumber,
        metodePembayaran, uangMuka ?? 0, kledoContactId ?? null,
      ],
    );
    const order = orderRes.rows[0];

    const savedItems: any[] = [];
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
        savedItems.push(it);
      }
    }

    /* ── Auto-sync ke Kledo ── */
    const authHeader = req.headers.get('authorization') ?? '';
    let kledoOk = false;
    let kledoInvoiceId: number | null = null;
    let kledoError: string | undefined;

    try {
      const result = await pushOrderToKledo(authHeader, {
        soNumber,
        tanggal: tanggal ?? new Date().toISOString().slice(0, 10),
        catatan: catatan ?? undefined,
        contactId: kledoContactId ? Number(kledoContactId) : null,
        contactName: namaCustomer,
        diskonTotal: diskonTotal ?? 0,
        pajak: pajak ?? 0,
        ongkir: ongkir ?? 0,
        totalHarga: totalHarga ?? 0,
        metodePembayaran,
        bankPilihan: bankPilihan ?? null,
        edcPilihan: edcPilihan ?? null,
        unitBisnis: unitBisnis ?? null,
        metodeDp: metodeDp ?? null,
        items: savedItems.length > 0 ? savedItems : items,
      });

      kledoOk = result.ok;
      kledoInvoiceId = result.kledoInvoiceId;
      kledoError = result.error;

      if (kledoOk && kledoInvoiceId) {
        await db.query(
          `UPDATE local_orders SET kledo_invoice_id=$1, kledo_synced=true, updated_at=NOW() WHERE id=$2`,
          [String(kledoInvoiceId), order.id],
        );
      }
    } catch (e: any) {
      kledoError = e.message;
    }

    const fullOrder = await getOrderById(db, order.id);

    /* ── Kirim notifikasi WhatsApp ke grup & konsumen (non-blocking) ── */
    let waResult: any = { skipped: true };
    try {
      waResult = await sendAllOrderNotifications({
        soNumber,
        namaCustomer,
        noHp: noHp ?? null,
        salesName: salesName ?? null,
        items: (savedItems.length > 0 ? savedItems : items).map((it: any) => ({
          nama: it.nama,
          qty: Number(it.qty ?? 1),
          harga: Number(it.harga ?? 0),
        })),
        totalHarga: Number(totalHarga ?? 0),
        metodePembayaran,
        bankPilihan: bankPilihan ?? null,
        status: 'pending',
      });
      console.log('[WA notifikasi]', JSON.stringify(waResult));
    } catch (waErr: any) {
      console.error('[WA notifikasi error]', waErr.message);
    }

    return NextResponse.json({
      data: fullOrder,
      error: null,
      kledo: { ok: kledoOk, invoiceId: kledoInvoiceId, error: kledoError },
      wa: waResult,
    });
  } catch (e: any) {
    console.error('[POST /api/sales/orders]', e);
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return forwardToBackend(req, '/api/sales/orders');
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

export function normalizeOrder(r: any) {
  return {
    id:              r.id,
    soNumber:        r.so_number,
    namaCustomer:    r.nama_customer,
    noHp:            r.no_hp,
    alamat:          r.alamat,
    catatan:         r.catatan,
    salesName:       r.sales_name,
    tanggal:         r.tanggal,
    diskonTotal:     Number(r.diskon_total  ?? 0),
    pajak:           Number(r.pajak         ?? 0),
    ongkir:          Number(r.ongkir        ?? 0),
    totalHarga:      Number(r.total_harga   ?? 0),
    uangMuka:        Number(r.uang_muka     ?? 0),
    metodePembayaran: r.metode_pembayaran ?? 'transfer',
    status:          r.status,
    statusPengiriman: r.status_pengiriman,
    customerId:      r.customer_id,
    kledoContactId:  r.kledo_contact_id,
    kledoInvoiceId:  r.kledo_invoice_id,
    kledoSynced:     r.kledo_synced,
    createdAt:       r.created_at,
    updatedAt:       r.updated_at,
    orderItems:      r.orderItems ?? [],
    source: 'local',
  };
}
