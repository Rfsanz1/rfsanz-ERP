import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const results: Record<string, any> = {};

  // 1. Env var
  results.env_KLEDO_TOKEN = process.env.KLEDO_TOKEN
    ? `✅ ada (${process.env.KLEDO_TOKEN.slice(0, 8)}...)`
    : '❌ tidak ada';
  results.env_DATABASE_URL = process.env.DATABASE_URL ? '✅ ada' : '❌ tidak ada';
  results.env_BACKEND_URL  = process.env.BACKEND_URL ?? '(tidak di-set, default 127.0.0.1:6000)';

  // 2a. local_settings table
  try {
    const { getDb, ensureTables } = await import('@/lib/localDb');
    await ensureTables();
    const db = getDb();
    const r = await db.query(`SELECT value FROM local_settings WHERE key='kledo_token' LIMIT 1`);
    results.local_settings_kledo_token = r.rows[0]?.value
      ? `✅ ada (${String(r.rows[0].value).slice(0, 8)}...)`
      : '❌ tidak ada';
  } catch (e: any) {
    results.local_settings_kledo_token = `❌ error: ${e.message}`;
  }

  // 2b. AppSetting table (Prisma/NestJS)
  try {
    const { getDb } = await import('@/lib/localDb');
    const db = getDb();
    const r = await db.query(`SELECT value FROM "AppSetting" WHERE key='kledo_token' LIMIT 1`);
    results.AppSetting_kledo_token = r.rows[0]?.value
      ? `✅ ada (${String(r.rows[0].value).slice(0, 8)}...)`
      : '❌ tidak ada';
  } catch (e: any) {
    results.AppSetting_kledo_token = `❌ error: ${e.message}`;
  }

  // 3. Backend API test (port 3000)
  const authHeader = req.headers.get('authorization') ?? '';
  for (const base of ['http://127.0.0.1:3000', 'http://localhost:3000']) {
    try {
      const r = await fetch(`${base}/api/settings`, {
        headers: { Authorization: authHeader },
        signal: AbortSignal.timeout(3000),
      });
      const d = await r.json();
      results[`backend_${base}`] = r.ok
        ? `✅ ok — kledo_token: ${d?.data?.kledo_token ? `ada (${String(d.data.kledo_token).slice(0, 8)}...)` : '❌ tidak ada'}`
        : `❌ status ${r.status}: ${d?.message ?? 'error'}`;
    } catch (e: any) {
      results[`backend_${base}`] = `❌ error: ${e.message}`;
    }
  }

  // 4. Tes kirim ke Kledo (test mode — cuma cek token valid, tidak buat invoice)
  try {
    const { getKledoCfg } = await import('@/lib/kledoSync');
    const cfg = await getKledoCfg(authHeader);
    if (cfg) {
      results.kledo_cfg_found = `✅ token ditemukan (${cfg.token.slice(0, 8)}...)`;
      // Test token validity
      const r = await fetch(`${cfg.baseUrl}/finance/contacts?per_page=1`, {
        headers: { Authorization: `Bearer ${cfg.token}` },
        signal: AbortSignal.timeout(5000),
      });
      const d = await r.json();
      results.kledo_token_valid = r.ok
        ? `✅ valid — kontak: ${d?.data?.total ?? '?'}`
        : `❌ invalid — ${r.status}: ${d?.message ?? JSON.stringify(d)}`;
    } else {
      results.kledo_cfg_found = '❌ token tidak ditemukan di semua sumber';
    }
  } catch (e: any) {
    results.kledo_cfg_found = `❌ error: ${e.message}`;
  }

  return NextResponse.json(results, { status: 200 });
}
