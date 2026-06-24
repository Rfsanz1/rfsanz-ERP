import { Pool } from 'pg';

let pool: Pool | null = null;
let tablesEnsured = false;

/** Cek apakah local DB tersedia (DATABASE_URL dikonfigurasi). */
export function hasLocalDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL tidak dikonfigurasi — gunakan backend langsung');
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('sslmode=disable')
        ? false
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

/** Baca setting dari local_settings table */
export async function getLocalSetting(key: string): Promise<string | null> {
  try {
    const db = getDb();
    const r = await db.query(`SELECT value FROM local_settings WHERE key=$1`, [key]);
    return r.rows[0]?.value ?? null;
  } catch { return null; }
}

/** Simpan setting ke local_settings table */
export async function setLocalSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  await db.query(
    `INSERT INTO local_settings(key,value) VALUES($1,$2)
     ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`,
    [key, value],
  );
}

/** Pastikan tabel local_orders & local_order_items ada — dipanggil sekali */
export async function ensureTables(): Promise<void> {
  if (tablesEnsured) return;
  const db = getDb();

  // Create tables if they don't exist
  await db.query(`
    CREATE TABLE IF NOT EXISTS local_settings (
      key         VARCHAR(100) PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS local_orders (
      id                  SERIAL PRIMARY KEY,
      so_number           VARCHAR(50) UNIQUE NOT NULL,
      nama_customer       VARCHAR(255) NOT NULL,
      no_hp               VARCHAR(50),
      alamat              TEXT,
      catatan             TEXT,
      sales_name          VARCHAR(100),
      tanggal             DATE NOT NULL DEFAULT CURRENT_DATE,
      diskon_total        NUMERIC(14,2) DEFAULT 0,
      pajak               NUMERIC(14,2) DEFAULT 0,
      ongkir              NUMERIC(14,2) DEFAULT 0,
      total_harga         NUMERIC(14,2) DEFAULT 0,
      uang_muka           NUMERIC(14,2) DEFAULT 0,
      metode_pembayaran   VARCHAR(50) DEFAULT 'transfer',
      status              VARCHAR(50) DEFAULT 'pending',
      status_pengiriman   VARCHAR(50) DEFAULT 'belum_dikirim',
      customer_id         VARCHAR(100),
      kledo_contact_id    VARCHAR(100),
      kledo_invoice_id    VARCHAR(100),
      kledo_synced        BOOLEAN DEFAULT FALSE,
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      updated_at          TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS local_order_items (
      id                SERIAL PRIMARY KEY,
      order_id          INTEGER NOT NULL REFERENCES local_orders(id) ON DELETE CASCADE,
      nama              VARCHAR(255) NOT NULL,
      qty               NUMERIC(10,2) DEFAULT 1,
      harga             NUMERIC(14,2) DEFAULT 0,
      subtotal          NUMERIC(14,2) DEFAULT 0,
      diskon            NUMERIC(14,2) DEFAULT 0,
      unit              VARCHAR(50),
      product_id        VARCHAR(100),
      kledo_product_id  VARCHAR(100),
      created_at        TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_local_orders_so       ON local_orders(so_number);
    CREATE INDEX IF NOT EXISTS idx_local_orders_customer ON local_orders(nama_customer);
    CREATE INDEX IF NOT EXISTS idx_local_orders_status   ON local_orders(status);
    CREATE INDEX IF NOT EXISTS idx_local_order_items_ord ON local_order_items(order_id);
  `);

  // Migrate: add columns that may not exist in older DB instances
  const migrations = [
    `ALTER TABLE local_orders ADD COLUMN IF NOT EXISTS kledo_contact_id VARCHAR(100)`,
    `ALTER TABLE local_orders ADD COLUMN IF NOT EXISTS kledo_invoice_id  VARCHAR(100)`,
    `ALTER TABLE local_orders ADD COLUMN IF NOT EXISTS kledo_synced      BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE local_orders ADD COLUMN IF NOT EXISTS uang_muka         NUMERIC(14,2) DEFAULT 0`,
    `ALTER TABLE local_orders ADD COLUMN IF NOT EXISTS status_pengiriman VARCHAR(50) DEFAULT 'belum_dikirim'`,
    `ALTER TABLE local_orders ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT NOW()`,
    `ALTER TABLE local_order_items ADD COLUMN IF NOT EXISTS kledo_product_id VARCHAR(100)`,
    `ALTER TABLE local_order_items ADD COLUMN IF NOT EXISTS diskon           NUMERIC(14,2) DEFAULT 0`,
    `ALTER TABLE local_order_items ADD COLUMN IF NOT EXISTS unit             VARCHAR(50)`,
  ];

  for (const sql of migrations) {
    try { await db.query(sql); } catch { /* column already exists, ignore */ }
  }

  tablesEnsured = true;
}

export function getOrderById(db: Pool, id: number) {
  return db.query(
    `SELECT o.*, COALESCE(json_agg(i.* ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
       FROM local_orders o
       LEFT JOIN local_order_items i ON i.order_id = o.id
      WHERE o.id = $1
      GROUP BY o.id`,
    [id],
  ).then(r => r.rows[0] ?? null);
}

export function generateSoNumber(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `SO-${yy}${mm}${dd}-${rand}`;
}
