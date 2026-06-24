import { NextRequest, NextResponse } from 'next/server';

const BACKEND_RAW = process.env.BACKEND_URL || '';
const BACKEND = BACKEND_RAW && !BACKEND_RAW.startsWith('http')
  ? `https://${BACKEND_RAW}` : BACKEND_RAW;

let cachedKledoToken: string | null = null;
const cachedKledoBase = 'https://api.kledo.com/api/v1';

const productsCache: { data: any[]; ts: number } = { data: [], ts: 0 };
let productsLoading = false;

const CACHE_TTL   = 30 * 60 * 1000;
const PER_PAGE    = 500;
const CONCURRENCY = 3;
const MAX_PAGES   = 20; // products: 10 000 max (fewer products than contacts)

async function getKledoToken(): Promise<string | null> {
  if (cachedKledoToken) return cachedKledoToken;

  if (process.env.KLEDO_TOKEN) {
    cachedKledoToken = process.env.KLEDO_TOKEN;
    return cachedKledoToken;
  }

  try {
    const r = await fetch(`${BACKEND}/api/settings`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
      signal: AbortSignal.timeout(3000),
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

async function fetchPage(
  token: string,
  endpoint: string,
  page: number,
  extraParams = '',
): Promise<{ items: any[]; lastPage: number; ok: boolean }> {
  try {
    const url = `${cachedKledoBase}/${endpoint}?per_page=${PER_PAGE}&page=${page}${extraParams}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return { items: [], lastPage: 1, ok: false };
    const d = await r.json();
    const items: any[]     = d?.data?.data ?? [];
    const lastPage: number = d?.data?.last_page ?? 1;
    return { items, lastPage, ok: true };
  } catch {
    return { items: [], lastPage: 1, ok: false };
  }
}

async function fetchAllPages(token: string, endpoint: string, maxPages = MAX_PAGES): Promise<any[]> {
  const first = await fetchPage(token, endpoint, 1);
  const results: any[] = [...first.items];
  if (!first.ok || first.lastPage <= 1) return results;

  const totalPages = Math.min(first.lastPage, maxPages);
  const remaining  = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    const batch   = remaining.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(page => fetchPage(token, endpoint, page)),
    );
    let anyOk = false;
    for (const res of settled) {
      if (res.status === 'fulfilled' && res.value.ok) {
        results.push(...res.value.items);
        anyOk = true;
      }
    }
    if (!anyOk) break;
  }

  return results;
}

/** Search contacts directly via Kledo's ?search= param — bypasses 10k cache limit */
async function searchContactsDirect(token: string, q: string): Promise<any[]> {
  const results: any[] = [];
  // Kledo supports ?search= for server-side filtering
  const first = await fetchPage(token, 'finance/contacts', 1, `&search=${encodeURIComponent(q)}`);
  results.push(...first.items);

  if (first.ok && first.lastPage > 1) {
    const cap = Math.min(first.lastPage, 5); // max 5 pages for search (2500 results)
    for (let p = 2; p <= cap; p++) {
      const page = await fetchPage(token, 'finance/contacts', p, `&search=${encodeURIComponent(q)}`);
      if (page.ok) results.push(...page.items);
    }
  }
  return results;
}

function textMatch(text: string, query: string): boolean {
  const terms = query.toLowerCase().trim().split(/\s+/);
  const t = text.toLowerCase();
  return terms.every(term => t.includes(term));
}

function mapProduct(p: any) {
  // Try every known Kledo field name for sell price
  const fromSells     = Number(p.sells?.[0]?.price ?? p.sells?.[0]?.unit_price ?? 0);
  const hargaJual     = Number(p.price ?? p.sell_price ?? p.sales_price ?? 0) || fromSells;
  const hargaBeli     = Number(p.base_price ?? p.buy_price ?? p.purchase_price ?? p.buying_price ?? 0);
  const hpp           = Number(p.avg_base_price ?? p.hpp ?? p.cost_price ?? p.cogs ?? 0);
  const hargaTertinggi = Math.max(hargaJual, hargaBeli, hpp);
  return {
    id:       `kledo-${p.id}`,
    kledoId:  p.id,
    name:     p.name ?? '',
    sku:      p.code ?? '',
    price:    hargaTertinggi,
    hargaJual,
    hargaBeli,
    hpp,
    unit: p.unit
      ? (typeof p.unit === 'string' ? p.unit : (p.unit?.name ?? ''))
      : '',
  };
}

function mapContact(c: any) {
  return {
    id:      `kledo-${c.id}`,
    kledoId: c.id,
    name:    c.name  ?? '',
    phone:   c.phone ?? '',
    email:   c.email ?? '',
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type') ?? 'contacts';
  const q    = (searchParams.get('q') ?? '').trim();

  const token = await getKledoToken();
  if (!token) {
    return NextResponse.json({ success: false, data: [], message: 'Token Kledo tidak ditemukan' });
  }

  const now = Date.now();

  // ── PRODUCTS ─────────────────────────────────────────────────────────────
  if (type === 'products') {
    if (!productsLoading && (now - productsCache.ts > CACHE_TTL || productsCache.data.length === 0)) {
      productsLoading = true;
      try {
        const raw = await fetchAllPages(token, 'finance/products', MAX_PAGES);
        productsCache.data = raw.map(mapProduct);
        productsCache.ts   = now;
      } finally {
        productsLoading = false;
      }
    }

    const filtered = q
      ? productsCache.data.filter(p => textMatch(p.name, q) || textMatch(p.sku, q))
      : productsCache.data;

    return NextResponse.json({ success: true, data: filtered, total: productsCache.data.length });
  }

  // ── CONTACTS — search directly via Kledo API when q provided ─────────────
  // This bypasses the MAX_PAGES=20 limit (which only covers 10k of 22k+ contacts)
  if (q) {
    try {
      const raw     = await searchContactsDirect(token, q);
      const results = raw.map(mapContact);
      return NextResponse.json({ success: true, data: results, total: results.length });
    } catch (e: any) {
      return NextResponse.json({ success: false, data: [], message: e.message });
    }
  }

  // q is empty → return empty (no more "load all 22k" on startup)
  return NextResponse.json({ success: true, data: [], total: 0 });
}

export async function DELETE() {
  productsCache.data = []; productsCache.ts = 0;
  cachedKledoToken   = null;
  return NextResponse.json({ success: true, message: 'Cache cleared' });
}
