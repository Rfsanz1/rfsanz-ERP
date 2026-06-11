'use client';

import { useState, useMemo } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface Endpoint {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  auth: boolean;
  params: Param[];
  bodyExample?: string;
  responseExample: string;
}

interface ModuleGroup {
  id: string;
  label: string;
  icon: string;
  endpoints: Endpoint[];
}

const METHOD_COLORS: Record<HttpMethod, { bg: string; text: string; border: string }> = {
  GET:    { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
  POST:   { bg: '#EFF6FF', text: '#2563EB', border: '#93C5FD' },
  PUT:    { bg: '#EFF6FF', text: '#1D4ED8', border: '#93C5FD' },
  PATCH:  { bg: '#FFFBEB', text: '#D97706', border: '#FCD34D' },
  DELETE: { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' },
};

const MODULES: ModuleGroup[] = [
  {
    id: 'auth',
    label: 'Authentication',
    icon: '🔐',
    endpoints: [
      {
        id: 'auth-register',
        method: 'POST',
        path: '/api/auth/register',
        summary: 'Daftarkan tenant & owner',
        description: 'Membuat tenant baru beserta akun owner pertama. Mengembalikan token akses setelah registrasi berhasil.',
        auth: false,
        params: [],
        bodyExample: JSON.stringify({ tenantName: 'PT Contoh', ownerName: 'Budi Santoso', email: 'budi@contoh.com', password: 'Rahasia123!' }, null, 2),
        responseExample: JSON.stringify({ accessToken: 'eyJhbGci...', refreshToken: 'eyJhbGci...', user: { id: 'uuid', name: 'Budi Santoso', email: 'budi@contoh.com', role: 'OWNER' } }, null, 2),
      },
      {
        id: 'auth-login',
        method: 'POST',
        path: '/api/auth/login',
        summary: 'Login pengguna',
        description: 'Autentikasi pengguna dengan email dan password. Mengembalikan accessToken dan refreshToken.',
        auth: false,
        params: [],
        bodyExample: JSON.stringify({ email: 'budi@contoh.com', password: 'Rahasia123!' }, null, 2),
        responseExample: JSON.stringify({ accessToken: 'eyJhbGci...', refreshToken: 'eyJhbGci...', user: { id: 'uuid', name: 'Budi Santoso', role: 'OWNER' } }, null, 2),
      },
      {
        id: 'auth-logout',
        method: 'POST',
        path: '/api/auth/logout',
        summary: 'Logout & invalidasi sesi',
        description: 'Menginvalidasi token aktif pengguna saat ini.',
        auth: true,
        params: [],
        bodyExample: undefined,
        responseExample: JSON.stringify({ message: 'Logout berhasil.' }, null, 2),
      },
      {
        id: 'auth-me',
        method: 'GET',
        path: '/api/auth/me',
        summary: 'Profil pengguna saat ini',
        description: 'Mengambil informasi profil dari pengguna yang sedang login.',
        auth: true,
        params: [],
        responseExample: JSON.stringify({ id: 'uuid', name: 'Budi Santoso', email: 'budi@contoh.com', role: 'OWNER', tenantId: 'tenant-uuid' }, null, 2),
      },
    ],
  },
  {
    id: 'sales',
    label: 'Penjualan',
    icon: '📈',
    endpoints: [
      {
        id: 'sales-list',
        method: 'GET',
        path: '/api/sales/orders',
        summary: 'Daftar sales order',
        description: 'Mengambil semua sales order milik tenant yang sedang aktif. Mendukung paginasi dan filter.',
        auth: true,
        params: [
          { name: 'page', type: 'number', required: false, description: 'Nomor halaman (default: 1)' },
          { name: 'limit', type: 'number', required: false, description: 'Jumlah item per halaman (default: 20)' },
          { name: 'status', type: 'string', required: false, description: 'Filter status: DRAFT | CONFIRMED | DELIVERED | CANCELLED' },
          { name: 'search', type: 'string', required: false, description: 'Cari berdasarkan nomor SO atau nama pelanggan' },
        ],
        responseExample: JSON.stringify({ data: [{ id: 'so-uuid', soNumber: 'SO-2025-001', customer: 'PT Maju', total: 5000000, status: 'CONFIRMED' }], meta: { total: 1, page: 1, limit: 20 } }, null, 2),
      },
      {
        id: 'sales-create',
        method: 'POST',
        path: '/api/sales/orders',
        summary: 'Buat sales order baru',
        description: 'Membuat sales order baru. Stok akan divalidasi sebelum order dikonfirmasi.',
        auth: true,
        params: [],
        bodyExample: JSON.stringify({ customerId: 'cust-uuid', items: [{ productId: 'prod-uuid', qty: 5, price: 1000000 }], notes: 'Dikirim sebelum akhir bulan' }, null, 2),
        responseExample: JSON.stringify({ id: 'so-uuid', soNumber: 'SO-2025-002', status: 'DRAFT', total: 5000000 }, null, 2),
      },
      {
        id: 'sales-update',
        method: 'PATCH',
        path: '/api/sales/orders/:id',
        summary: 'Update status SO',
        description: 'Mengubah status sales order atau detail lainnya.',
        auth: true,
        params: [
          { name: 'id', type: 'string', required: true, description: 'UUID dari sales order' },
        ],
        bodyExample: JSON.stringify({ status: 'CONFIRMED' }, null, 2),
        responseExample: JSON.stringify({ id: 'so-uuid', soNumber: 'SO-2025-002', status: 'CONFIRMED', updatedAt: '2025-06-11T10:00:00Z' }, null, 2),
      },
    ],
  },
  {
    id: 'invoice',
    label: 'Invoice',
    icon: '🧾',
    endpoints: [
      {
        id: 'invoice-list',
        method: 'GET',
        path: '/api/invoice',
        summary: 'Daftar invoice',
        description: 'Mengambil semua invoice. Mendukung filter berdasarkan status pembayaran dan tanggal.',
        auth: true,
        params: [
          { name: 'status', type: 'string', required: false, description: 'UNPAID | PARTIAL | PAID | OVERDUE' },
          { name: 'from', type: 'string', required: false, description: 'Tanggal mulai (ISO 8601)' },
          { name: 'to', type: 'string', required: false, description: 'Tanggal akhir (ISO 8601)' },
        ],
        responseExample: JSON.stringify({ data: [{ id: 'inv-uuid', invoiceNumber: 'INV-2025-001', amount: 5500000, status: 'UNPAID', dueDate: '2025-07-11' }], meta: { total: 1 } }, null, 2),
      },
      {
        id: 'invoice-create',
        method: 'POST',
        path: '/api/invoice',
        summary: 'Buat invoice dari SO',
        description: 'Membuat invoice berdasarkan sales order yang sudah dikonfirmasi.',
        auth: true,
        params: [],
        bodyExample: JSON.stringify({ salesOrderId: 'so-uuid', dueDate: '2025-07-11', taxRate: 11 }, null, 2),
        responseExample: JSON.stringify({ id: 'inv-uuid', invoiceNumber: 'INV-2025-002', amount: 5550000, taxAmount: 550000, status: 'UNPAID' }, null, 2),
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventori',
    icon: '📦',
    endpoints: [
      {
        id: 'inventory-products',
        method: 'GET',
        path: '/api/inventory/products',
        summary: 'Daftar produk',
        description: 'Mengambil semua produk beserta stok saat ini di setiap gudang.',
        auth: true,
        params: [
          { name: 'warehouseId', type: 'string', required: false, description: 'Filter berdasarkan gudang tertentu' },
          { name: 'lowStock', type: 'boolean', required: false, description: 'Tampilkan hanya produk dengan stok rendah' },
        ],
        responseExample: JSON.stringify({ data: [{ id: 'prod-uuid', sku: 'SKU-001', name: 'Produk A', stock: 150, unit: 'pcs', costPrice: 80000 }] }, null, 2),
      },
      {
        id: 'inventory-adjustment',
        method: 'POST',
        path: '/api/inventory/adjustments',
        summary: 'Penyesuaian stok',
        description: 'Melakukan penyesuaian stok manual dengan alasan yang tercatat di audit log.',
        auth: true,
        params: [],
        bodyExample: JSON.stringify({ productId: 'prod-uuid', warehouseId: 'wh-uuid', quantity: -5, reason: 'Barang rusak' }, null, 2),
        responseExample: JSON.stringify({ id: 'adj-uuid', newStock: 145, adjustedAt: '2025-06-11T10:00:00Z' }, null, 2),
      },
    ],
  },
  {
    id: 'customers',
    label: 'Pelanggan',
    icon: '👥',
    endpoints: [
      {
        id: 'customers-list',
        method: 'GET',
        path: '/api/customers',
        summary: 'Daftar pelanggan',
        description: 'Mengambil semua data pelanggan milik tenant.',
        auth: true,
        params: [
          { name: 'search', type: 'string', required: false, description: 'Cari berdasarkan nama atau email' },
        ],
        responseExample: JSON.stringify({ data: [{ id: 'cust-uuid', name: 'PT Maju Jaya', email: 'info@majujaya.com', phone: '02112345678', totalOrders: 12 }] }, null, 2),
      },
      {
        id: 'customers-create',
        method: 'POST',
        path: '/api/customers',
        summary: 'Tambah pelanggan baru',
        description: 'Menambahkan data pelanggan baru ke database tenant.',
        auth: true,
        params: [],
        bodyExample: JSON.stringify({ name: 'PT Baru', email: 'info@ptbaru.com', phone: '02198765432', address: 'Jl. Sudirman No. 1, Jakarta' }, null, 2),
        responseExample: JSON.stringify({ id: 'cust-uuid', name: 'PT Baru', email: 'info@ptbaru.com', createdAt: '2025-06-11T10:00:00Z' }, null, 2),
      },
    ],
  },
  {
    id: 'finance',
    label: 'Keuangan',
    icon: '💰',
    endpoints: [
      {
        id: 'finance-balance-sheet',
        method: 'GET',
        path: '/api/finance/reports/balance-sheet',
        summary: 'Neraca keuangan',
        description: 'Menghasilkan laporan neraca (balance sheet) pada tanggal tertentu.',
        auth: true,
        params: [
          { name: 'date', type: 'string', required: true, description: 'Tanggal neraca (ISO 8601: YYYY-MM-DD)' },
        ],
        responseExample: JSON.stringify({ date: '2025-06-11', assets: { total: 500000000, current: 300000000, fixed: 200000000 }, liabilities: { total: 150000000 }, equity: { total: 350000000 } }, null, 2),
      },
      {
        id: 'finance-journal',
        method: 'POST',
        path: '/api/finance/journals',
        summary: 'Buat jurnal manual',
        description: 'Mencatat entri jurnal akuntansi secara manual.',
        auth: true,
        params: [],
        bodyExample: JSON.stringify({ date: '2025-06-11', description: 'Beban listrik Juni', entries: [{ accountId: 'acc-beban', debit: 500000 }, { accountId: 'acc-kas', credit: 500000 }] }, null, 2),
        responseExample: JSON.stringify({ id: 'jrn-uuid', journalNumber: 'JRN-2025-100', status: 'POSTED', totalDebit: 500000, totalCredit: 500000 }, null, 2),
      },
    ],
  },
  {
    id: 'hr',
    label: 'HR & Payroll',
    icon: '👔',
    endpoints: [
      {
        id: 'hr-employees',
        method: 'GET',
        path: '/api/hr/employees',
        summary: 'Daftar karyawan',
        description: 'Mengambil semua data karyawan aktif dan nonaktif.',
        auth: true,
        params: [
          { name: 'active', type: 'boolean', required: false, description: 'Filter karyawan aktif/nonaktif' },
        ],
        responseExample: JSON.stringify({ data: [{ id: 'emp-uuid', name: 'Andi Wijaya', department: 'Sales', position: 'Sales Manager', salary: 8000000 }] }, null, 2),
      },
      {
        id: 'hr-payroll-run',
        method: 'POST',
        path: '/api/payroll/run',
        summary: 'Jalankan penggajian',
        description: 'Memproses penggajian untuk periode tertentu. Menghitung PPh 21 secara otomatis.',
        auth: true,
        params: [],
        bodyExample: JSON.stringify({ period: '2025-06', cutoffDate: '2025-06-30' }, null, 2),
        responseExample: JSON.stringify({ id: 'pay-uuid', period: '2025-06', totalGross: 85000000, totalTax: 4250000, totalNet: 80750000, employees: 12 }, null, 2),
      },
    ],
  },
  {
    id: 'tax',
    label: 'Pajak',
    icon: '📋',
    endpoints: [
      {
        id: 'tax-efaktur',
        method: 'GET',
        path: '/api/tax/efaktur/export',
        summary: 'Export e-Faktur CSV',
        description: 'Mengekspor data faktur pajak dalam format CSV yang siap diimpor ke aplikasi e-Faktur DJP.',
        auth: true,
        params: [
          { name: 'from', type: 'string', required: true, description: 'Tanggal mulai (YYYY-MM-DD)' },
          { name: 'to', type: 'string', required: true, description: 'Tanggal akhir (YYYY-MM-DD)' },
        ],
        responseExample: '"NPWP","NamaLawan","Alamat","JumlahDPP","JumlahPPN"\n"012345678901234","PT Maju Jaya","Jl. Sudirman","5000000","550000"',
      },
    ],
  },
];

function buildCurl(endpoint: Endpoint): string {
  const method = endpoint.method;
  const url = `https://your-erp.replit.app${endpoint.path}`;
  const authHeader = endpoint.auth ? `\\\n  -H "Authorization: Bearer <YOUR_TOKEN>" ` : '';
  const body = endpoint.bodyExample
    ? `\\\n  -H "Content-Type: application/json" \\\n  -d '${endpoint.bodyExample.replace(/\n/g, '').replace(/  /g, ' ')}'`
    : '';
  return `curl -X ${method} "${url}" ${authHeader}${body}`;
}

export default function DocsPage() {
  const [activeModuleId, setActiveModuleId] = useState('auth');
  const [activeEndpointId, setActiveEndpointId] = useState('auth-register');
  const [search, setSearch] = useState('');
  const [copiedCurl, setCopiedCurl] = useState(false);

  const activeModule = MODULES.find(m => m.id === activeModuleId)!;
  const activeEndpoint = activeModule.endpoints.find(e => e.id === activeEndpointId) ?? activeModule.endpoints[0];

  const filteredModules = useMemo(() => {
    if (!search.trim()) return MODULES;
    const q = search.toLowerCase();
    return MODULES.map(m => ({
      ...m,
      endpoints: m.endpoints.filter(e =>
        e.path.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        m.label.toLowerCase().includes(q),
      ),
    })).filter(m => m.endpoints.length > 0);
  }, [search]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(buildCurl(activeEndpoint));
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const mc = METHOD_COLORS[activeEndpoint.method];

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', background: '#0F172A', color: '#E2E8F0', display: 'flex', flexDirection: 'column' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 50, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 24 }}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #0041ff, #41d1ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏭</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#F1F5F9' }}>Gentong Mas ERP</span>
          <span style={{ background: 'rgba(65,209,255,0.15)', color: '#41d1ff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(65,209,255,0.3)' }}>API</span>
        </a>

        <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari endpoint..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 12px 7px 34px', color: '#E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="#" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13 }}>Panduan</a>
          <a href="#" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13 }}>Changelog</a>
          <a href="/dashboard" style={{ background: 'linear-gradient(135deg, #0041ff, #41d1ff)', color: '#fff', fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 8, textDecoration: 'none' }}>Dashboard →</a>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <div style={{ background: 'linear-gradient(135deg, #0041ff 0%, #0066cc 40%, #41d1ff 100%)', padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '30%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', maxWidth: 800 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>● ONLINE</span>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>REST API v1.0</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Gentong Mas ERP — API Reference</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', margin: '0 0 28px', maxWidth: 560, lineHeight: 1.6 }}>
            Dokumentasi lengkap REST API untuk mengintegrasikan modul Sales, Inventory, Finance, HR, dan Pajak ke sistem Anda.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Base URL', value: `${API_BASE}/api` },
              { label: 'Auth', value: 'Bearer JWT' },
              { label: 'Format', value: 'JSON' },
              { label: 'Versi', value: 'v1.0.0' },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 16px', border: '1px solid rgba(255,255,255,0.25)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'monospace' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3-COLUMN LAYOUT ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Col 1 — Module Groups */}
        <aside style={{ width: 200, background: '#0F172A', borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', flexShrink: 0, padding: '16px 8px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 12px', marginBottom: 8 }}>Modul</div>
          {(search ? filteredModules : MODULES).map(mod => (
            <button
              key={mod.id}
              onClick={() => { setActiveModuleId(mod.id); setActiveEndpointId(mod.endpoints[0]?.id ?? ''); setSearch(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: activeModuleId === mod.id ? 600 : 400,
                background: activeModuleId === mod.id ? 'rgba(65,209,255,0.12)' : 'transparent',
                color: activeModuleId === mod.id ? '#41d1ff' : '#94A3B8',
                transition: 'all 0.15s',
              }}
            >
              <span>{mod.icon}</span>
              <span>{mod.label}</span>
            </button>
          ))}
        </aside>

        {/* Col 2 — Endpoint List */}
        <aside style={{ width: 260, background: '#111827', borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', flexShrink: 0, padding: '16px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 16px', marginBottom: 8 }}>
            {activeModule.icon} {activeModule.label}
          </div>
          {(search ? (filteredModules.find(m => m.id === activeModuleId)?.endpoints ?? activeModule.endpoints) : activeModule.endpoints).map(ep => {
            const mc2 = METHOD_COLORS[ep.method];
            const isActive = ep.id === activeEndpoint.id;
            return (
              <button
                key={ep.id}
                onClick={() => setActiveEndpointId(ep.id)}
                style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent', cursor: 'pointer', textAlign: 'left', borderLeft: isActive ? '2px solid #41d1ff' : '2px solid transparent', transition: 'all 0.15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: mc2.bg, color: mc2.text, fontFamily: 'monospace' }}>{ep.method}</span>
                </div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: isActive ? '#E2E8F0' : '#64748B', wordBreak: 'break-all', lineHeight: 1.4 }}>{ep.path}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 1.3 }}>{ep.summary}</div>
              </button>
            );
          })}
        </aside>

        {/* Col 3 — Detail Panel */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: '#111827' }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 6, background: mc.bg, color: mc.text, border: `1px solid ${mc.border}`, fontFamily: 'monospace' }}>{activeEndpoint.method}</span>
              <code style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', fontFamily: 'monospace' }}>{activeEndpoint.path}</code>
              {activeEndpoint.auth && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>🔒 Butuh Auth</span>
              )}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: '0 0 8px' }}>{activeEndpoint.summary}</h2>
            <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{activeEndpoint.description}</p>
          </div>

          {/* Parameters */}
          {activeEndpoint.params.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#41d1ff' }}>⚙</span> Parameter
              </h3>
              <div style={{ background: '#0F172A', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['Nama', 'Tipe', 'Wajib', 'Deskripsi'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeEndpoint.params.map((p, i) => (
                      <tr key={p.name} style={{ borderBottom: i < activeEndpoint.params.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <td style={{ padding: '10px 16px' }}><code style={{ color: '#41d1ff', fontFamily: 'monospace', fontSize: 13 }}>{p.name}</code></td>
                        <td style={{ padding: '10px 16px' }}><span style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{p.type}</span></td>
                        <td style={{ padding: '10px 16px' }}>
                          {p.required
                            ? <span style={{ color: '#F87171', fontSize: 12, fontWeight: 600 }}>Ya</span>
                            : <span style={{ color: '#475569', fontSize: 12 }}>Opsional</span>
                          }
                        </td>
                        <td style={{ padding: '10px 16px', color: '#94A3B8', fontSize: 13 }}>{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Request Body */}
          {activeEndpoint.bodyExample && (
            <section style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#41d1ff' }}>📤</span> Request Body
              </h3>
              <CodeBlock title="application/json" content={activeEndpoint.bodyExample} lang="json" />
            </section>
          )}

          {/* cURL Example */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#41d1ff' }}>💻</span> cURL
              </h3>
              <button
                onClick={handleCopyUrl}
                style={{ background: 'rgba(65,209,255,0.1)', border: '1px solid rgba(65,209,255,0.3)', color: '#41d1ff', fontSize: 12, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {copiedCurl ? '✓ Disalin!' : '📋 Salin'}
              </button>
            </div>
            <CodeBlock title="bash" content={buildCurl(activeEndpoint)} lang="bash" />
          </section>

          {/* Response */}
          <section style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#10B981' }}>📥</span> Response{' '}
              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700 }}>200 OK</span>
            </h3>
            <CodeBlock title="application/json" content={activeEndpoint.responseExample} lang="json" />
          </section>
        </main>
      </div>

      {/* ── STATUS FOOTER ── */}
      <footer style={{ background: '#0A0F1A', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#475569', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', display: 'inline-block' }} />
            <span style={{ color: '#10B981', fontWeight: 600 }}>Semua Sistem Operasional</span>
          </span>
          <span>API v1.0.0</span>
          <span>REST · JSON · JWT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span>© 2025 Gentong Mas ERP</span>
          <a href="#" style={{ color: '#41d1ff', textDecoration: 'none' }}>Swagger UI</a>
          <a href="#" style={{ color: '#41d1ff', textDecoration: 'none' }}>Postman Collection</a>
        </div>
      </footer>
    </div>
  );
}

function CodeBlock({ title, content, lang }: { title: string; content: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ background: '#0A0F1A', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{title}</span>
        <button
          onClick={handleCopy}
          style={{ background: 'none', border: 'none', color: copied ? '#10B981' : '#475569', cursor: 'pointer', fontSize: 11, padding: '2px 6px' }}
        >
          {copied ? '✓ Disalin' : '📋'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '16px 18px', overflowX: 'auto', fontSize: 12.5, lineHeight: 1.7, color: '#CBD5E1', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
        <code>{content}</code>
      </pre>
    </div>
  );
}
