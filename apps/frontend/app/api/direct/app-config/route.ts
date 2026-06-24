import { NextResponse } from 'next/server';
import { getLocalSetting, ensureTables } from '@/lib/localDb';

export async function GET() {
  let fonnteToken = process.env.FONNTE_TOKEN ?? null;
  let fonnteGroupInvoice = process.env.FONNTE_GROUP_INVOICE ?? null;
  let fonnteGroupPayment = process.env.FONNTE_GROUP_PAYMENT ?? null;

  try {
    await ensureTables();
    if (!fonnteToken) {
      const v = await getLocalSetting('fonnte_token');
      if (v) fonnteToken = v;
    }
    if (!fonnteGroupInvoice) {
      const v = await getLocalSetting('fonnte_group_invoice');
      if (v) fonnteGroupInvoice = v;
    }
    if (!fonnteGroupPayment) {
      const v = await getLocalSetting('fonnte_group_payment');
      if (v) fonnteGroupPayment = v;
    }
  } catch {}

  return NextResponse.json({
    fonnte_token: fonnteToken,
    fonnte_group_invoice: fonnteGroupInvoice,
    fonnte_group_payment: fonnteGroupPayment,
    kledo_token: process.env.KLEDO_TOKEN ? '***set***' : null,
  });
}
