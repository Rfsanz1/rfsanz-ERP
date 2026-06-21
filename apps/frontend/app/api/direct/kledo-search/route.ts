import { NextRequest, NextResponse } from 'next/server';

const BACKEND_RAW = process.env.BACKEND_URL || '';
const BACKEND = BACKEND_RAW && !BACKEND_RAW.startsWith('http')
  ? `https://${BACKEND_RAW}` : BACKEND_RAW;

let cachedKledoToken: string | null = null;
let cachedKledoBase = 'https://api.kledo.com/api/v1';

const contactsCache: { data: any[]; ts: number } = { data: [], ts: 0 };
const productsCache: { data: any[]; ts: number } = { data: [], ts: 0 };
const CACHE_TTL = 30 * 60 * 1000; // 30 menit
const PER_PAGE = 100;
const CONCURRENCY = 8; // maks 8 halaman paralel sekaligus

async function getKledoToken(): Promise<string | null> {
  if (cachedKledoToken) return cachedKledoToken;

  if (process.env.KLEDO_TOKEN) {
    cachedKledoToken = process.env.KLEDO_TOKEN;
    return cachedKledoToken;
  }

  try {
    const r = await fetch(`${BACKEND}/api/settings`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    });
    if (r.ok) {
      const d = await r.json();
      const fromSettings = d?.data?.kledo_token ?? null;
      if (fromSettings) {
        cachedKledoToken = fromSettings;
        return cachedKledoToken;
      }
    }
  } catch {}

  return cachedKledoToken;
}

/** Ambil satu halaman dari Kledo API */
async function fetchPage(token: string, endpoint: string, page: number): Promise<{ items: any[]; lastPage: number }> {
  const url = `${cachedKledoBase}/${endpoint}?per_page=${PER_PAGE}&page=${page}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return { items: [], lastPage: 1 };
  const d = await r.json();
  const items: any[] = d?.data?.data ?? [];
  const lastPage: number = d?.data?.last_page ?? 1;
  return { items, lastPage };
}

/** Ambil semua halaman secara paralel dengan batching */
async function fetchAllPages(token: string, endpoint: string): Promise<any[]> {
  // Halaman 1 dulu untuk tahu total halaman
  const first = await fetchPage(token, endpoint, 1);
  const results: any[] = [...first.items];
  const totalPages = first.lastPage;

  if (totalPages <= 1) return results;

  // Ambil sisa halaman secara paralel, batch per CONCURRENCY
  const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2); // [2,3,4,...,totalPages]

  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    const batch = remaining.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(page => fetchPage(token, endpoint, page))
    );
    for (const res of settled) {
      if (res.status === 'fulfilled') results.push(...res.value.items);
    }
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
  const type = searchParams.get('type') ?? 'contacts';
  const q = (searchParams.get('q') ?? '').trim();

  const token = await getKledoToken();
  if (!token) {
    return NextResponse.json({ success: false, data: [], message: 'Token Kledo tidak ditemukan' });
  }

  const now = Date.now();

  if (type === 'products') {
    if (now - productsCache.ts > CACHE_TTL || productsCache.data.length === 0) {
      const raw = await fetchAllPages(token, 'finance/products');
      productsCache.data = raw.map((p: any) => {
        const hargaJual  = Number(p.price          ?? p.sell_price      ?? 0);
        const hargaBeli  = Number(p.base_price      ?? p.buy_price       ?? p.purchase_price ?? 0);
        const hpp        = Number(p.avg_base_price  ?? p.hpp             ?? p.cost_price     ?? p.cogs ?? 0);
        const hargaTertinggi = Math.max(hargaJual, hargaBeli, hpp);
        return {
          id: `kledo-${p.id}`,
          kledoId: p.id,
          name: p.name ?? '',
          sku: p.code ?? '',
          price: hargaTertinggi,
          hargaJual,
          hargaBeli,
          hpp,
          unit: p.unit ? (typeof p.unit === 'string' ? p.unit : (p.unit?.name ?? '')) : '',
        };
      });
      productsCache.ts = now;
    }

    const filtered = q
      ? productsCache.data.filter(p => textMatch(p.name, q) || textMatch(p.sku, q))
      : productsCache.data;

    return NextResponse.json({ success: true, data: filtered, total: productsCache.data.length });
  }

  // contacts
  if (now - contactsCache.ts > CACHE_TTL || contactsCache.data.length === 0) {
    const raw = await fetchAllPages(token, 'finance/contacts');
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
