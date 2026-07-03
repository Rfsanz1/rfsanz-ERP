/**
 * POST /api/wa/send-bukti
 * Kirim foto bukti transfer ke grup WA payment via Fonnte (multipart/file).
 *
 * Body: FormData
 *   file        : File    — gambar bukti transfer
 *   soNumber    : string  — nomor SO/invoice
 *   namaCustomer: string  — nama customer
 *   noHp        : string? — nomor HP customer (opsional, untuk kirim ke konsumen juga)
 *   totalHarga  : string  — total harga (angka)
 *   bankPilihan : string? — nama bank
 *   salesName   : string? — nama sales
 *
 * Auth: wajib Bearer JWT ditandatangani JWT_SECRET (fail-closed jika JWT_SECRET kosong).
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getLocalSetting } from '@/lib/localDb';

/* ── JWT verification (fail-closed) ── */
function verifyJwt(token: string): boolean {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[wa-send-bukti] JWT_SECRET tidak dikonfigurasi — tolak request');
    return false;
  }
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, signature] = parts;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');
    if (expected !== signature) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.exp === 'number' && data.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

/* ── Ambil token & target Fonnte ── */
async function getFonnteToken(): Promise<string> {
  if (process.env.FONNTE_TOKEN) return process.env.FONNTE_TOKEN;
  try {
    const v = await getLocalSetting('fonnte_token');
    if (v) return v;
  } catch {}
  return '';
}

async function getFonnteGroupPayment(): Promise<string> {
  if (process.env.FONNTE_GROUP_PAYMENT) return process.env.FONNTE_GROUP_PAYMENT;
  try {
    const v = await getLocalSetting('fonnte_group_payment');
    if (v) return v;
  } catch {}
  return '';
}

function formatPhone(raw: string): string {
  if (!raw) return '';
  if (raw.includes('@')) return raw;
  let phone = raw.replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
  else if (!phone.startsWith('62')) phone = '62' + phone;
  return phone;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

/* ── Kirim gambar ke satu target via Fonnte multipart ── */
async function sendFonnteImage(
  token: string,
  target: string,
  caption: string,
  file: File,
): Promise<{ ok: boolean; reason?: string }> {
  if (!target) return { ok: false, reason: 'Target WA kosong' };
  const fd = new FormData();
  fd.append('target', target);
  fd.append('message', caption);
  fd.append('countryCode', '62');
  fd.append('file', file, file.name || 'bukti-transfer.jpg');
  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.status !== false) return { ok: true };
    return { ok: false, reason: data?.reason ?? data?.message ?? `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, reason: e.message };
  }
}

export async function POST(req: NextRequest) {
  try {
    /* ── Auth ── */
    const authHeader = req.headers.get('authorization') ?? '';
    const rawToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!rawToken || !verifyJwt(rawToken)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const fonnteToken = await getFonnteToken();
    if (!fonnteToken) {
      return NextResponse.json(
        { ok: false, error: 'FONNTE_TOKEN tidak dikonfigurasi — atur di Settings → WA Gateway' },
        { status: 200 },
      );
    }

    /* ── Parse FormData ── */
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const soNumber = String(formData.get('soNumber') ?? '');
    const namaCustomer = String(formData.get('namaCustomer') ?? '');
    const noHp = String(formData.get('noHp') ?? '');
    const totalHarga = Number(formData.get('totalHarga') ?? 0);
    const bankPilihan = String(formData.get('bankPilihan') ?? '');
    const salesName = String(formData.get('salesName') ?? '');

    if (!file) {
      return NextResponse.json({ ok: false, error: 'file wajib diisi' }, { status: 200 });
    }

    /* ── Buat caption ── */
    const now = new Date().toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const bankLabel = bankPilihan ? ` (${bankPilihan.toUpperCase()})` : '';
    const caption =
      `💸 *Bukti Transfer Masuk*\n\n` +
      `📋 Order       : *${soNumber}*\n` +
      `👤 Customer    : ${namaCustomer}\n` +
      (noHp ? `📞 Telepon     : ${noHp}\n` : '') +
      `💰 Total       : ${fmt(totalHarga)}\n` +
      `🏦 Pembayaran  : Transfer${bankLabel}\n` +
      (salesName ? `👨‍💼 Sales       : ${salesName}\n` : '') +
      `\n_Gentong Mas ERP • ${now}_`;

    /* ── Kirim ke grup payment ── */
    const grupPayment = await getFonnteGroupPayment();
    const targets: Array<{ label: string; target: string }> = [];
    if (grupPayment) targets.push({ label: 'grup_payment', target: grupPayment });

    /* Jika ada noHp konsumen, kirim juga ke konsumen */
    const konsumenPhone = noHp ? formatPhone(noHp) : '';
    if (konsumenPhone) targets.push({ label: 'konsumen', target: konsumenPhone });

    if (targets.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Tidak ada target WA (grup payment & nomor konsumen kosong)' },
        { status: 200 },
      );
    }

    /* Kirim paralel ke semua target */
    const results = await Promise.all(
      targets.map(({ label, target }) =>
        sendFonnteImage(fonnteToken, target, caption, file).then(r => ({ label, ...r })),
      ),
    );

    console.log('[wa-send-bukti] results:', results);

    const anyOk = results.some(r => r.ok);
    return NextResponse.json({ ok: anyOk, results });

  } catch (e: any) {
    console.error('[wa-send-bukti] exception:', e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
