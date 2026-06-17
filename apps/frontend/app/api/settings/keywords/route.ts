import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/localDb';

async function ensureTable(db: any) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS category_keywords (
      id       SERIAL PRIMARY KEY,
      keyword  TEXT NOT NULL,
      kategori TEXT NOT NULL CHECK (kategori IN ('elektronik', 'bahan_bangunan')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (keyword, kategori)
    )
  `);
}

export async function GET() {
  try {
    const db = getDb();
    await ensureTable(db);
    const res = await db.query(
      `SELECT id, keyword, kategori, created_at FROM category_keywords ORDER BY kategori, keyword`,
    );
    return NextResponse.json({ data: res.rows, error: null });
  } catch (e: any) {
    return NextResponse.json({ data: [], error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { keyword, kategori } = await req.json();
    if (!keyword?.trim())   return NextResponse.json({ error: 'keyword wajib diisi' }, { status: 400 });
    if (!['elektronik', 'bahan_bangunan'].includes(kategori))
      return NextResponse.json({ error: 'kategori tidak valid' }, { status: 400 });

    const db = getDb();
    await ensureTable(db);
    const res = await db.query(
      `INSERT INTO category_keywords (keyword, kategori)
       VALUES ($1, $2)
       ON CONFLICT (keyword, kategori) DO NOTHING
       RETURNING *`,
      [keyword.trim().toLowerCase(), kategori],
    );
    return NextResponse.json({ data: res.rows[0] ?? null, error: null });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });
    const db = getDb();
    await db.query(`DELETE FROM category_keywords WHERE id = $1`, [id]);
    return NextResponse.json({ data: null, error: null });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}
