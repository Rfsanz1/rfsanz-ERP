import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    fonnte_token: process.env.FONNTE_TOKEN ?? null,
    kledo_token: process.env.KLEDO_TOKEN ? '***set***' : null,
  });
}
