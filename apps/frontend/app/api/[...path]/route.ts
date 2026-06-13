import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL || '';

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (await params).path.join('/');
  const url = `${BACKEND}/api/${path}${req.nextUrl.search}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const auth = req.headers.get('authorization');
  if (auth) headers['authorization'] = auth;

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

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
    });
  } catch (err) {
    console.error('[proxy] failed to reach backend:', url, err);
    return NextResponse.json(
      { statusCode: 503, message: 'Backend tidak tersedia. Set BACKEND_URL ke URL backend yang sudah di-deploy.' },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
