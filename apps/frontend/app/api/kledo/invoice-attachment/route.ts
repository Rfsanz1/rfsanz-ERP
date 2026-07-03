/**
 * POST /api/kledo/invoice-attachment
 * Upload bukti transfer sebagai attachment pada invoice Kledo.
 *
 * Body: FormData
 *   invoiceId : string | number  — ID invoice di Kledo
 *   file      : File             — gambar bukti transfer (jpg/png/webp, maks 10 MB)
 *
 * Auth: wajib Bearer JWT yang ditandatangani dengan JWT_SECRET (sama dengan backend).
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getKledoCfg } from '@/lib/kledoSync';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/* ── Verifikasi JWT menggunakan JWT_SECRET (HS256, sama dengan backend) ── */
function verifyJwt(token: string): boolean {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail closed: jika JWT_SECRET tidak dikonfigurasi, tolak semua request
    console.error('[kledo-attachment] JWT_SECRET tidak dikonfigurasi — tolak request');
    return false;
  }
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, signature] = parts;

    // Verifikasi signature HMAC-SHA256
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');
    if (expected !== signature) return false;

    // Verifikasi expiry
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.exp === 'number' && data.exp * 1000 < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    /* ── Auth: verifikasi JWT signature ── */
    const authHeader = req.headers.get('authorization') ?? '';
    const rawToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!rawToken || !verifyJwt(rawToken)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const cfg = await getKledoCfg(authHeader);
    if (!cfg) {
      return NextResponse.json(
        { ok: false, error: 'Token Kledo tidak ditemukan — atur di Settings → Integrasi → Kledo' },
        { status: 200 },
      );
    }

    const formData = await req.formData();
    const invoiceId = formData.get('invoiceId');
    const file = formData.get('file') as File | null;

    if (!invoiceId || isNaN(Number(invoiceId)) || Number(invoiceId) <= 0) {
      return NextResponse.json({ ok: false, error: 'invoiceId tidak valid' }, { status: 200 });
    }
    if (!file) {
      return NextResponse.json({ ok: false, error: 'file wajib diisi' }, { status: 200 });
    }

    /* ── Validasi tipe file ── */
    const mime = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { ok: false, error: `Tipe file tidak didukung: ${mime}. Gunakan JPG, PNG, atau WEBP.` },
        { status: 200 },
      );
    }

    /* ── Validasi ukuran file ── */
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: `Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimum 10 MB.` },
        { status: 200 },
      );
    }

    /* ── Forward ke Kledo ── */
    const kledoForm = new FormData();
    kledoForm.append('files[]', file, file.name || 'bukti-transfer.jpg');

    const url = `${cfg.baseUrl}/finance/invoices/${invoiceId}/attachments`;
    console.log(`[kledo-attachment] POST ${url} invoiceId=${invoiceId} mime=${mime} size=${file.size}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}` },
      body: kledoForm,
    });

    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { /* non-json response */ }

    console.log(`[kledo-attachment] status=${res.status} ok=${res.ok} body=${text.slice(0, 200)}`);

    if (res.ok) {
      return NextResponse.json({ ok: true, data });
    }

    const errMsg = data?.message ?? data?.error ?? `Gagal upload attachment (HTTP ${res.status})`;
    return NextResponse.json({ ok: false, error: errMsg }, { status: 200 });

  } catch (e: any) {
    console.error('[kledo-attachment] exception:', e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
