'use client';
import { useEffect, useState } from 'react';
import DriverBottomNav from '@/components/DriverBottomNav';

function getDriverToken() { return typeof window !== 'undefined' ? (localStorage.getItem('driver_token') || localStorage.getItem('gm_auth_token') || '') : ''; }

interface Doc {
  id: string;
  fileName?: string;
  documentType?: string;
  url?: string;
  shipmentRef?: string;
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  bill_of_lading: 'Bill of Lading',
  proof_of_delivery: 'Bukti Pengiriman',
  rate_confirmation: 'Rate Confirmation',
  photo: 'Foto',
  other: 'Lainnya',
};

const TYPE_ICON: Record<string, string> = {
  bill_of_lading: 'receipt_long',
  proof_of_delivery: 'task_alt',
  rate_confirmation: 'attach_money',
  photo: 'photo_camera',
  other: 'description',
};

export default function DriverDocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await fetch('/api/v1/driver-portal/documents', {
          headers: { Authorization: `Bearer ${getDriverToken()}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal memuat dokumen');
        setDocs(json.data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <div style={{ minHeight: '100vh', background: '#f5f5f5', maxWidth: 480, margin: '0 auto', fontFamily: 'Inter, Roboto, sans-serif' }}>
        <div style={{ background: 'linear-gradient(135deg, #c62828, #e53935)', padding: '20px 16px 28px', color: '#fff' }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Dokumen Saya</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.75 }}>Semua dokumen pengiriman Anda</p>
        </div>

        <div style={{ padding: '16px 16px 80px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9e9e9e' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #e53935', borderTopColor: 'transparent', borderRadius: 18, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Memuat dokumen...
            </div>
          )}

          {error && (
            <div style={{ background: '#ffebee', borderRadius: 12, padding: 16, color: '#b71c1c', fontSize: 13 }}>{error}</div>
          )}

          {!loading && !error && docs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9e9e9e' }}>
              <span className="material-icons" style={{ fontSize: 48, display: 'block', marginBottom: 12, color: '#e0e0e0' }}>folder_open</span>
              <div style={{ fontWeight: 500 }}>Belum ada dokumen</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Dokumen akan muncul setelah pengiriman selesai</div>
            </div>
          )}

          {docs.map(doc => {
            const icon = TYPE_ICON[doc.documentType || ''] || 'description';
            const label = TYPE_LABEL[doc.documentType || ''] || doc.documentType || 'Dokumen';
            return (
              <div key={doc.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-icons" style={{ color: '#1976d2', fontSize: 22 }}>{icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#212121' }}>{label}</div>
                  {doc.shipmentRef && <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 2 }}>{doc.shipmentRef}</div>}
                  <div style={{ fontSize: 11, color: '#bdbdbd', marginTop: 2 }}>
                    {new Date(doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noreferrer" style={{ width: 36, height: 36, borderRadius: 8, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1976d2', textDecoration: 'none' }}>
                    <span className="material-icons" style={{ fontSize: 18 }}>download</span>
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <DriverBottomNav />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  );
}
