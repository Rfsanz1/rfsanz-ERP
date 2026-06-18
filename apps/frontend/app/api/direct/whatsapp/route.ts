import { NextRequest, NextResponse } from 'next/server';

function formatPhone(raw: string): string {
  if (raw.includes('@')) return raw;
  let phone = raw.replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
  else if (!phone.startsWith('62')) phone = '62' + phone;
  return phone;
}

export async function POST(req: NextRequest) {
  try {
    const { token, target, message } = await req.json();

    if (!token) {
      return NextResponse.json(
        { status: false, reason: 'Token Fonnte belum dikonfigurasi. Atur di Settings → WA Gateway.' },
        { status: 400 },
      );
    }
    if (!target) {
      return NextResponse.json({ status: false, reason: 'Nomor WA / Group ID tujuan tidak boleh kosong.' }, { status: 400 });
    }
    if (!message?.trim()) {
      return NextResponse.json({ status: false, reason: 'Pesan tidak boleh kosong.' }, { status: 400 });
    }

    const formattedTarget = formatPhone(String(target));

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: formattedTarget, message, countryCode: '62' }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err: any) {
    return NextResponse.json(
      { status: false, reason: err?.message ?? 'Gagal menghubungi Fonnte API' },
      { status: 500 },
    );
  }
}
