import { Pool } from 'pg';

let pool: Pool | null = null;
let tablesEnsured = false;

export function getDb(): Pool {
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

/** Pastikan tabel local_orders & local_order_items ada — dipanggil sekali */
export async function ensureTables(): Promise<void> {
  if (tablesEnsured) return;
  const db = getDb();
  await db.query(`
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
  tablesEnsured = true;
}

export function generateSoNumber(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `SO-${yy}${mm}${dd}-${rand}`;
}
