'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { HardDrive, Download, Upload, RefreshCw, CheckCircle, Clock, AlertTriangle, Shield, Save } from 'lucide-react';

const BACKUP_HISTORY = [
  { id: 'BKP-001', type: 'Auto', date: '26 Mei 2026', time: '00:00:00', size: '284 MB', status: 'success' },
  { id: 'BKP-002', type: 'Manual', date: '25 Mei 2026', time: '14:32:00', size: '281 MB', status: 'success' },
  { id: 'BKP-003', type: 'Auto', date: '25 Mei 2026', time: '00:00:00', size: '280 MB', status: 'success' },
  { id: 'BKP-004', type: 'Auto', date: '24 Mei 2026', time: '00:00:00', size: '277 MB', status: 'success' },
  { id: 'BKP-005', type: 'Auto', date: '23 Mei 2026', time: '00:00:00', size: '275 MB', status: 'failed' },
  { id: 'BKP-006', type: 'Auto', date: '22 Mei 2026', time: '00:00:00', size: '272 MB', status: 'success' },
];

export default function BackupPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  return (
    <OdooLayout title="Backup & Restore" subtitle="Kelola backup database dan restore data sistem">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4" style={{ color: '#22C55E' }} />
              <p className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Last Backup</p>
            </div>
            <p className="font-bold" style={{ color: '#1E1B4B' }}>26 Mei 2026</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>00:00:00 · 284 MB</p>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" style={{ color: '#3B82F6' }} />
              <p className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Next Auto Backup</p>
            </div>
            <p className="font-bold" style={{ color: '#1E1B4B' }}>27 Mei 2026</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>00:00:00 · Jadwal harian</p>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4" style={{ color: '#8B5CF6' }} />
              <p className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Total Backup Tersimpan</p>
            </div>
            <p className="font-bold" style={{ color: '#1E1B4B' }}>6 file</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Retensi: 30 hari</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create Backup */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(91,82,209,.1)' }}>
                <HardDrive className="h-5 w-5" style={{ color: '#5B52D1' }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Buat Backup Manual</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Backup database lengkap sekarang</p>
              </div>
            </div>
            <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Backup mencakup seluruh data: transaksi, karyawan, produk, konfigurasi, dan semua modul ERP.</p>
            <button
              onClick={() => { setCreating(true); setTimeout(() => setCreating(false), 3000); }}
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition"
              style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}
            >
              {creating ? <><RefreshCw className="h-4 w-4 animate-spin" /> Membuat Backup...</> : <><HardDrive className="h-4 w-4" /> Buat Backup Sekarang</>}
            </button>
          </div>

          {/* Download */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(59,130,246,.1)' }}>
                <Download className="h-5 w-5" style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Download Backup Terakhir</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>BKP-001 · 284 MB · 26 Mei 2026</p>
              </div>
            </div>
            <p className="text-xs mb-4" style={{ color: '#6B7280' }}>File backup terenkripsi format .sql.gz. Simpan di lokasi aman dan terpisah dari server.</p>
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition"
              style={{ border: '1.5px solid #3B82F6', color: '#3B82F6', backgroundColor: 'rgba(59,130,246,.05)' }}
            >
              <Download className="h-4 w-4" /> Download Backup (284 MB)
            </button>
          </div>
        </div>

        {/* Restore */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#FEF2F2', border: '1.5px solid rgba(239,68,68,.3)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
            <div className="flex-1">
              <p className="font-bold text-sm mb-1" style={{ color: '#991B1B' }}>Restore Database</p>
              <p className="text-xs mb-3" style={{ color: '#DC2626' }}>⚠️ PERINGATAN: Restore akan menggantikan SELURUH data yang ada. Proses ini tidak dapat dibatalkan. Pastikan Anda memiliki backup terbaru dan sudah mendapat persetujuan dari Owner/Super Admin.</p>
              {!restoreConfirm ? (
                <button
                  onClick={() => setRestoreConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(239,68,68,.15)', color: '#DC2626', border: '1px solid rgba(239,68,68,.3)' }}
                >
                  <Upload className="h-3.5 w-3.5" /> Mulai Proses Restore
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: '#991B1B' }}>Konfirmasi Restore — Ketik "RESTORE" untuk konfirmasi:</p>
                    <input
                      type="text"
                      placeholder='Ketik "RESTORE" untuk konfirmasi'
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ border: '1px solid rgba(239,68,68,.4)', color: '#991B1B', outline: 'none' }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input type="file" accept=".sql,.gz,.zip" className="hidden" id="restore-file" />
                    <label htmlFor="restore-file" className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer" style={{ backgroundColor: 'rgba(239,68,68,.15)', color: '#DC2626', border: '1px solid rgba(239,68,68,.3)' }}>
                      <Upload className="h-3.5 w-3.5" /> Pilih File Backup
                    </label>
                    <button onClick={() => setRestoreConfirm(false)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#F5F3FF', color: '#6B7280', border: '1.5px solid #EDE9FE' }}>
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Backup History */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
            <h3 className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Riwayat Backup</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F5F3FF' }}>
                  {['ID', 'Tipe', 'Tanggal', 'Waktu', 'Ukuran', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BACKUP_HISTORY.map((b, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors" style={{ borderTop: '1px solid #F0EDF8' }}>
                    <td className="px-5 py-3 text-xs font-mono" style={{ color: '#9CA3AF' }}>{b.id}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{
                        backgroundColor: b.type === 'Auto' ? 'rgba(59,130,246,.1)' : 'rgba(91,82,209,.1)',
                        color: b.type === 'Auto' ? '#3B82F6' : '#5B52D1',
                      }}>
                        {b.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#1E1B4B' }}>{b.date}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#6B7280' }}>{b.time}</td>
                    <td className="px-5 py-3 text-xs font-semibold" style={{ color: '#1E1B4B' }}>{b.size}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: b.status === 'success' ? '#22C55E' : '#EF4444' }}>
                        {b.status === 'success' ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {b.status === 'success' ? 'Berhasil' : 'Gagal'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {b.status === 'success' && (
                        <button className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,.1)', color: '#3B82F6' }}>
                          <Download className="h-3 w-3" /> Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auto Backup Config */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
            <Shield className="h-4 w-4" style={{ color: '#5B52D1' }} /> Konfigurasi Auto Backup
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Jadwal Backup</label>
              <select className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none' }}>
                <option>Setiap hari jam 00:00</option>
                <option>Setiap hari jam 02:00</option>
                <option>Setiap minggu (Senin 00:00)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Retensi Backup</label>
              <select className="w-full rounded-xl px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none' }}>
                <option>7 hari terakhir</option>
                <option>30 hari terakhir</option>
                <option>90 hari terakhir</option>
              </select>
            </div>
          </div>
          <button className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}>
            <Save className="h-4 w-4" /> Simpan Jadwal
          </button>
        </div>
      </div>
    </OdooLayout>
  );
}
