import { NextRequest, NextResponse } from 'next/server';

/* ── Server-side token cache ─────────────────────────────────────────────────
   Jika client tidak mengirim Authorization header yang valid, proxy otomatis
   mengambil JWT dari backend menggunakan ADMIN_EMAIL/ADMIN_PASSWORD env var.
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
    /* backend tidak terjangkau */
  }
  return '';
}

/**
 * Proxy request ke backend NestJS.
 * Dipakai oleh route-route lokal ketika DATABASE_URL tidak tersedia
 * (mis. deployment CasaOS tanpa local DB di container frontend).
 *
 * Otomatis menambahkan server-side JWT jika client tidak mengirim Authorization.
 */
export async function proxyToBackend(
  req: NextRequest,
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<NextResponse> {
  const BACKEND = process.env.BACKEND_URL ?? '';
  if (!BACKEND) {
    return NextResponse.json(
      { data: null, error: 'BACKEND_URL tidak dikonfigurasi' },
      { status: 503 },
    );
  }

  const method = options?.method ?? req.method ?? 'GET';
  const clientAuth = req.headers.get('authorization') ?? '';
  const effectiveAuth = clientAuth || `Bearer ${await getServerToken(BACKEND)}`;
  const url = `${BACKEND}${path}${req.nextUrl.search}`;

  let bodyText: string | undefined;
  if (options?.body !== undefined) {
    bodyText = JSON.stringify(options.body);
  } else if (method !== 'GET' && method !== 'HEAD') {
    try { bodyText = JSON.stringify(await req.json()); } catch { /* body sudah dikonsumsi atau kosong */ }
  }

  const makeRequest = (auth: string) =>
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      ...(bodyText !== undefined ? { body: bodyText } : {}),
      signal: AbortSignal.timeout(25_000),
    });

  try {
    let r = await makeRequest(effectiveAuth);

    /* Jika 401/403 dan server token dipakai, invalidate cache dan coba ulang */
    if ((r.status === 401 || r.status === 403) && !clientAuth) {
      _cachedToken = '';
      _cachedTokenExp = 0;
      const freshToken = await getServerToken(BACKEND);
      if (freshToken) {
        r = await makeRequest(`Bearer ${freshToken}`);
      }
    }

    const data = await r.json().catch(() => ({ data: null, error: 'Respons tidak valid dari backend' }));
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    const msg = e?.name === 'TimeoutError'
      ? 'Backend timeout (25 detik)'
      : (e.message ?? 'Gagal menghubungi backend');
    return NextResponse.json({ data: null, error: msg }, { status: 502 });
  }
}
