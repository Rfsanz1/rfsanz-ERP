'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

function getDriverToken() { return typeof window !== 'undefined' ? (localStorage.getItem('driver_token') || localStorage.getItem('gm_auth_token') || '') : ''; }

const STEPS = [
  { status: 'booked',     label: 'Booked',   icon: 'schedule' },
  { status: 'pickup',     label: 'Pickup',   icon: 'directions_car' },
  { status: 'picked_up',  label: 'Diambil',  icon: 'inventory_2' },
  { status: 'in_transit', label: 'Transit',  icon: 'local_shipping' },
  { status: 'delivered',  label: 'Terkirim', icon: 'check_circle' },
];

const STATUS_NEXT: Record<string, { label: string; next: string; icon: string; color: string }> = {
  booked:     { label: 'Menuju Lokasi Pickup', next: 'pickup',     icon: 'directions_car',   color: '#1976d2' },
  pickup:     { label: 'Konfirmasi Ambil Paket', next: 'picked_up',  icon: 'inventory_2',     color: '#f57c00' },
  picked_up:  { label: 'Mulai Antar Paket',    next: 'in_transit', icon: 'local_shipping',   color: '#7b1fa2' },
  in_transit: { label: 'Paket Sudah Diterima', next: 'delivered',  icon: 'check_circle',     color: '#388e3c' },
};

const mapBtnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 16, padding: 16,
  marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};
const cardTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: '#212121',
  marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f5f5f5',
};

function openGoogleMaps(addr: string, city?: string) {
  const q = encodeURIComponent([addr, city].filter(Boolean).join(', '));
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
}
function openWaze(addr: string, city?: string) {
  const q = encodeURIComponent([addr, city].filter(Boolean).join(', '));
  window.open(`https://waze.com/ul?q=${q}&navigate=yes`, '_blank');
}
function callPhone(phone: string) { window.open(`tel:${phone}`, '_self'); }

export default function DriverTaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const loadId = params?.loadId as string;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);

  const [load, setLoad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'bukti' | 'tanda_tangan'>('info');
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapTarget, setMapTarget] = useState<{ addr: string; city?: string; label: string } | null>(null);

  const token = getDriverToken();
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

  useEffect(() => { if (loadId) fetchLoad(); }, [loadId]);

  async function fetchLoad() {
    try {
      const res = await fetch(`/api/v1/driver-portal/loads/${loadId}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memuat detail');
      setLoad(json.data);
      const docRes = await fetch(`/api/v1/driver-portal/loads/${loadId}/documents`, { headers });
      const docJson = await docRes.json();
      if (docRes.ok) setUploadedDocs(docJson.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  }

  async function updateStatus() {
    if (!load?.shipment?.status) return;
    const action = STATUS_NEXT[load.shipment.status];
    if (!action) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/v1/driver-portal/loads/${loadId}/status`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action.next, note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal update status');
      showSuccess(`✓ Status diperbarui: ${action.label}`);
      await fetchLoad();
      setNote('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = '';
  }

  function removePhoto(idx: number) {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function uploadPhotos() {
    if (photos.length === 0) return;
    setUploadingPhotos(true);
    try {
      for (const p of photos) {
        const formData = new FormData();
        formData.append('file', p.file);
        formData.append('documentType', 'proof_of_delivery');
        const res = await fetch(`/api/v1/driver-portal/loads/${loadId}/documents`, {
          method: 'POST', headers, body: formData,
        });
        if (!res.ok) {
          const j = await res.json();
          throw new Error(j.error || 'Gagal upload foto');
        }
      }
      showSuccess(`✓ ${photos.length} foto berhasil dikirim!`);
      setPhotos([]);
      await fetchLoad();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingPhotos(false);
    }
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    setDrawing(true);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const cx = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    ctx.beginPath();
    ctx.moveTo((cx - rect.left) * sx, (cy - rect.top) * sy);
  }

  function draw(e: React.TouchEvent | React.MouseEvent) {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const cx = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1a1a2e';
    ctx.lineTo((cx - rect.left) * sx, (cy - rect.top) * sy);
    ctx.stroke();
    setHasSig(true);
  }

  function clearCanvas() {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    setDrawing(false);
  }

  async function saveSignature() {
    const canvas = canvasRef.current;
    if (!canvas || !hasSig) return;
    setUpdating(true);
    try {
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'));
      const formData = new FormData();
      formData.append('signature', blob, 'signature.png');
      if (recipientName) formData.append('recipientName', recipientName);
      const stopId = load?.shipment?.stops?.find((s: any) => s.type === 'delivery')?.id;
      if (!stopId) throw new Error('Stop pengiriman tidak ditemukan');
      const res = await fetch(`/api/v1/driver-portal/stops/${stopId}/signature`, {
        method: 'POST', headers, body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal simpan tanda tangan');
      showSuccess('✓ Tanda tangan berhasil disimpan!');
      clearCanvas();
      setRecipientName('');
      await fetchLoad();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, background: '#f4f6f8' }}>
      <div style={{ width: 44, height: 44, borderRadius: 22, border: '3px solid #e53935', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: '#9e9e9e', fontSize: 13 }}>Memuat detail pengiriman...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error && !load) return (
    <div style={{ padding: 24, textAlign: 'center', background: '#f4f6f8', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
      <div style={{ color: '#b71c1c', fontSize: 14, marginBottom: 16 }}>{error}</div>
      <button onClick={() => router.push('/driver')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#e53935', color: '#fff', fontSize: 14, cursor: 'pointer' }}>Kembali</button>
    </div>
  );

  const ship = load?.shipment || {};
  const action = STATUS_NEXT[ship.status];
  const currentStepIdx = STEPS.findIndex(s => s.status === ship.status);
  const destAddr = ship.destinationAddress || [ship.destinationCity, ship.destinationState].filter(Boolean).join(', ') || '';
  const originAddr = ship.originAddress || [ship.originCity, ship.originState].filter(Boolean).join(', ') || '';

  const TABS = [
    { key: 'info', label: 'Info', icon: 'info' },
    { key: 'bukti', label: 'Bukti Foto', icon: 'photo_camera' },
    { key: 'tanda_tangan', label: 'Tanda Tangan', icon: 'draw' },
  ] as const;

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <div style={{ paddingBottom: 100, background: '#f4f6f8', minHeight: '100vh', fontFamily: 'Inter, Roboto, sans-serif', maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #c62828, #e53935)', padding: '14px 16px 20px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <button onClick={() => router.push('/driver')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
              <span className="material-icons" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{ship.referenceNumber || `SHP-${(load?.shipmentId || '').slice(0, 8).toUpperCase()}`}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Detail Pengiriman</div>
            </div>
          </div>
          {/* Progress steps */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {STEPS.map((step, i) => {
              const done = i < currentStepIdx;
              const active = i === currentStepIdx;
              return (
                <React.Fragment key={step.status}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: i < STEPS.length - 1 ? 0 : 1 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 14, background: done || active ? '#fff' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: active ? '2px solid #fff' : 'none' }}>
                      <span className="material-icons" style={{ fontSize: 15, color: done || active ? '#e53935' : 'rgba(255,255,255,0.5)' }}>{done ? 'check' : step.icon}</span>
                    </div>
                    <div style={{ fontSize: 9, marginTop: 4, textAlign: 'center', color: done || active ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: active ? 700 : 400, maxWidth: 48 }}>{step.label}</div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, margin: '0 2px', background: i < currentStepIdx ? '#fff' : 'rgba(255,255,255,0.3)', marginBottom: 18 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Toasts */}
        {successMsg && (
          <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', background: '#1b5e20', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxWidth: 340, textAlign: 'center' }}>
            {successMsg}
          </div>
        )}
        {error && (
          <div style={{ background: '#ffebee', margin: '10px 16px', padding: '12px 16px', borderRadius: 12, color: '#b71c1c', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-icons" style={{ fontSize: 18 }}>error</span>
            {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#b71c1c' }}>
              <span className="material-icons" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>
        )}

        <div style={{ padding: '12px 16px 0' }}>
          {/* Origin card */}
          <div style={{ ...cardStyle }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: '#fff3e0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-icons" style={{ color: '#f57c00', fontSize: 20 }}>store</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#f57c00', fontWeight: 700, marginBottom: 2 }}>LOKASI PICKUP</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#212121' }}>
                  {ship.originLocationName || [ship.originCity, ship.originState].filter(Boolean).join(', ') || 'N/A'}
                </div>
                {ship.originAddress && <div style={{ fontSize: 12, color: '#757575', marginTop: 2 }}>{ship.originAddress}</div>}
                {ship.originContactName && (
                  <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-icons" style={{ fontSize: 14 }}>person</span>
                    {ship.originContactName}{ship.originContactPhone && ` • ${ship.originContactPhone}`}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => { setMapTarget({ addr: originAddr, city: ship.originCity, label: 'Lokasi Pickup' }); setShowMapModal(true); }} style={{ ...mapBtnStyle, background: '#e3f2fd', color: '#1976d2' }}>
                  <span className="material-icons" style={{ fontSize: 16 }}>map</span>
                </button>
                {ship.originContactPhone && (
                  <button onClick={() => callPhone(ship.originContactPhone)} style={{ ...mapBtnStyle, background: '#e8f5e9', color: '#388e3c' }}>
                    <span className="material-icons" style={{ fontSize: 16 }}>call</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Destination card */}
          <div style={{ ...cardStyle, border: '1.5px solid #1976d222' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: '#e3f2fd', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-icons" style={{ color: '#1976d2', fontSize: 20 }}>location_on</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#1976d2', fontWeight: 700, marginBottom: 2 }}>TUJUAN PENGIRIMAN</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#212121' }}>
                  {ship.destinationLocationName || [ship.destinationCity, ship.destinationState].filter(Boolean).join(', ') || 'N/A'}
                </div>
                {ship.destinationAddress && <div style={{ fontSize: 12, color: '#757575', marginTop: 2 }}>{ship.destinationAddress}</div>}
                {ship.customerName && (
                  <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-icons" style={{ fontSize: 14 }}>business</span>
                    {ship.customerName}{ship.customerPhone && ` • ${ship.customerPhone}`}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => { setMapTarget({ addr: destAddr, city: ship.destinationCity, label: 'Tujuan' }); setShowMapModal(true); }} style={{ ...mapBtnStyle, background: '#e3f2fd', color: '#1976d2' }}>
                  <span className="material-icons" style={{ fontSize: 16 }}>map</span>
                </button>
                {ship.customerPhone && (
                  <button onClick={() => callPhone(ship.customerPhone)} style={{ ...mapBtnStyle, background: '#e8f5e9', color: '#388e3c' }}>
                    <span className="material-icons" style={{ fontSize: 16 }}>call</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action button */}
          {action && (
            <div style={{ ...cardStyle }}>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Catatan (opsional)..."
                rows={2}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 13, resize: 'none', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'inherit' }}
              />
              <button
                onClick={updateStatus}
                disabled={updating}
                style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: updating ? '#e0e0e0' : `linear-gradient(135deg, ${action.color}, ${action.color}cc)`, color: updating ? '#9e9e9e' : '#fff', fontSize: 14, fontWeight: 700, cursor: updating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: updating ? 'none' : '0 4px 14px rgba(0,0,0,0.2)' }}
              >
                <span className="material-icons" style={{ fontSize: 18 }}>{action.icon}</span>
                {updating ? 'Memproses...' : action.label}
              </button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 12 }}>
            {TABS.map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{ flex: 1, padding: '12px 8px', border: 'none', background: activeTab === tab.key ? '#e53935' : '#fff', color: activeTab === tab.key ? '#fff' : '#757575', fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 500, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, borderRight: i < TABS.length - 1 ? '1px solid #f5f5f5' : 'none' }}
              >
                <span className="material-icons" style={{ fontSize: 18 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Info */}
          {activeTab === 'info' && (
            <div style={cardStyle}>
              {ship.scheduledPickup && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                  <span style={{ color: '#9e9e9e' }}>Jadwal Pickup</span>
                  <span style={{ fontWeight: 500 }}>{new Date(ship.scheduledPickup).toLocaleString('id-ID')}</span>
                </div>
              )}
              {ship.scheduledDelivery && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                  <span style={{ color: '#9e9e9e' }}>Jadwal Antar</span>
                  <span style={{ fontWeight: 500 }}>{new Date(ship.scheduledDelivery).toLocaleString('id-ID')}</span>
                </div>
              )}
              {ship.totalWeight && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                  <span style={{ color: '#9e9e9e' }}>Berat Total</span>
                  <span style={{ fontWeight: 500 }}>{ship.totalWeight} kg</span>
                </div>
              )}
            </div>
          )}

          {/* Tab: Bukti Foto */}
          {activeTab === 'bukti' && (
            <div>
              <div style={cardStyle}>
                <div style={cardTitle}>Upload Bukti Foto</div>
                <label style={{ display: 'block', padding: '20px', border: '2px dashed #e0e0e0', borderRadius: 12, textAlign: 'center', cursor: 'pointer', marginBottom: photos.length > 0 ? 12 : 0 }}>
                  <span className="material-icons" style={{ fontSize: 32, color: '#9e9e9e', display: 'block', marginBottom: 6 }}>add_a_photo</span>
                  <span style={{ fontSize: 13, color: '#9e9e9e' }}>Tap untuk ambil foto</span>
                  <input type="file" accept="image/*" multiple capture="environment" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                </label>
                {photos.length > 0 && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                      {photos.map((p, idx) => (
                        <div key={idx} style={{ position: 'relative', paddingBottom: '100%', borderRadius: 10, overflow: 'hidden', background: '#f0f0f0' }}>
                          <img src={p.preview} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 99, color: '#fff', cursor: 'pointer', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-icons" style={{ fontSize: 14 }}>close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={uploadPhotos} disabled={uploadingPhotos} style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: uploadingPhotos ? '#e0e0e0' : 'linear-gradient(135deg, #1976d2, #1565c0)', color: uploadingPhotos ? '#9e9e9e' : '#fff', fontSize: 14, fontWeight: 700, cursor: uploadingPhotos ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxSizing: 'border-box' }}>
                      <span className="material-icons">{uploadingPhotos ? 'hourglass_empty' : 'cloud_upload'}</span>
                      {uploadingPhotos ? 'Mengirim...' : `Kirim ${photos.length} Foto Bukti`}
                    </button>
                  </>
                )}
              </div>
              {uploadedDocs.length > 0 && (
                <div style={cardStyle}>
                  <div style={cardTitle}>Foto Terkirim ({uploadedDocs.length})</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {uploadedDocs.filter(d => d.mimeType?.startsWith('image/') || d.url).map((doc: any) => (
                      <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" style={{ display: 'block', paddingBottom: '100%', borderRadius: 10, overflow: 'hidden', position: 'relative', textDecoration: 'none', background: '#f0f0f0' }}>
                        {doc.url && doc.mimeType?.startsWith('image/') ? (
                          <img src={doc.url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <span className="material-icons" style={{ color: '#9e9e9e', fontSize: 28 }}>description</span>
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Tanda Tangan */}
          {activeTab === 'tanda_tangan' && (
            <div style={cardStyle}>
              <div style={cardTitle}>Tanda Tangan Penerima</div>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: '#9e9e9e', lineHeight: 1.5 }}>
                Minta penerima menandatangani di kolom di bawah sebagai konfirmasi penerimaan paket.
              </p>
              <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Nama penerima (opsional)" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 13, boxSizing: 'border-box', marginBottom: 12, outline: 'none', fontFamily: 'inherit' }} />
              <div style={{ border: '2px solid #e0e0e0', borderRadius: 14, overflow: 'hidden', background: '#fafafa', touchAction: 'none', position: 'relative' }}>
                <canvas
                  ref={canvasRef}
                  width={600} height={220}
                  style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setDrawing(false)}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => setDrawing(false)}
                />
                {!hasSig && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ textAlign: 'center', color: '#c5c5c5' }}>
                      <span className="material-icons" style={{ fontSize: 36, display: 'block', marginBottom: 4 }}>gesture</span>
                      <div style={{ fontSize: 12 }}>Tanda tangan di sini</div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={clearCanvas} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1.5px solid #e0e0e0', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#757575', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span className="material-icons" style={{ fontSize: 18 }}>refresh</span>Ulangi
                </button>
                <button onClick={saveSignature} disabled={!hasSig || updating} style={{ flex: 2, padding: 12, borderRadius: 12, background: !hasSig || updating ? '#e0e0e0' : 'linear-gradient(135deg, #2e7d32, #43a047)', color: !hasSig || updating ? '#9e9e9e' : '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: !hasSig || updating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span className="material-icons" style={{ fontSize: 18 }}>save</span>
                  {updating ? 'Menyimpan...' : 'Simpan Tanda Tangan'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Map Modal */}
        {showMapModal && mapTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 1000 }} onClick={() => setShowMapModal(false)}>
            <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px' }} onClick={e => e.stopPropagation()}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e0e0e0', margin: '0 auto 20px' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#212121', marginBottom: 4 }}>Buka Navigasi</div>
              <div style={{ fontSize: 12, color: '#9e9e9e', marginBottom: 20 }}>{mapTarget.label}: {mapTarget.addr}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => { openGoogleMaps(mapTarget.addr, mapTarget.city); setShowMapModal(false); }} style={{ width: '100%', padding: 15, border: 'none', borderRadius: 14, background: '#4285F4', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span className="material-icons">map</span>Buka di Google Maps
                </button>
                <button onClick={() => { openWaze(mapTarget.addr, mapTarget.city); setShowMapModal(false); }} style={{ width: '100%', padding: 15, border: 'none', borderRadius: 14, background: '#33CCFF', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span className="material-icons">navigation</span>Buka di Waze
                </button>
                <button onClick={() => setShowMapModal(false)} style={{ width: '100%', padding: 14, border: '1.5px solid #e0e0e0', borderRadius: 14, background: '#fff', color: '#757575', fontSize: 15, cursor: 'pointer' }}>Batal</button>
              </div>
            </div>
          </div>
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  );
}
