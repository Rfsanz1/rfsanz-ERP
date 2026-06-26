import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const BACKEND_RAW = process.env.BACKEND_URL || '';
const BACKEND = BACKEND_RAW && !BACKEND_RAW.startsWith('http')
  ? `https://${BACKEND_RAW}` : BACKEND_RAW;

let cachedKledoToken: string | null = null;
const cachedKledoBase = 'https://api.kledo.com/api/v1';

let _pgPool: Pool | null = null;
function getPg(): Pool {
  if (!_pgPool && process.env.DATABASE_URL) {
    _pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=disable')
        ? false : { rejectUnauthorized: false },
    });
  }
  return _pgPool!;
}

async function getKledoToken(): Promise<string | null> {
  if (cachedKledoToken) return cachedKledoToken;

  // 1. Env var
  if (process.env.KLEDO_TOKEN) {
    cachedKledoToken = process.env.KLEDO_TOKEN;
    return cachedKledoToken;
  }

  // 2a. Tabel local_settings (frontend-managed)
  if (process.env.DATABASE_URL) {
    try {
      const db = getPg();
      const r = await db.query(`SELECT value FROM local_settings WHERE key='kledo_token' LIMIT 1`);
      const t = r.rows[0]?.value;
      if (t) { cachedKledoToken = t; return t; }
    } catch {}
  }

  // 2b. Tabel "AppSetting" (Prisma/NestJS backend — dipakai di aaPanel/self-hosted)
  if (process.env.DATABASE_URL) {
    try {
      const db = getPg();
      const r = await db.query(`SELECT value FROM "AppSetting" WHERE key='kledo_token' LIMIT 1`);
      const t = r.rows[0]?.value;
      if (t) { cachedKledoToken = t; return t; }
    } catch {}
  }

  // 3. Backend API — coba port 3000 dulu lalu BACKEND_URL
  const candidates = ['http://127.0.0.1:3000', 'http://localhost:3000', BACKEND].filter(Boolean);
  for (const base of candidates) {
    try {
      const r = await fetch(`${base}/api/settings`, {
        headers: { 'ngrok-skip-browser-warning': '1' },
        signal: AbortSignal.timeout(3000),
      });
      if (r.ok) {
        const d = await r.json();
        const t = d?.data?.kledo_token ?? null;
        if (t) { cachedKledoToken = t; return t; }
      }
    } catch {}
  }

  return null;
}

const productsCache: { data: any[]; ts: number } = { data: [], ts: 0 };
let productsLoading = false;

const CACHE_TTL   = 30 * 60 * 1000;
const PER_PAGE    = 500;
const CONCURRENCY = 5;
const MAX_PAGES   = 60; // 30.000 produk max (naik dari 20)

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
      signal: AbortSignal.timeout(20_000),
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

/** Cari produk langsung via Kledo ?name= — untuk query yang tidak ada di cache */
async function searchProductsDirect(token: string, q: string): Promise<any[]> {
  const results: any[] = [];
  const first = await fetchPage(token, 'finance/products', 1, `&name=${encodeURIComponent(q)}`);
  results.push(...first.items);
  if (first.ok && first.lastPage > 1) {
    const cap = Math.min(first.lastPage, 4);
    for (let p = 2; p <= cap; p++) {
      const page = await fetchPage(token, 'finance/products', p, `&name=${encodeURIComponent(q)}`);
      if (page.ok) results.push(...page.items);
    }
  }
  return results;
}

async function searchContactsDirect(token: string, q: string): Promise<any[]> {
  const results: any[] = [];
  const first = await fetchPage(token, 'finance/contacts', 1, `&search=${encodeURIComponent(q)}`);
  results.push(...first.items);
  if (first.ok && first.lastPage > 1) {
    const cap = Math.min(first.lastPage, 5);
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
  const fromSells      = Number(p.sells?.[0]?.price ?? p.sells?.[0]?.unit_price ?? 0);
  const hargaJual      = Number(p.price ?? p.sell_price ?? p.sales_price ?? 0) || fromSells;
  const hargaBeli      = Number(p.base_price ?? p.buy_price ?? p.purchase_price ?? p.buying_price ?? 0);
  const hpp            = Number(p.avg_base_price ?? p.hpp ?? p.cost_price ?? p.cogs ?? 0);
  const hargaTertinggi = Math.max(hargaJual, hargaBeli, hpp);
  return {
    id:              `kledo-${p.id}`,
    kledoId:         p.id,
    name:            p.name ?? '',
    sku:             p.code ?? '',
    price:           hargaTertinggi,
    hargaJual,
    hargaBeli,
    hpp,
    hargaTertinggi,
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
    return NextResponse.json({
      success: false, data: [],
      message: 'Token Kledo tidak ditemukan — pastikan KLEDO_TOKEN di-set atau token disimpan via halaman Pengaturan',
    });
  }

  const now = Date.now();

  // ── PRODUCTS ─────────────────────────────────────────────────────────────
  if (type === 'products') {
    // Muat semua produk ke cache (background jika sudah loading)
    if (!productsLoading && (now - productsCache.ts > CACHE_TTL || productsCache.data.length === 0)) {
      productsLoading = true;
      fetchAllPages(token, 'finance/products', MAX_PAGES)
        .then(raw => {
          productsCache.data = raw.map(mapProduct);
          productsCache.ts   = Date.now();
        })
        .catch(() => {})
        .finally(() => { productsLoading = false; });
    }

    // Jika cache sudah ada — filter lokal
    if (productsCache.data.length > 0 && q) {
      const fromCache = productsCache.data.filter(
        p => textMatch(p.name, q) || textMatch(p.sku, q),
      );
      // Jika dari cache ada hasil, kembalikan langsung
      if (fromCache.length > 0) {
        return NextResponse.json({ success: true, data: fromCache, total: productsCache.data.length, source: 'cache' });
      }
      // Tidak ada di cache → cari langsung ke Kledo (produk baru / di luar 30k)
      try {
        const raw  = await searchProductsDirect(token, q);
        const data = raw.map(mapProduct);
        // Merge ke cache supaya pencarian berikutnya lebih cepat
        const existingIds = new Set(productsCache.data.map(p => p.id));
        for (const p of data) { if (!existingIds.has(p.id)) productsCache.data.push(p); }
        return NextResponse.json({ success: true, data, total: productsCache.data.length, source: 'direct' });
      } catch {
        return NextResponse.json({ success: true, data: [], total: 0, source: 'none' });
      }
    }

    // Cache belum siap dan ada query → cari langsung ke Kledo
    if (q && productsCache.data.length === 0) {
      try {
        const raw  = await searchProductsDirect(token, q);
        const data = raw.map(mapProduct);
        return NextResponse.json({ success: true, data, total: data.length, source: 'direct' });
      } catch {
        return NextResponse.json({ success: true, data: [], total: 0, source: 'none' });
      }
    }

    const filtered = q
      ? productsCache.data.filter(p => textMatch(p.name, q) || textMatch(p.sku, q))
      : productsCache.data.slice(0, 50);

    return NextResponse.json({ success: true, data: filtered, total: productsCache.data.length, source: 'cache' });
  }

  // ── CONTACTS ─────────────────────────────────────────────────────────────
  if (q) {
    try {
      const raw     = await searchContactsDirect(token, q);
      const results = raw.map(mapContact);
      return NextResponse.json({ success: true, data: results, total: results.length });
    } catch (e: any) {
      return NextResponse.json({ success: false, data: [], message: e.message });
    }
  }

  return NextResponse.json({ success: true, data: [], total: 0 });
}

export async function DELETE() {
  productsCache.data = []; productsCache.ts = 0;
  cachedKledoToken   = null;
  return NextResponse.json({ success: true, message: 'Cache cleared' });
}
