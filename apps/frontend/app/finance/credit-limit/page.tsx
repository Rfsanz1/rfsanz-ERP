'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { Search, CreditCard, AlertTriangle, CheckCircle, Edit2, Save, X } from 'lucide-react';
import { api } from '../../../lib/api';

const C = ACCOUNTING_CONFIG.appColor;
const fmtIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function CreditLimitPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/finance/credit-limits', { params: { search, page, limit: 50 } });
      setCustomers(data.data ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch { setCustomers([]); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const saveLimit = async (customerId: string) => {
    setSaving(true);
    try {
      await api.post(`/finance/credit-limits/${customerId}/set`, { creditLimit: Number(editLimit) });
      setEditId(null);
      setMsg({ type: 'success', text: 'Credit limit berhasil diperbarui' });
      load();
    } catch (e: any) { setMsg({ type: 'error', text: e?.response?.data?.message || 'Gagal menyimpan' }); }
    finally { setSaving(false); }
  };

  const stats = {
    total: customers.length,
    exceeded: customers.filter(c => c.isExceeded).length,
    warning: customers.filter(c => c.isWarning && !c.isExceeded).length,
  };

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV}>
      <div style={{ padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>Credit Limit Pelanggan</h1>
            <p style={{ color: '#666', marginTop: 4 }}>Kelola batas kredit dan monitor penggunaan</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 20 }}>
            <p style={{ color: '#666', fontSize: 13 }}>Total Pelanggan</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginTop: 4 }}>{stats.total}</p>
          </div>
          <div style={{ background: 'rgba(244,67,54,.05)', borderRadius: 12, border: '1px solid rgba(244,67,54,.2)', padding: 20 }}>
            <p style={{ color: '#c62828', fontSize: 13 }}>Melebihi Limit</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#c62828', marginTop: 4 }}>{stats.exceeded}</p>
          </div>
          <div style={{ background: 'rgba(255,152,0,.05)', borderRadius: 12, border: '1px solid rgba(255,152,0,.2)', padding: 20 }}>
            <p style={{ color: '#e65100', fontSize: 13 }}>Peringatan (&gt;80%)</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#e65100', marginTop: 4 }}>{stats.warning}</p>
          </div>
        </div>

        {/* Alert */}
        {msg && (
          <div style={{ marginBottom: 16, background: msg.type === 'success' ? 'rgba(76,175,80,.1)' : 'rgba(244,67,54,.1)', border: `1px solid ${msg.type === 'success' ? '#4CAF50' : '#f44336'}`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: msg.type === 'success' ? '#2e7d32' : '#c62828', fontSize: 13 }}>{msg.text}</span>
            <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
          </div>
        )}

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', background: '#fff', marginBottom: 16, maxWidth: 400 }}>
          <Search size={16} style={{ color: '#999' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari pelanggan..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14 }} />
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
          {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Memuat...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9ff' }}>
                  {['Pelanggan','Credit Limit','Terpakai','Tersedia','Utilisasi','Status',''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#444', borderBottom: '1px solid #eee' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map(c => {
                  const pct = Math.min(100, c.pctUsed ?? 0);
                  const barColor = c.isExceeded ? '#f44336' : c.isWarning ? '#FF9800' : '#4CAF50';
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f5f5f5', background: c.isExceeded ? 'rgba(244,67,54,.02)' : 'transparent' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontWeight: 600, color: '#1a1a2e' }}>{c.name}</p>
                        <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{c.city || c.email || ''}</p>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {editId === c.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="number" value={editLimit} onChange={e => setEditLimit(e.target.value)} style={{ width: 130, border: '1px solid #ddd', borderRadius: 6, padding: '6px 10px', fontSize: 13 }} autoFocus />
                            <button onClick={() => saveLimit(c.id)} disabled={saving} style={{ background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}><Save size={12} /></button>
                            <button onClick={() => setEditId(null)} style={{ background: '#eee', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}><X size={12} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 600 }}>{Number(c.creditLimit) > 0 ? fmtIDR(Number(c.creditLimit)) : <span style={{ color: '#999' }}>Tidak ada limit</span>}</span>
                            <button onClick={() => { setEditId(c.id); setEditLimit(c.creditLimit); }} style={{ background: 'rgba(0,0,0,.05)', border: 'none', borderRadius: 4, padding: '4px 6px', cursor: 'pointer' }}><Edit2 size={12} /></button>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: Number(c.creditUsed) > 0 ? '#f44336' : '#333' }}>{fmtIDR(Number(c.creditUsed))}</td>
                      <td style={{ padding: '14px 16px', color: c.available !== null && c.available < 0 ? '#f44336' : '#4CAF50', fontWeight: 600 }}>
                        {c.available !== null ? fmtIDR(c.available) : <span style={{ color: '#999' }}>-</span>}
                      </td>
                      <td style={{ padding: '14px 16px', minWidth: 120 }}>
                        {Number(c.creditLimit) > 0 ? (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                              <span style={{ color: '#666' }}>{Math.round(pct)}%</span>
                            </div>
                            <div style={{ height: 6, background: '#eee', borderRadius: 3 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width .3s' }} />
                            </div>
                          </div>
                        ) : <span style={{ color: '#999', fontSize: 12 }}>-</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {c.isExceeded ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#c62828', fontSize: 12, fontWeight: 600 }}><AlertTriangle size={12} /> Melebihi Limit</span>
                        ) : c.isWarning ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e65100', fontSize: 12, fontWeight: 600 }}><AlertTriangle size={12} /> Peringatan</span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2e7d32', fontSize: 12 }}><CheckCircle size={12} /> Normal</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button style={{ background: 'rgba(0,0,0,.05)', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#444' }}>Cek Limit</button>
                      </td>
                    </tr>
                  );
                })}
                {customers.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#999' }}>Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
