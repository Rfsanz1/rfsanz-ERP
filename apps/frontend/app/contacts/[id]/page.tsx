'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import ContactStatement from '../../../components/contacts/ContactStatement';
import { api } from '../../../lib/api';
import { ArrowLeft, Edit2, User, MapPin, Building2, CreditCard, FileText, BarChart2, History } from 'lucide-react';

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  customer: { label: 'Pelanggan', color: '#1976D2' },
  supplier: { label: 'Pemasok',   color: '#388E3C' },
  both:     { label: 'Keduanya',  color: '#7B1FA2' },
  employee: { label: 'Karyawan',  color: '#F57C00' },
  other:    { label: 'Lainnya',   color: '#616161' },
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

type Tab = 'info' | 'transactions' | 'statement' | 'history';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <span style={{ fontSize: 12, width: 128, flexShrink: 0, fontWeight: 500, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{value || '–'}</span>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function ContactDetailPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  const { id }    = useParams<{ id: string }>();
  const [contact, setContact]   = useState<any>(null);
  const [txData, setTxData]     = useState<any>(null);
  const [stmtData, setStmtData] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<Tab>('info');

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  useEffect(() => {
    if (!token || !id) return;
    api.get(`/contacts/${id}`)
      .then(r => setContact(r.data))
      .catch(() => router.push('/contacts'))
      .finally(() => setLoading(false));
  }, [token, id]);

  const loadTransactions = async () => {
    if (txData) return;
    try { const r = await api.get(`/contacts/${id}/transactions`); setTxData(r.data); } catch {}
  };
  const loadStatement = async () => {
    if (stmtData) return;
    try { const r = await api.get(`/contacts/${id}/statement`); setStmtData(r.data); } catch {}
  };
  const handleTab = (t: Tab) => {
    setTab(t);
    if (t === 'transactions') loadTransactions();
    if (t === 'statement') loadStatement();
  };

  if (!token) return null;

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'info',         label: 'Info',          icon: User },
    { key: 'transactions', label: 'Transaksi',      icon: FileText },
    { key: 'statement',    label: 'Hutang-Piutang', icon: BarChart2 },
    { key: 'history',      label: 'Riwayat',        icon: History },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: 1100 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/contacts')}
              style={{ padding: 8, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: '#6366F1', cursor: 'pointer', display: 'flex' }}>
              <ArrowLeft size={15} />
            </button>
            {contact && (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{contact.name}</h1>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.10)', color: '#6366F1' }}>{contact.code}</span>
                  {(contact.type || []).map((t: string) => {
                    const cfg = TYPE_BADGE[t] ?? TYPE_BADGE.other;
                    return (
                      <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: cfg.color, background: cfg.color + '18' }}>{cfg.label}</span>
                    );
                  })}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{contact.email || contact.phone || 'Tidak ada info kontak'}</p>
              </div>
            )}
          </div>
          {contact && (
            <button onClick={() => router.push(`/contacts/${id}/edit`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Edit2 size={13} /> Edit
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Memuat data…</div>
        ) : contact && (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 3, padding: 4, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', width: 'fit-content' }}>
              {TABS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => handleTab(key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .15s',
                    background: tab === key ? '#6366F1' : 'transparent',
                    color: tab === key ? '#fff' : 'var(--text-muted)' }}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {/* Info tab */}
            {tab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Info Dasar', icon: User, rows: [
                    { label: 'Nama', value: contact.name },
                    { label: 'Kode', value: contact.code },
                    { label: 'Email', value: contact.email },
                    { label: 'Telepon', value: contact.phone },
                    { label: 'HP / WA', value: contact.mobile },
                    { label: 'Catatan', value: contact.notes },
                  ]},
                  { title: 'Alamat', icon: MapPin, rows: [
                    { label: 'Alamat', value: contact.address },
                    { label: 'Kota', value: contact.city },
                    { label: 'Provinsi', value: contact.province },
                    { label: 'Kode Pos', value: contact.postalCode },
                    { label: 'Negara', value: contact.country },
                  ]},
                  { title: 'Info Bisnis', icon: Building2, rows: [
                    { label: 'NPWP', value: contact.npwp },
                    { label: 'NIK', value: contact.nik },
                    { label: 'Termin', value: contact.termOfPayment === 0 ? 'Cash' : contact.termOfPayment ? `${contact.termOfPayment} hari` : undefined },
                    { label: 'Limit Kredit', value: contact.creditLimit !== undefined ? fmtCurrency(contact.creditLimit) : undefined },
                    { label: 'Diskon', value: contact.discountPercent ? `${contact.discountPercent}%` : undefined },
                    { label: 'Mata Uang', value: contact.currency },
                  ]},
                  { title: 'Bank', icon: CreditCard, rows: [
                    { label: 'Nama Bank', value: contact.bankName },
                    { label: 'No. Rekening', value: contact.bankAccountNo },
                    { label: 'Atas Nama', value: contact.bankAccountName },
                  ]},
                ].map(({ title, icon: Icon, rows }) => (
                  <div key={title} style={{ background: 'var(--surface)', borderRadius: 14, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }} className="space-y-3">
                    <div className="flex items-center gap-2" style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                      <Icon size={14} style={{ color: '#6366F1' }} />
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
                    </div>
                    {rows.map(r => <InfoRow key={r.label} label={r.label} value={r.value} />)}
                  </div>
                ))}
              </div>
            )}

            {/* Transactions tab */}
            {tab === 'transactions' && (
              <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                {!txData ? (
                  <div style={{ padding: '56px 24px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Memuat transaksi…</div>
                ) : (
                  <>
                    {txData.invoices?.length > 0 && (
                      <>
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#1976D2', margin: 0 }}>Invoice ({txData.invoices.length})</h4>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
                              {['No. Invoice','Tanggal','Total','Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {txData.invoices.map((inv: any, i: number) => (
                              <tr key={inv.id} style={{ borderBottom: i < txData.invoices.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                <td style={{ padding: '10px 20px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#1976D2' }}>{inv.noInvoice}</td>
                                <td style={{ padding: '10px 20px', fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(inv.tanggal)}</td>
                                <td style={{ padding: '10px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{fmtCurrency(Number(inv.grandTotal))}</td>
                                <td style={{ padding: '10px 20px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(25,118,210,0.10)', color: '#1976D2' }}>{inv.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                    {txData.vendorBills?.length > 0 && (
                      <>
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
                          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#E53935', margin: 0 }}>Vendor Bill ({txData.vendorBills.length})</h4>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
                              {['No. Bill','Total','Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {txData.vendorBills.map((b: any, i: number) => (
                              <tr key={b.id} style={{ borderBottom: i < txData.vendorBills.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                <td style={{ padding: '10px 20px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#E53935' }}>{b.noBill}</td>
                                <td style={{ padding: '10px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{fmtCurrency(Number(b.totalAmount))}</td>
                                <td style={{ padding: '10px 20px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(229,57,53,0.10)', color: '#E53935' }}>{b.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                    {!txData.invoices?.length && !txData.vendorBills?.length && (
                      <div style={{ padding: '56px 24px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada transaksi</div>
                    )}
                  </>
                )}
              </div>
            )}

            {tab === 'statement' && (
              stmtData
                ? <ContactStatement {...stmtData} />
                : <div style={{ padding: '56px 24px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Memuat laporan…</div>
            )}

            {tab === 'history' && (
              <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 32, textAlign: 'center', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 4px' }}>Riwayat perubahan akan tampil di sini</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, opacity: 0.7 }}>Dibuat: {fmtDate(contact.createdAt)} · Diperbarui: {fmtDate(contact.updatedAt)}</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
