/**
 * GET  /api/kledo/payment-config  — baca mapping key→accountId
 * PUT  /api/kledo/payment-config  — simpan mapping key→accountId
 *
 * Di production (BACKEND_URL tersedia): proxy ke backend.
 * Di local dev (DATABASE_URL tersedia): pakai local_settings.
 */
import { NextRequest, NextResponse } from 'next/server';

const PAYMENT_KEYS = [
  'kas', 'elektronik', 'bahan_bangunan',
  'bca', 'bri', 'mandiri', 'bni',
  'bca_edc', 'bri_edc', 'bni_edc',
  'transfer', 'edc',
];

function settingKey(bankKey: string) {
  return `kledo_payment_${bankKey.toLowerCase()}_id`;
}

/* ── Local-DB helpers (hanya dipakai saat DATABASE_URL ada) ── */
async function readLocalConfig(): Promise<Record<string, number | null>> {
  const { getLocalSetting, ensureTables } = await import('@/lib/localDb');
  await ensureTables();
  const out: Record<string, number | null> = {};
  for (const k of PAYMENT_KEYS) {
    const v = await getLocalSetting(settingKey(k));
    out[k] = v && v !== '0' ? Number(v) : null;
  }
  return out;
}

async function writeLocalConfig(config: Record<string, number | null>): Promise<void> {
  const { setLocalSetting, ensureTables } = await import('@/lib/localDb');
  await ensureTables();
  for (const k of PAYMENT_KEYS) {
    if (k in config) {
      await setLocalSetting(settingKey(k), config[k] ? String(config[k]) : '');
    }
  }
}

/* ── Backend proxy helpers ── */
function resolveBackend() {
  const raw = process.env.BACKEND_URL ?? '';
  if (!raw) return 'http://localhost:3000';
  return raw.startsWith('http') ? raw : `https://${raw}`;
}

async function backendGet(path: string, authHeader: string) {
  const r = await fetch(`${resolveBackend()}${path}`, {
    headers: { Authorization: authHeader || '' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) return null;
  return r.json();
}

async function backendPut(path: string, body: any, authHeader: string): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch(`${resolveBackend()}${path}`, {
    method: 'PUT',
    headers: {
      Authorization: authHeader || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (r.ok) return { ok: true };
  const txt = await r.text().catch(() => '');
  return { ok: false, error: `Backend HTTP ${r.status}: ${txt.slice(0, 200)}` };
}

/* ── Routes ── */
export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') ?? '';

    // Coba backend dulu
    if (process.env.BACKEND_URL) {
      const data = await backendGet('/api/kledo/payment-config', auth).catch(() => null);
      if (data) return NextResponse.json(data);
    }

    // Fallback: local DB
    if (process.env.DATABASE_URL) {
      const data = await readLocalConfig();
      return NextResponse.json(data);
    }

    return NextResponse.json({});
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth  = req.headers.get('authorization') ?? '';
    const body  = await req.json() as Record<string, number | null>;

    // Coba backend dulu
    if (process.env.BACKEND_URL) {
      const result = await backendPut('/api/kledo/payment-config', body, auth).catch((e) => ({ ok: false, error: e.message }));
      if (result.ok) return NextResponse.json({ success: true });
      // Jika backend ada tapi gagal, jangan silently fallback — kembalikan error
      return NextResponse.json({ success: false, error: result.error ?? 'Gagal simpan ke backend' }, { status: 500 });
    }

    // Fallback: local DB (hanya jika tidak ada backend)
    if (process.env.DATABASE_URL) {
      await writeLocalConfig(body);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Tidak ada storage yang tersedia' }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
