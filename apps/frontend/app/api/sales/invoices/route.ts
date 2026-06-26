import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/localDb';
import { pushOrderToKledo } from '@/lib/kledoSync';
import { sendAllOrderNotifications } from '@/lib/server/waServer';
import { proxyToBackend } from '@/lib/backendProxy';

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return proxyToBackend(req, '/api/sales/invoices');
  }
  try {
    await ensureTables();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit  = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 30)));
    const search = (searchParams.get('search') ?? '').trim();
    const offset = (page - 1) * limit;

    const conds: string[] = [`o.so_number LIKE 'INV-%'`];
    const vals: any[] = [];
    let vi = 1;
    if (search) {
      conds.push(`(o.so_number ILIKE $${vi} OR o.nama_customer ILIKE $${vi} OR o.sales_name ILIKE $${vi})`);
      vals.push(`%${search}%`); vi++;
    }

    const where = conds.join(' AND ');

    const countRes = await db.query(
      `SELECT COUNT(*) FROM local_orders o WHERE ${where}`,
      vals,
    );
    const total = Number(countRes.rows[0].count);

    const rows = await db.query(
      `SELECT o.*,
              COALESCE(json_agg(i.* ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
         FROM local_orders o
         LEFT JOIN local_order_items i ON i.order_id = o.id
        WHERE ${where}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT $${vi} OFFSET $${vi + 1}`,
      [...vals, limit, offset],
    );

    return NextResponse.json({
      data: rows.rows,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
      error: null,
    });
  } catch (e: any) {
    return NextResponse.json({ data: [], meta: { total: 0, page: 1, limit: 30, pages: 0 }, error: e.message }, { status: 500 });
  }
}

function generateInvNumber(): string {
  const now = new Date();
  const yy  = now.getFullYear().toString().slice(2);
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${yy}${mm}${dd}-${rand}`;
}

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return proxyToBackend(req, '/api/sales/invoices', { method: 'POST' });
  }
  try {
    await ensureTables();
    const body = await req.json();
    const {
      namaCustomer,
      noHp,
      customerId,
      kledoContactId,
      salesName,
      tanggal,
      dueDate,
      notes,
      diskonTotal  = 0,
      pajak        = 0,
      ongkir       = 0,
      grandTotal   = 0,
      items        = [],
      metodePembayaran = 'transfer',
      bankPilihan  = null,
    } = body;

    if (!namaCustomer?.trim()) {
      return NextResponse.json({ data: null, error: 'namaCustomer wajib diisi' }, { status: 400 });
    }
    if (!items.length) {
      return NextResponse.json({ data: null, error: 'Minimal 1 item wajib diisi' }, { status: 400 });
    }

    const db      = getDb();
    const invNo   = generateInvNumber();
    const tanggalFinal = tanggal ?? new Date().toISOString().slice(0, 10);

    /* ── 1. Simpan ke local_orders (reuse tabel yang sama) ── */
    const orderRes = await db.query(
      `INSERT INTO local_orders
        (so_number, nama_customer, no_hp, catatan, sales_name, tanggal,
         diskon_total, pajak, ongkir, total_harga, status,
         customer_id, kledo_contact_id, metode_pembayaran)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',$11,$12,$13)
       RETURNING *`,
      [
        invNo, namaCustomer.trim(), noHp ?? null, notes ?? null,
        salesName ?? null, tanggalFinal,
        diskonTotal, pajak, ongkir, grandTotal,
        customerId ?? null, kledoContactId ?? null, metodePembayaran,
      ],
    );
    const order = orderRes.rows[0];

    const savedItems: any[] = [];
    for (const it of items) {
      await db.query(
        `INSERT INTO local_order_items
          (order_id, nama, qty, harga, subtotal, diskon, product_id, kledo_product_id, unit)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          order.id,
          it.nama, it.qty ?? 1, it.harga ?? 0,
          it.subtotal ?? (it.qty ?? 1) * (it.harga ?? 0),
          it.diskonItem ?? it.diskon ?? 0,
          it.productId ?? null, it.kledoProductId ?? null, it.unit ?? null,
        ],
      );
      savedItems.push(it);
    }

    /* ── 2. Push ke Kledo ── */
    const authHeader = req.headers.get('authorization') ?? '';
    let kledoOk = false;
    let kledoInvoiceId: number | null = null;
    let kledoRef: string | null = null;
    let kledoError: string | undefined;
    let kledoPaid = false;
    let kledoPaidError: string | undefined;

    try {
      const kledoResult = await pushOrderToKledo(authHeader, {
        soNumber:          invNo,
        tanggal:           tanggalFinal,
        dueDate:           dueDate ?? null,
        catatan:           notes ?? undefined,
        contactId:         kledoContactId ? Number(kledoContactId) : null,
        contactName:       namaCustomer.trim(),
        diskonTotal:       diskonTotal,
        pajak:             pajak,
        ongkir:            ongkir,
        totalHarga:        grandTotal,
        metodePembayaran,
        bankPilihan:       bankPilihan ?? null,
        items: savedItems.map(it => ({
          nama:           it.nama,
          qty:            Number(it.qty ?? 1),
          harga:          Number(it.harga ?? 0),
          subtotal:       Number(it.subtotal ?? 0),
          diskon:         Number(it.diskonItem ?? it.diskon ?? 0),
          kledoProductId: it.kledoProductId ?? null,
        })),
      });
      console.log('[Invoice Kledo result]', JSON.stringify(kledoResult));

      kledoOk         = kledoResult.ok;
      kledoInvoiceId  = kledoResult.kledoInvoiceId;
      kledoRef        = kledoResult.kledoRef;
      kledoPaid       = kledoResult.kledoPaid ?? false;
      kledoPaidError  = kledoResult.kledoPaidError;
      kledoError      = kledoResult.error;

      if (kledoOk && kledoInvoiceId) {
        await db.query(
          `UPDATE local_orders SET kledo_invoice_id=$1, kledo_synced=true, updated_at=NOW() WHERE id=$2`,
          [String(kledoInvoiceId), order.id],
        );
      }
    } catch (e: any) {
      kledoError = e.message;
    }

    /* ── 3. Kirim WA (server-side — baca token dari DB/env, bukan localStorage) ── */
    let waResult: any = { skipped: true };
    try {
      waResult = await sendAllOrderNotifications({
        soNumber:         invNo,
        namaCustomer:     namaCustomer.trim(),
        noHp:             noHp ?? null,
        salesName:        salesName ?? null,
        items:            savedItems.map((it: any) => ({
          nama: it.nama,
          qty:  Number(it.qty ?? 1),
          harga: Number(it.harga ?? 0),
        })),
        totalHarga:       Number(grandTotal),
        metodePembayaran,
        bankPilihan:      bankPilihan ?? null,
        status:           'pending',
      });
      console.log('[Invoice WA]', JSON.stringify(waResult));
    } catch (e: any) {
      console.error('[Invoice WA error]', e.message);
      waResult = { error: e.message };
    }

    return NextResponse.json({
      data: {
        id:           order.id,
        invNumber:    invNo,
        namaCustomer: namaCustomer.trim(),
        grandTotal,
        tanggal:      tanggalFinal,
      },
      kledo: {
        ok:           kledoOk,
        invoiceId:    kledoInvoiceId,
        ref:          kledoRef,
        paid:         kledoPaid,
        paidError:    kledoPaidError,
        error:        kledoError,
      },
      wa: waResult,
      error: null,
    });
  } catch (e: any) {
    console.error('[POST /api/sales/invoices]', e);
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}
