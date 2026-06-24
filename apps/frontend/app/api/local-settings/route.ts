import { NextRequest, NextResponse } from 'next/server';
import { getLocalSetting, setLocalSetting, ensureTables } from '@/lib/localDb';

export async function GET(req: NextRequest) {
  try {
    await ensureTables();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (!key) return NextResponse.json({ error: 'key wajib diisi' }, { status: 400 });
    const value = await getLocalSetting(key);
    return NextResponse.json({ data: { key, value } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const body = await req.json();
    const { key, value } = body;
    if (!key) return NextResponse.json({ error: 'key wajib diisi' }, { status: 400 });
    if (value === undefined || value === null) {
      return NextResponse.json({ error: 'value wajib diisi' }, { status: 400 });
    }
    await setLocalSetting(key, String(value));
    return NextResponse.json({ data: { key, saved: true } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
