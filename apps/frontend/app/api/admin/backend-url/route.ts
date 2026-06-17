import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'backend.config.json');

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

export async function GET() {
  const envUrl = process.env.BACKEND_URL || '';
  let configUrl = '';

  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const cfg = JSON.parse(raw);
    if (cfg?.backendUrl) configUrl = cfg.backendUrl;
  } catch {}

  const effective = configUrl || normalizeUrl(envUrl);

  return NextResponse.json({
    envUrl: normalizeUrl(envUrl),
    configUrl,
    effectiveUrl: effective,
    source: configUrl ? 'config' : 'env',
  });
}

export async function POST(req: NextRequest) {
  try {
    const { backendUrl } = await req.json();
    const normalized = normalizeUrl(backendUrl || '');

    await fs.writeFile(
      CONFIG_PATH,
      JSON.stringify({ backendUrl: normalized, updatedAt: new Date().toISOString() }, null, 2),
      'utf-8',
    );

    return NextResponse.json({ ok: true, backendUrl: normalized });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message ?? 'Gagal menyimpan konfigurasi' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await fs.unlink(CONFIG_PATH);
  } catch {}
  return NextResponse.json({ ok: true });
}
