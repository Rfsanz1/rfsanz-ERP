'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { PURCHASING_CONFIG, PURCHASING_NAV } from '../../../lib/nav-configs';
import { Scale, Star, Check, Download } from 'lucide-react';

const C = PURCHASING_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const COMPARISON_DATA = {
  product: 'Bahan Baku Plastik PP Grade A',
  qty: 500,
  uom: 'kg',
  rfq_number: 'RFQ-0003',
  suppliers: [
    { name: 'PT. Supplier Utama', price: 45000, lead_time: 3, min_qty: 100, payment_term: 'Net 30', quality_rating: 4.8, delivery_rating: 4.5, notes: 'Stok tersedia', selected: false },
    { name: 'CV. Bahan Baku Jaya', price: 42500, lead_time: 5, min_qty: 200, payment_term: 'Net 14', quality_rating: 4.3, delivery_rating: 4.7, notes: 'Perlu indent 3 hari', selected: false },
    { name: 'Distributor Nasional', price: 43000, lead_time: 2, min_qty: 50, payment_term: 'Tunai', quality_rating: 4.6, delivery_rating: 4.9, notes: 'Tersedia langsung', selected: false },
    { name: 'PT. Logistik Prima', price: 47000, lead_time: 1, min_qty: 100, payment_term: 'Net 7', quality_rating: 4.9, delivery_rating: 5.0, notes: 'Premium quality', selected: false },
  ],
};

export default function PriceComparisonPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState(COMPARISON_DATA.suppliers);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);



  const cheapest = Math.min(...suppliers.map(s => s.price));
  const fastest = Math.min(...suppliers.map(s => s.lead_time));

  const selectSupplier = (idx: number) => setSelectedIdx(idx);

  const getScore = (s: typeof suppliers[0]) => {
    const priceScore = (cheapest / s.price) * 40;
    const timeScore = (fastest / s.lead_time) * 30;
    const qualScore = (s.quality_rating / 5) * 15;
    const delivScore = (s.delivery_rating / 5) * 15;
    return Math.round(priceScore + timeScore + qualScore + delivScore);
  };

  const sortedSuppliers = [...suppliers].map((s, i) => ({ ...s, originalIdx: i, score: getScore(s) })).sort((a, b) => b.score - a.score);

  return (
    <AppShell {...PURCHASING_CONFIG} navItems={PURCHASING_NAV} activeHref="/purchasing/price-comparison">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Perbandingan Harga Supplier</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Bandingkan penawaran dari beberapa supplier untuk keputusan terbaik</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>
            <Download className="h-4 w-4" /> Export Perbandingan
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Produk</p>
              <p className="font-semibold mt-0.5" style={{ color: '#1E1B4B' }}>{COMPARISON_DATA.product}</p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Quantity</p>
              <p className="font-semibold mt-0.5" style={{ color: '#1E1B4B' }}>{COMPARISON_DATA.qty} {COMPARISON_DATA.uom}</p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>RFQ Referensi</p>
              <p className="font-semibold mt-0.5" style={{ color: C }}>{COMPARISON_DATA.rfq_number}</p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Jumlah Penawaran</p>
              <p className="font-bold text-xl mt-0.5" style={{ color: '#1E1B4B' }}>{suppliers.length} Supplier</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sortedSuppliers.map((s, i) => {
            const isSelected = selectedIdx === s.originalIdx;
            const isBest = i === 0;
            return (
              <div
                key={s.name}
                onClick={() => selectSupplier(s.originalIdx)}
                className="bg-white rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg"
                style={{
                  border: `2px solid ${isSelected ? C : isBest ? '#4CAF50' : '#EDE8F5'}`,
                  boxShadow: isSelected ? `0 4px 16px ${C}25` : isBest ? '0 4px 16px rgba(76,175,80,.15)' : '0 1px 4px rgba(47,43,61,.06)',
                }}
              >
                {isBest && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-3 w-3" style={{ color: '#FF9800' }} />
                    <span className="text-[10px] font-bold" style={{ color: '#FF9800' }}>REKOMENDASI</span>
                  </div>
                )}
                <p className="font-bold text-sm" style={{ color: '#1E1B4B' }}>{s.name}</p>
                <p className="text-xl font-bold mt-2" style={{ color: C }}>{fmt(s.price)}<span className="text-xs font-normal" style={{ color: '#9CA3AF' }}>/kg</span></p>
                <p className="text-xs mt-1" style={{ color: '#1E1B4B' }}>Total: <span className="font-bold">{fmt(s.price * COMPARISON_DATA.qty)}</span></p>

                <div className="space-y-1 mt-3 pt-3" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#9CA3AF' }}>Lead Time</span>
                    <span className="font-semibold" style={{ color: s.lead_time === fastest ? '#4CAF50' : '#1E1B4B' }}>{s.lead_time} hari</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#9CA3AF' }}>Min. Order</span>
                    <span className="font-semibold" style={{ color: '#1E1B4B' }}>{s.min_qty} {COMPARISON_DATA.uom}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#9CA3AF' }}>Payment</span>
                    <span className="font-semibold" style={{ color: '#1E1B4B' }}>{s.payment_term}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#9CA3AF' }}>Rating Mutu</span>
                    <span className="font-semibold" style={{ color: '#FF9800' }}>★ {s.quality_rating}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>Skor</span>
                    <span className="text-lg font-bold" style={{ color: isBest ? '#4CAF50' : C }}>{s.score}</span>
                  </div>
                  <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: '#EDE8F5' }}>
                    <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: isBest ? '#4CAF50' : C }} />
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold" style={{ color: C }}>
                    <Check className="h-3.5 w-3.5" /> Dipilih
                  </div>
                )}
                {s.notes && <p className="text-xs mt-2 italic" style={{ color: '#9CA3AF' }}>{s.notes}</p>}
              </div>
            );
          })}
        </div>

        {selectedIdx !== null && (
          <div className="bg-white rounded-2xl p-5" style={{ border: `2px solid ${C}`, boxShadow: `0 4px 16px ${C}20` }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold" style={{ color: '#1E1B4B' }}>Supplier Terpilih: {suppliers[selectedIdx].name}</h3>
                <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Total: {fmt(suppliers[selectedIdx].price * COMPARISON_DATA.qty)} • Lead Time: {suppliers[selectedIdx].lead_time} hari</p>
              </div>
              <button className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                Buat Purchase Order
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
