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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
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
