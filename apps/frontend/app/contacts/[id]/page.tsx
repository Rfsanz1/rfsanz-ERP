'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import ContactStatement from '../../../components/contacts/ContactStatement';
import { api } from '../../../lib/api';
import { ArrowLeft, Edit2, User, MapPin, Building2, CreditCard, FileText, BarChart2, History } from 'lucide-react';

const ACCENT = '#7367F0';

const TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  customer: { label: 'Pelanggan', color: '#1976D2', bg: 'rgba(25,118,210,.1)' },
  supplier: { label: 'Pemasok',   color: '#388E3C', bg: 'rgba(56,142,60,.1)' },
  both:     { label: 'Keduanya',  color: '#7B1FA2', bg: 'rgba(123,31,162,.1)' },
  employee: { label: 'Karyawan',  color: '#F57C00', bg: 'rgba(245,124,0,.1)' },
  other:    { label: 'Lainnya',   color: '#616161', bg: 'rgba(97,97,97,.1)' },
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

type Tab = 'info' | 'transactions' | 'statement' | 'history';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs w-32 flex-shrink-0 font-medium" style={{ color: '#9CA3AF' }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{value || '–'}</span>
    </div>
  );
}

export default function ContactDetailPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<any>(null);
  const [txData, setTxData] = useState<any>(null);
  const [stmtData, setStmtData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('info');

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
    { key: 'info',         label: 'Info',           icon: User },
    { key: 'transactions', label: 'Transaksi',       icon: FileText },
    { key: 'statement',    label: 'Hutang-Piutang',  icon: BarChart2 },
    { key: 'history',      label: 'Riwayat',         icon: History },
  ];

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/contacts')}
              className="p-2 rounded-lg transition hover:bg-purple-50"
              style={{ border: '1px solid #EDE8F5', color: ACCENT }}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            {contact && (
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>{contact.name}</h1>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(115,103,240,.1)', color: ACCENT }}>{contact.code}</span>
                  {(contact.type || []).map((t: string) => {
                    const cfg = TYPE_BADGE[t] ?? TYPE_BADGE.other;
                    return <span key={t} className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>;
                  })}
                </div>
                <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{contact.email || contact.phone || 'Tidak ada info kontak'}</p>
              </div>
            )}
          </div>
          {contact && (
            <button onClick={() => router.push(`/contacts/${id}/edit`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: ACCENT }}>
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</div>
        ) : contact && (
          <>
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#F5F2FB' }}>
              {TABS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => handleTab(key)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={tab === key
                    ? { backgroundColor: 'white', color: '#1E1B4B', boxShadow: '0 1px 3px rgba(47,43,61,.1)' }
                    : { color: '#9CA3AF' }}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {tab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  <div key={title} className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                    <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid #EDE8F5' }}>
                      <Icon className="h-4 w-4" style={{ color: ACCENT }} />
                      <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>{title}</h3>
                    </div>
                    {rows.map(r => <InfoRow key={r.label} label={r.label} value={r.value} />)}
                  </div>
                ))}
              </div>
            )}

            {tab === 'transactions' && (
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                {!txData ? (
                  <div className="py-14 text-center text-sm" style={{ color: '#9CA3AF' }}>Memuat transaksi...</div>
                ) : (
                  <>
                    {txData.invoices?.length > 0 && (
                      <>
                        <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                          <h4 className="text-sm font-bold" style={{ color: '#1976D2' }}>Invoice ({txData.invoices.length})</h4>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#FDFCFF' }}>
                              {['No. Invoice', 'Tanggal', 'Total', 'Status'].map(h => (
                                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {txData.invoices.map((inv: any, i: number) => (
                              <tr key={inv.id} style={{ borderBottom: i < txData.invoices.length - 1 ? '1px solid #F5F2FB' : 'none' }}>
                                <td className="px-5 py-3 text-xs font-mono" style={{ color: '#1976D2' }}>{inv.noInvoice}</td>
                                <td className="px-5 py-3 text-xs" style={{ color: '#9CA3AF' }}>{fmtDate(inv.tanggal)}</td>
                                <td className="px-5 py-3 text-xs font-medium" style={{ color: '#1E1B4B' }}>{fmtCurrency(Number(inv.grandTotal))}</td>
                                <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(25,118,210,.1)', color: '#1976D2' }}>{inv.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                    {txData.vendorBills?.length > 0 && (
                      <>
                        <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                          <h4 className="text-sm font-bold" style={{ color: '#E53935' }}>Vendor Bill ({txData.vendorBills.length})</h4>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#FDFCFF' }}>
                              {['No. Bill', 'Total', 'Status'].map(h => (
                                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {txData.vendorBills.map((b: any, i: number) => (
                              <tr key={b.id} style={{ borderBottom: i < txData.vendorBills.length - 1 ? '1px solid #F5F2FB' : 'none' }}>
                                <td className="px-5 py-3 text-xs font-mono" style={{ color: '#E53935' }}>{b.noBill}</td>
                                <td className="px-5 py-3 text-xs font-medium" style={{ color: '#1E1B4B' }}>{fmtCurrency(Number(b.totalAmount))}</td>
                                <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(229,57,53,.1)', color: '#E53935' }}>{b.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                    {!txData.invoices?.length && !txData.vendorBills?.length && (
                      <div className="py-14 text-center text-sm" style={{ color: '#9CA3AF' }}>Belum ada transaksi</div>
                    )}
                  </>
                )}
              </div>
            )}

            {tab === 'statement' && (
              stmtData
                ? <ContactStatement {...stmtData} />
                : <div className="py-14 text-center text-sm" style={{ color: '#9CA3AF' }}>Memuat laporan...</div>
            )}

            {tab === 'history' && (
              <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1.5px solid #EDE8F5' }}>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Riwayat perubahan akan tampil di sini</p>
                <p className="text-xs mt-1" style={{ color: '#B0AAB9' }}>Dibuat: {fmtDate(contact.createdAt)} · Diperbarui: {fmtDate(contact.updatedAt)}</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
