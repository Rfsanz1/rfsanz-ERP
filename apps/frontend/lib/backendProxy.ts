import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy request ke backend NestJS.
 * Dipakai oleh route-route lokal ketika DATABASE_URL tidak tersedia
 * (mis. deployment CasaOS tanpa local DB di container frontend).
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
  const authHeader = req.headers.get('authorization') ?? '';
  const url = `${BACKEND}${path}${req.nextUrl.search}`;

  let bodyText: string | undefined;
  if (options?.body !== undefined) {
    bodyText = JSON.stringify(options.body);
  } else if (method !== 'GET' && method !== 'HEAD') {
    try { bodyText = JSON.stringify(await req.json()); } catch { /* body sudah dikonsumsi atau kosong */ }
  }

  try {
    const r = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      ...(bodyText !== undefined ? { body: bodyText } : {}),
      signal: AbortSignal.timeout(25_000),
    });
    const data = await r.json().catch(() => ({ data: null, error: 'Respons tidak valid dari backend' }));
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    const msg = e?.name === 'TimeoutError'
      ? 'Backend timeout (25 detik)'
      : (e.message ?? 'Gagal menghubungi backend');
    return NextResponse.json({ data: null, error: msg }, { status: 502 });
  }
}
