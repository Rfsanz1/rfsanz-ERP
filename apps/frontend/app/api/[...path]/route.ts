import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'backend.config.json');

async function getBackendUrl(): Promise<string> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const cfg = JSON.parse(raw);
    if (cfg?.backendUrl) return cfg.backendUrl.replace(/\/$/, '');
  } catch {}

  const rawEnv = process.env.BACKEND_URL || '';
  if (!rawEnv) return '';
  if (rawEnv.startsWith('http://') || rawEnv.startsWith('https://')) {
    return rawEnv.replace(/\/$/, '');
  }
  return `https://${rawEnv}`.replace(/\/$/, '');
}

/* ── Server-side token cache ─────────────────────────────────────────────────
   Jika client tidak mengirim Authorization header yang valid, proxy otomatis
   mengambil JWT dari backend menggunakan ADMIN_EMAIL/ADMIN_PASSWORD env var.
   Token di-cache di memory process Node.js (valid sampai 60 detik sebelum exp).
   ─────────────────────────────────────────────────────────────────────────── */
let _cachedToken = '';
let _cachedTokenExp = 0;

function decodeExp(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

async function getServerToken(backend: string): Promise<string> {
  if (_cachedToken && Date.now() < _cachedTokenExp - 60_000) {
    return _cachedToken;
  }
  try {
    const r = await fetch(`${backend}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@rfsanz.com',
        password: process.env.ADMIN_PASSWORD || 'root',
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (r.ok) {
      const data = await r.json();
      const token: string = data.token ?? data.access_token ?? data.accessToken ?? '';
      if (token) {
        _cachedToken = token;
        _cachedTokenExp = decodeExp(token) || Date.now() + 23 * 3600 * 1000;
        return token;
      }
    }
  } catch {
    /* backend tidak terjangkau — lanjut tanpa token */
  }
  return '';
}

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await context.params;
  const backend = await getBackendUrl();

  if (!backend) {
    return NextResponse.json(
      { statusCode: 503, message: 'Backend belum dikonfigurasi. Buka Pengaturan → Koneksi Server.' },
      { status: 503 },
    );
  }

  const url = `${backend}/api/${segments.join('/')}${req.nextUrl.search}`;

  /* Gunakan token dari client jika ada, fallback ke server-side token */
  const clientAuth = req.headers.get('authorization') || '';
  const effectiveAuth = clientAuth || `Bearer ${await getServerToken(backend)}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
    ...(effectiveAuth ? { authorization: effectiveAuth } : {}),
  };

  let body: string | undefined;
  if (!['GET', 'HEAD'].includes(req.method)) {
    body = await req.text();
  }

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body: body || undefined,
      cache: 'no-store',
    });

    /* Jika 401/403 dan kita pakai server token, hapus cache dan coba sekali lagi */
    if ((res.status === 401 || res.status === 403) && !clientAuth) {
      _cachedToken = '';
      _cachedTokenExp = 0;
      const freshToken = await getServerToken(backend);
      if (freshToken) {
        const retryRes = await fetch(url, {
          method: req.method,
          headers: { ...headers, authorization: `Bearer ${freshToken}` },
          body: body || undefined,
          cache: 'no-store',
        });
        const retryData = await retryRes.text();
        return new NextResponse(retryData, {
          status: retryRes.status,
          headers: { 'Content-Type': retryRes.headers.get('Content-Type') ?? 'application/json' },
        });
      }
    }

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
    });
  } catch (err) {
    console.error('[proxy] failed to reach backend:', url, err);
    return NextResponse.json(
      { statusCode: 503, message: `Tidak dapat terhubung ke backend: ${backend}` },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
