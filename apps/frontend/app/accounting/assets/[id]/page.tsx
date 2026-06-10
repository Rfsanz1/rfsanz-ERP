'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, Badge, Button, Input, Modal, Table, PageLoader } from '@gm/ui';
import { formatRp, formatDate } from '@gm/utils';
import { ArrowLeft, Pencil, Trash2, DollarSign } from 'lucide-react';
import { createApiClient } from '@/lib/utils/api';

const api = createApiClient();

export default function AssetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const mode = searchParams.get('mode');

  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [schedule, setSchedule] = useState<any[]>([]);
  const [editing, setEditing] = useState(mode === 'edit');
  const [editForm, setEditForm] = useState<any>({});
  const [disposeModal, setDisposeModal] = useState(false);
  const [disposeData, setDisposeData] = useState({ tanggalDisposal: '', nilaiDisposal: '' });

  useEffect(() => {
    fetchAsset();
  }, [id]);

  useEffect(() => {
    if (asset && activeTab === 'schedule') {
      fetchSchedule();
    }
  }, [asset, activeTab]);

  const fetchAsset = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assets/${id}`);
      setAsset(res.data);
      setEditForm(res.data);
    } catch (err) {
      console.error('Error loading asset:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await api.get(`/assets/${id}/depreciation-schedule`);
      setSchedule(res.data.schedule);
    } catch (err) {
      console.error('Error loading schedule:', err);
    }
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/assets/${id}`, {
        name: editForm.name,
        location: editForm.location,
        serialNumber: editForm.serialNumber,
        warrantyExpiry: editForm.warrantyExpiry,
        vendor: editForm.vendor,
        note: editForm.note,
      });
      setEditing(false);
      fetchAsset();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDispose = async () => {
    try {
      await api.post(`/assets/${id}/dispose`, {
        tanggalDisposal: disposeData.tanggalDisposal,
        nilaiDisposal: Number(disposeData.nilaiDisposal),
      });
      setDisposeModal(false);
      fetchAsset();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <PageLoader />;
  if (!asset) return <div className="p-6">Aset tidak ditemukan</div>;

  const acquisitionValue = asset.acquisitionValue || asset.nilaiPerolehan;
  const currentBookValue = asset.currentBookValue;
  const accumulatedDep = asset.accumulatedDep;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{asset.name || asset.nama}</h1>
            <Badge variant={asset.status === 'ACTIVE' ? 'success' : asset.status === 'SOLD' ? 'info' : 'danger'}>
              {asset.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 font-mono mt-1">{asset.code || asset.kode}</p>
        </div>
        {asset.status === 'ACTIVE' && !editing && (
          <div className="flex gap-2">
            <Button
              icon={<Pencil size={16} />}
              variant="outline"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            <Button
              icon={<DollarSign size={16} />}
              variant="danger"
              onClick={() => setDisposeModal(true)}
            >
              Dispose
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Nilai Perolehan">
          <p className="text-2xl font-bold">{formatRp(acquisitionValue)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatDate(asset.acquisitionDate || asset.tanggalPerolehan)}</p>
        </Card>
        <Card title="Akum. Depresiasi">
          <p className="text-2xl font-bold">{formatRp(accumulatedDep)}</p>
          <p className="text-xs text-gray-500 mt-1">{((accumulatedDep / acquisitionValue) * 100).toFixed(1)}%</p>
        </Card>
        <Card title="Nilai Buku">
          <p className="text-2xl font-bold">{formatRp(currentBookValue)}</p>
          <p className="text-xs text-gray-500 mt-1">Nilai saat ini</p>
        </Card>
        <Card title="Sisa Umur">
          <p className="text-2xl font-bold">
            {Math.max(0, (asset.usefulLifeMonths || asset.umurEkonomi) - Math.floor(accumulatedDep / (acquisitionValue / (asset.usefulLifeMonths || 60))))}
          </p>
          <p className="text-xs text-gray-500 mt-1">bulan</p>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b">
          <div className="flex gap-6">
            {['details', 'schedule', 'notes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium border-b-2 transition ${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'details' && 'Detail Aset'}
                {tab === 'schedule' && 'Jadwal Penyusutan'}
                {tab === 'notes' && 'Catatan'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {editing ? (
                <>
                  <Input
                    label="Nama Aset"
                    value={editForm.name || editForm.nama}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value, nama: e.target.value })}
                  />
                  <Input
                    label="Lokasi"
                    value={editForm.location || ''}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                  <Input
                    label="Nomor Seri"
                    value={editForm.serialNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                  />
                  <Input
                    label="Vendor"
                    value={editForm.vendor || ''}
                    onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
                  />
                  <Input
                    label="Garansi Sampai"
                    type="date"
                    value={editForm.warrantyExpiry ? new Date(editForm.warrantyExpiry).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditForm({ ...editForm, warrantyExpiry: e.target.value })}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleEditSave}>Simpan</Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Batal
                    </Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Kategori</p>
                    <p className="text-base">{asset.category?.name || asset.kategori || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Lokasi</p>
                    <p className="text-base">{asset.location || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Nomor Seri</p>
                    <p className="text-base font-mono">{asset.serialNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Vendor</p>
                    <p className="text-base">{asset.vendor || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Umur Ekonomis</p>
                    <p className="text-base">{(asset.usefulLifeMonths || asset.umurEkonomi) || 60} bulan</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Metode Depresiasi</p>
                    <p className="text-base">{asset.depreciationMethod === 'STRAIGHT_LINE' ? 'Garis Lurus' : 'Saldo Menurun'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Nilai Residu</p>
                    <p className="text-base">{formatRp(asset.residualValue || asset.nilaiResidu || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Garansi Sampai</p>
                    <p className="text-base">{asset.warrantyExpiry ? formatDate(asset.warrantyExpiry) : '-'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <Table
              columns={[
                { key: 'periode', label: 'Periode' },
                { key: 'bebanDepresiasi', label: 'Beban Depresiasi', render: (row) => formatRp(row.bebanDepresiasi), align: 'right' },
                { key: 'akumDepresiasi', label: 'Akum. Depresiasi', render: (row) => formatRp(row.akumDepresiasi), align: 'right' },
                { key: 'nilaiBuku', label: 'Nilai Buku', render: (row) => formatRp(row.nilaiBuku), align: 'right' },
              ]}
              data={schedule}
              emptyText="Tidak ada jadwal depresiasi"
            />
          )}

          {activeTab === 'notes' && (
            <div>
              <p className="text-gray-600">{asset.note || 'Tidak ada catatan'}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Dispose Modal */}
      <Modal
        open={disposeModal}
        onClose={() => setDisposeModal(false)}
        title="Lepas Aset"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDisposeModal(false)}>
              Batal
            </Button>
            <Button onClick={handleDispose}>Lepas Aset</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Tanggal Disposal"
            type="date"
            value={disposeData.tanggalDisposal}
            onChange={(e) => setDisposeData({ ...disposeData, tanggalDisposal: e.target.value })}
          />
          <Input
            label="Nilai Disposal (Rp)"
            type="number"
            placeholder="0"
            value={disposeData.nilaiDisposal}
            onChange={(e) => setDisposeData({ ...disposeData, nilaiDisposal: e.target.value })}
          />
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            Keuntungan/Kerugian: {formatRp(Number(disposeData.nilaiDisposal) - currentBookValue)}
          </p>
        </div>
      </Modal>
    </div>
  );
}
