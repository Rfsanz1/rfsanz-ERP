'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, RefreshCw, Plus, MapPin, Phone, Link2, User } from 'lucide-react';

const C = '#00ACC1';
const PURPLE = '#6366F1';

export default function CustomersPage() {
  const router = useRouter();
  const [rows, setRows]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [source, setSource]       = useState<'merged' | 'kledo' | 'local'>('merged');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const localRes = await api.get('/customers?limit=500').catch(() => null);
      const localRaw: any[] = (() => {
        if (!localRes) return [];
        const d = localRes.data;
        return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      })();

      const localList = localRaw.map((c: any) => ({
        id: String(c.id),
        name: c.name ?? '',
        phone: c.phone ?? c.noHp ?? '',
        email: c.email ?? '',
        city: c.city ?? c.kota ?? '',
        address: c.address ?? c.alamat ?? '',
        kledoId: c.kledoId ?? c.kledo_id ?? null,
        totalTransaction: Number(c.totalTransaction ?? c.total ?? 0),
        lastOrderDate: c.lastOrderDate ?? c.updatedAt ?? '',
        source: 'local' as const,
      }));

      setRows(localList);
      setSource('local');
    } catch {
      setRows([]); setSource('local');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Debounced search — query kledo-search route when user types */
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!search.trim()) { setSearchResults(null); setSearching(false); return; }

    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(search.trim());
        const [localFiltered, kledoRes] = await Promise.all([
          Promise.resolve(
            rows.filter(r =>
              (r.name + (r.phone ?? '') + (r.city ?? '') + (r.email ?? ''))
                .toLowerCase().includes(search.toLowerCase()),
            ),
          ),
          fetch(`/api/direct/kledo-search?type=contacts&q=${q}`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        ]);

        const kledoList: any[] = (kledoRes?.success ? kledoRes.data ?? [] : []).map((c: any) => ({
          id: c.id,
          name: c.name ?? '',
          phone: c.phone ?? '',
          email: c.email ?? '',
          city: '',
          address: '',
          kledoId: String(c.kledoId ?? ''),
          totalTransaction: 0,
          lastOrderDate: '',
          source: 'kledo' as const,
        }));

        const localNames = new Set(localFiltered.map((r: any) => r.name.toLowerCase().trim()));
        const dedupedKledo = kledoList.filter(c => !localNames.has(c.name.toLowerCase().trim()));
        setSearchResults([...localFiltered, ...dedupedKledo]);
      } catch {
        setSearchResults(null);
      } finally { setSearching(false); }
    }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = search.trim()
    ? (searchResults ?? rows.filter(r =>
        (r.name + (r.phone ?? '') + (r.city ?? '') + (r.email ?? ''))
          .toLowerCase().includes(search.toLowerCase()),
      ))
    : rows;

  const formatRp = (v: number) =>
    v >= 1e9 ? `Rp ${(v / 1e9).toFixed(1)} M` :
    v >= 1e6 ? `Rp ${(v / 1e6).toFixed(1)} Jt` :
    `Rp ${Number(v).toLocaleString('id-ID')}`;

  const formatDate = (v: string) =>
    v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

  const localCount = rows.filter(r => r.source === 'local').length;
  const kledoCount = rows.filter(r => r.source === 'kledo').length;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Pelanggan</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {localCount} lokal + {kledoCount} dari Kledo · total {rows.length}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: C, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Pelanggan
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama / telepon / kota…"
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>Memuat pelanggan…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>Pelanggan tidak ditemukan</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {filtered.map(r => {
            const accent = r.source === 'kledo' ? PURPLE : C;
            return (
              <div key={r.id}
                onClick={() => router.push(`/sales/customers/${r.id}`)}
                style={{ backgroundColor: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', padding: 18, cursor: 'pointer', transition: 'all .18s', position: 'relative' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = accent; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${accent}18`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
              >
                {/* Source badge */}
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  {r.source === 'kledo' ? (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: PURPLE, background: PURPLE + '12', border: `1px solid ${PURPLE}25` }}>
                      <Link2 size={8} style={{ display: 'inline', marginRight: 2 }} />Kledo
                    </span>
                  ) : (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: C, background: C + '12', border: `1px solid ${C}25` }}>
                      ERP
                    </span>
                  )}
                </div>

                {/* Avatar + nama */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingRight: 40 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${accent}28, ${accent}12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                    {r.name?.charAt(0).toUpperCase() ?? <User size={18} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
                    {r.city && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={10} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Telepon */}
                {r.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Phone size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.phone}</span>
                  </div>
                )}

                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.04em' }}>Total Transaksi</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: accent, margin: 0 }}>{r.totalTransaction > 0 ? formatRp(r.totalTransaction) : '–'}</p>
                  </div>
                  {r.lastOrderDate && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.04em' }}>Order Terakhir</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>{formatDate(r.lastOrderDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
