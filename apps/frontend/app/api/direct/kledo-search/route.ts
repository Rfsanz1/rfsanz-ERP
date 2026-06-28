import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const BACKEND_RAW = process.env.BACKEND_URL || '';
const BACKEND = BACKEND_RAW && !BACKEND_RAW.startsWith('http')
  ? `https://${BACKEND_RAW}` : BACKEND_RAW;

// ── PostgreSQL pool (shared) ──────────────────────────────────────────────────
let _pgPool: Pool | null = null;
function getPg(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!_pgPool) {
    _pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=disable')
        ? false : { rejectUnauthorized: false },
    });
  }
  return _pgPool;
}

// ── Kledo token (lazy, multi-source) ─────────────────────────────────────────
let _cachedToken: string | null = null;
const KLEDO_BASE = 'https://api.kledo.com/api/v1';

async function getKledoToken(): Promise<string | null> {
  if (_cachedToken) return _cachedToken;

  // 1. Env var
  if (process.env.KLEDO_TOKEN) {
    _cachedToken = process.env.KLEDO_TOKEN;
    return _cachedToken;
  }

  const db = getPg();
  if (db) {
    // 2a. local_settings table
    try {
      const r = await db.query(`SELECT value FROM local_settings WHERE key='kledo_token' LIMIT 1`);
      const t = r.rows[0]?.value;
      if (t) { _cachedToken = t; return t; }
    } catch {}

    // 2b. AppSetting table (Prisma/NestJS — token disimpan via halaman Pengaturan)
    try {
      const r = await db.query(`SELECT value FROM "AppSetting" WHERE key='kledo_token' LIMIT 1`);
      const t = r.rows[0]?.value;
      if (t) { _cachedToken = t; return t; }
    } catch {}
  }

  // 3. Backend API (port 3000 / BACKEND_URL)
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
        if (t) { _cachedToken = t; return t; }
      }
    } catch {}
  }

  return null;
}

// ── Search produk dari tabel "Product" (PostgreSQL lokal, hasil sync Kledo) ──
async function searchProductsFromDb(q: string, limit = 100): Promise<any[]> {
  const db = getPg();
  if (!db) return [];
  try {
    if (q.trim() === '') {
      // Tanpa query → kembalikan semua produk aktif (max limit)
      const r = await db.query(
        `SELECT
           p.id,
           p.sku,
           p.name,
           p."hargaBeli",
           p."hargaJual",
           p."hargaKledo",
           p."kledoProductId",
           p.stok,
           u.name AS unit_name
         FROM "Product" p
         LEFT JOIN "ProductUnit" u ON u.id = p."unitId"
         WHERE p.active = true
         ORDER BY p.name
         LIMIT $1`,
        [limit],
      );
      return r.rows;
    }
    const like = `%${q.trim()}%`;
    const r = await db.query(
      `SELECT
         p.id,
         p.sku,
         p.name,
         p."hargaBeli",
         p."hargaJual",
         p."hargaKledo",
         p."kledoProductId",
         p.stok,
         u.name AS unit_name
       FROM "Product" p
       LEFT JOIN "ProductUnit" u ON u.id = p."unitId"
       WHERE p.active = true
         AND (p.name ILIKE $1 OR p.sku ILIKE $2)
       ORDER BY p.name
       LIMIT $3`,
      [like, like, limit],
    );
    return r.rows;
  } catch (e: any) {
    console.error('[kledo-search] DB error:', e.message);
    return [];
  }
}

function mapDbProduct(p: any) {
  const hargaJual      = Number(p.hargaJual ?? p.hargaKledo ?? 0);
  const hargaBeli      = Number(p.hargaBeli ?? 0);
  const hargaKledo     = Number(p.hargaKledo ?? 0);
  const hargaTertinggi = Math.max(hargaJual, hargaBeli, hargaKledo);
  return {
    id:              p.kledoProductId ? `kledo-${p.kledoProductId}` : `local-${p.id}`,
    kledoId:         p.kledoProductId ?? null,
    name:            p.name ?? '',
    sku:             p.sku ?? '',
    price:           hargaTertinggi,
    hargaJual,
    hargaBeli,
    hargaTertinggi,
    hpp:             hargaBeli,
    stok:            Number(p.stok ?? 0),
    unit:            p.unit_name ?? '',
    source:          'local_db',
  };
}

// ── Kledo direct search (fallback jika DB kosong) ────────────────────────────
async function searchProductsKledo(token: string, q: string): Promise<any[]> {
  try {
    // q kosong → ambil semua produk (tanpa filter name)
    const params = new URLSearchParams({ per_page: '100', page: '1' });
    if (q.trim()) params.set('name', q.trim());
    const url = `${KLEDO_BASE}/finance/products?${params.toString()}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return [];
    const d = await r.json();
    return d?.data?.data ?? [];
  } catch {
    return [];
  }
}

function mapKledoProduct(p: any) {
  const fromSells      = Number(p.sells?.[0]?.price ?? 0);
  const hargaJual      = Number(p.price ?? p.sell_price ?? 0) || fromSells;
  const hargaBeli      = Number(p.base_price ?? p.buy_price ?? 0);
  const hargaTertinggi = Math.max(hargaJual, hargaBeli);
  return {
    id:              `kledo-${p.id}`,
    kledoId:         p.id,
    name:            p.name ?? '',
    sku:             p.code ?? '',
    price:           hargaTertinggi,
    hargaJual,
    hargaBeli,
    hargaTertinggi,
    hpp:             hargaBeli,
    stok:            0,
    unit:            typeof p.unit === 'string' ? p.unit : (p.unit?.name ?? ''),
    source:          'kledo_api',
  };
}

// ── Contacts ─────────────────────────────────────────────────────────────────
async function searchContactsKledo(token: string, q: string): Promise<any[]> {
  const results: any[] = [];
  try {
    const r = await fetch(
      `${KLEDO_BASE}/finance/contacts?search=${encodeURIComponent(q)}&per_page=500&page=1`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) },
    );
    if (!r.ok) return results;
    const d = await r.json();
    const items: any[] = d?.data?.data ?? [];
    results.push(...items);

    const lastPage = d?.data?.last_page ?? 1;
    const cap = Math.min(lastPage, 5);
    for (let p = 2; p <= cap; p++) {
      const r2 = await fetch(
        `${KLEDO_BASE}/finance/contacts?search=${encodeURIComponent(q)}&per_page=500&page=${p}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) },
      );
      if (r2.ok) {
        const d2 = await r2.json();
        results.push(...(d2?.data?.data ?? []));
      }
    }
  } catch {}
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type') ?? 'contacts';
  const q    = (searchParams.get('q') ?? '').trim();

  // ── PRODUCTS ───────────────────────────────────────────────────────────────
  if (type === 'products') {
    // 1. Query dari tabel Product lokal (q kosong → semua produk, q ada → filter)
    const dbRows = await searchProductsFromDb(q, 100);
    if (dbRows.length > 0) {
      const data = dbRows.map(mapDbProduct);
      return NextResponse.json({ success: true, data, total: data.length, source: 'local_db' });
    }

    // 2. Jika DB lokal kosong, fallback ke Kledo API langsung
    const token = await getKledoToken();
    if (!token) {
      return NextResponse.json({
        success: false, data: [], source: 'none',
        message: 'Database produk lokal kosong. Lakukan import produk dari Kledo di menu Integrasi terlebih dahulu.',
      });
    }

    // Untuk q kosong, ambil halaman pertama produk dari Kledo
    const searchQ = q || '';
    const kledoRows = await searchProductsKledo(token, searchQ);
    if (kledoRows.length > 0) {
      const data = kledoRows.map(mapKledoProduct);
      return NextResponse.json({ success: true, data, total: data.length, source: 'kledo_api' });
    }

    return NextResponse.json({ success: true, data: [], total: 0, source: 'none' });
  }

  // ── CONTACTS ───────────────────────────────────────────────────────────────
  if (!q) {
    return NextResponse.json({ success: true, data: [], total: 0 });
  }

  const token = await getKledoToken();
  if (!token) {
    return NextResponse.json({
      success: false, data: [],
      message: 'Token Kledo tidak ditemukan — pastikan KLEDO_TOKEN di-set atau token disimpan via halaman Pengaturan',
    });
  }

  try {
    const raw = await searchContactsKledo(token, q);
    const data = raw.map((c: any) => ({
      id:      `kledo-${c.id}`,
      kledoId: c.id,
      name:    c.name  ?? '',
      phone:   c.phone ?? '',
      email:   c.email ?? '',
    }));
    return NextResponse.json({ success: true, data, total: data.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, data: [], message: e.message });
  }
}

export async function DELETE() {
  _cachedToken = null;
  return NextResponse.json({ success: true, message: 'Token cache cleared' });
}
