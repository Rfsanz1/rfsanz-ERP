import { NextRequest, NextResponse } from 'next/server';

const BACKEND_RAW = process.env.BACKEND_URL || '';
const BACKEND = BACKEND_RAW && !BACKEND_RAW.startsWith('http')
  ? `https://${BACKEND_RAW}` : BACKEND_RAW;

let cachedKledoToken: string | null = null;
let cachedKledoBase = 'https://api.kledo.com/api/v1';

const contactsCache: { data: any[]; ts: number } = { data: [], ts: 0 };
const productsCache: { data: any[]; ts: number } = { data: [], ts: 0 };
const CACHE_TTL = 10 * 60 * 1000; // 10 menit

async function getKledoToken(): Promise<string | null> {
  if (cachedKledoToken) return cachedKledoToken;
  try {
    const r = await fetch(`${BACKEND}/api/settings`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    });
    if (r.ok) {
      const d = await r.json();
      cachedKledoToken = d?.data?.kledo_token ?? null;
    }
  } catch {}
  return cachedKledoToken;
}

async function fetchKledoPages(
  token: string,
  endpoint: string,
  maxPages = 10,
  perPage = 500,
): Promise<any[]> {
  const results: any[] = [];
  const headers = { Authorization: `Bearer ${token}` };

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `${cachedKledoBase}/${endpoint}?per_page=${perPage}&page=${page}`;
      const r = await fetch(url, { headers });
      if (!r.ok) break;
      const d = await r.json();
      const items: any[] = d?.data?.data ?? [];
      results.push(...items);
      const totalPages: number = d?.data?.last_page ?? 1;
      if (page >= totalPages) break;
      if (items.length === 0) break;
    } catch { break; }
  }
  return results;
}

function textMatch(text: string, query: string): boolean {
  const terms = query.toLowerCase().trim().split(/\s+/);
  const t = text.toLowerCase();
  return terms.every(term => t.includes(term));
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type') ?? 'contacts'; // 'contacts' | 'products'
  const q = (searchParams.get('q') ?? '').trim();

  const token = await getKledoToken();
  if (!token) {
    return NextResponse.json({ success: false, data: [], message: 'Token Kledo tidak ditemukan' });
  }

  const now = Date.now();

  if (type === 'products') {
    if (now - productsCache.ts > CACHE_TTL || productsCache.data.length === 0) {
      const raw = await fetchKledoPages(token, 'finance/products', 12, 500);
      productsCache.data = raw.map((p: any) => ({
        id: `kledo-${p.id}`,
        kledoId: p.id,
        name: p.name ?? '',
        sku: p.code ?? '',
        price: Number(p.price ?? 0),
        unit: p.unit ? (typeof p.unit === 'string' ? p.unit : (p.unit?.name ?? '')) : '',
      }));
      productsCache.ts = now;
    }

    const filtered = q
      ? productsCache.data.filter(p => textMatch(p.name, q) || textMatch(p.sku, q))
      : productsCache.data;

    return NextResponse.json({ success: true, data: filtered, total: productsCache.data.length });
  }

  // contacts
  if (now - contactsCache.ts > CACHE_TTL || contactsCache.data.length === 0) {
    const raw = await fetchKledoPages(token, 'finance/contacts', 20, 500);
    contactsCache.data = raw.map((c: any) => ({
      id: `kledo-${c.id}`,
      kledoId: c.id,
      name: c.name ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
    }));
    contactsCache.ts = now;
  }

  const filtered = q
    ? contactsCache.data.filter(c =>
        textMatch(c.name, q) ||
        (c.phone && c.phone.includes(q)),
      )
    : contactsCache.data;

  return NextResponse.json({ success: true, data: filtered, total: contactsCache.data.length });
}

export async function DELETE() {
  contactsCache.data = []; contactsCache.ts = 0;
  productsCache.data = []; productsCache.ts = 0;
  cachedKledoToken = null;
  return NextResponse.json({ success: true, message: 'Cache cleared' });
}
