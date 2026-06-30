import { NextRequest, NextResponse } from 'next/server';
import { getLocalSetting, setLocalSetting, ensureTables } from '@/lib/localDb';

function requireAuth(req: NextRequest): NextResponse | null {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ') || auth.length < 20) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

const FONNTE_KEYS = [
  'fonnte_token',
  'fonnte_group_invoice',
  'fonnte_group_payment',
  'fonnte_template_order',
  'fonnte_template_payment',
  'fonnte_template_konsumen',
] as const;

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  // Env vars take priority (same pattern as Kledo)
  const envToken = process.env.FONNTE_TOKEN ?? null;
  const envGroupInvoice = process.env.FONNTE_GROUP_INVOICE ?? null;
  const envGroupPayment = process.env.FONNTE_GROUP_PAYMENT ?? null;

  let source: 'env' | 'database' = envToken ? 'env' : 'database';

  const db: Record<string, string | null> = {
    fonnte_token: envToken,
    fonnte_group_invoice: envGroupInvoice,
    fonnte_group_payment: envGroupPayment,
    fonnte_template_order: null,
    fonnte_template_payment: null,
    fonnte_template_konsumen: null,
  };

  try {
    await ensureTables();
    for (const key of FONNTE_KEYS) {
      if (db[key] === null) {
        const v = await getLocalSetting(key);
        if (v) db[key] = v;
      }
    }
    if (!envToken && db['fonnte_token']) source = 'database';
  } catch {}

  const token = db['fonnte_token'];
  const tokenMasked = token
    ? token.slice(0, 4) + '•'.repeat(Math.max(0, token.length - 6)) + token.slice(-3)
    : '';

  return NextResponse.json({
    tokenSet: !!token,
    tokenMasked,
    source,
    groupInvoice: db['fonnte_group_invoice'] ?? '',
    groupPayment: db['fonnte_group_payment'] ?? '',
    templateOrder: db['fonnte_template_order'] ?? '',
    templatePayment: db['fonnte_template_payment'] ?? '',
    templateKonsumen: db['fonnte_template_konsumen'] ?? '',
  });
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'DATABASE_URL tidak dikonfigurasi — tidak bisa simpan ke database.' },
      { status: 503 },
    );
  }

  const body = await req.json();
  const {
    token,
    groupInvoice,
    groupPayment,
    templateOrder,
    templatePayment,
    templateKonsumen,
  }: Record<string, string> = body;

  if (!token?.trim()) {
    return NextResponse.json({ error: 'Token Fonnte wajib diisi.' }, { status: 400 });
  }

  try {
    await ensureTables();

    const entries: Array<[string, string]> = [
      ['fonnte_token', token.trim()],
      ['fonnte_group_invoice', (groupInvoice ?? '').trim()],
      ['fonnte_group_payment', (groupPayment ?? '').trim()],
      ['fonnte_template_order', templateOrder ?? ''],
      ['fonnte_template_payment', templatePayment ?? ''],
      ['fonnte_template_konsumen', templateKonsumen ?? ''],
    ];

    await Promise.all(entries.map(([k, v]) => setLocalSetting(k, v)));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
