import { NextRequest, NextResponse } from 'next/server';
import { getKledoCfg } from '@/lib/kledoSync';
import { ensureTables } from '@/lib/localDb';

export async function GET(req: NextRequest) {
  const steps: { step: string; ok: boolean; detail: string }[] = [];

  // 1. Pastikan tabel ada
  try {
    await ensureTables();
    steps.push({ step: 'Database lokal', ok: true, detail: 'Tabel local_settings tersedia' });
  } catch (e: any) {
    steps.push({ step: 'Database lokal', ok: false, detail: e.message });
  }

  // 2. Cek token tersedia
  const authHeader = req.headers.get('authorization') ?? '';
  const cfg = await getKledoCfg(authHeader);
  if (!cfg) {
    steps.push({ step: 'Token Kledo', ok: false, detail: 'Token tidak ditemukan — set via Pengaturan Akuntansi atau env KLEDO_TOKEN' });
    return NextResponse.json({ ok: false, steps });
  }
  const maskedToken = cfg.token.slice(0, 15) + '…' + cfg.token.slice(-6);
  steps.push({ step: 'Token Kledo', ok: true, detail: `Token ditemukan: ${maskedToken}` });

  // 3. Test panggil Kledo API — ambil 1 produk
  try {
    const r = await fetch(`${cfg.baseUrl}/finance/products?per_page=1`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    const body = await r.json().catch(() => ({}));
    if (r.ok) {
      const count = body?.data?.total ?? '?';
      steps.push({ step: 'Koneksi Kledo API', ok: true, detail: `Berhasil — total produk Kledo: ${count}` });
    } else {
      steps.push({ step: 'Koneksi Kledo API', ok: false, detail: `HTTP ${r.status}: ${body?.message ?? r.statusText}` });
      return NextResponse.json({ ok: false, steps });
    }
  } catch (e: any) {
    steps.push({ step: 'Koneksi Kledo API', ok: false, detail: `Network error: ${e.message}` });
    return NextResponse.json({ ok: false, steps });
  }

  // 4. Test ambil akun keuangan
  try {
    const r = await fetch(`${cfg.baseUrl}/finance/accounts?per_page=5`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    const body = await r.json().catch(() => ({}));
    if (r.ok) {
      steps.push({ step: 'Finance Accounts', ok: true, detail: `Akun keuangan dapat dibaca` });
    } else {
      steps.push({ step: 'Finance Accounts', ok: false, detail: `HTTP ${r.status}: ${body?.message ?? r.statusText}` });
    }
  } catch (e: any) {
    steps.push({ step: 'Finance Accounts', ok: false, detail: e.message });
  }

  return NextResponse.json({ ok: true, steps });
}
