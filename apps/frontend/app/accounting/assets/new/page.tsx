'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, PageLoader } from '@gm/ui';
import { createApiClient } from '@/lib/utils/api';
import { ArrowLeft } from 'lucide-react';

const api = createApiClient();

export default function NewAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionValue: '',
    usefulLifeMonths: '60',
    depreciationMethod: 'STRAIGHT_LINE',
    residualValue: '0',
    location: '',
    serialNumber: '',
    warrantyExpiry: '',
    vendor: '',
    attachment: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/assets/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        acquisitionValue: Number(form.acquisitionValue),
        usefulLifeMonths: Number(form.usefulLifeMonths),
        residualValue: Number(form.residualValue),
        warrantyExpiry: form.warrantyExpiry ? new Date(form.warrantyExpiry) : null,
      };
      await api.post('/assets', payload);
      router.push('/accounting/assets');
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Registrasi Aset Tetap</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Aset */}
        <Card title="Identitas Aset" subtitle="Informasi dasar aset">
          <div className="space-y-4">
            <Input
              label="Nama Aset *"
              placeholder="Contoh: Kendaraan Operasional"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kategori *</label>
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Nomor Seri"
                placeholder="Contoh: ABC123"
                name="serialNumber"
                value={form.serialNumber}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Lokasi/Tempat"
                placeholder="Contoh: Gudang Pusat"
                name="location"
                value={form.location}
                onChange={handleChange}
              />
              <Input
                label="Vendor/Pabrik"
                placeholder="Contoh: PT ABC"
                name="vendor"
                value={form.vendor}
                onChange={handleChange}
              />
            </div>
          </div>
        </Card>

        {/* Data Perolehan */}
        <Card title="Data Perolehan" subtitle="Nilai dan tanggal perolehan">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tanggal Perolehan *"
                type="date"
                name="acquisitionDate"
                value={form.acquisitionDate}
                onChange={handleChange}
                required
              />
              <Input
                label="Nilai Perolehan (Rp) *"
                type="number"
                placeholder="0"
                name="acquisitionValue"
                value={form.acquisitionValue}
                onChange={handleChange}
                required
              />
            </div>
            <Input
              label="Nilai Residu/Sisa (Rp)"
              type="number"
              placeholder="0"
              name="residualValue"
              value={form.residualValue}
              onChange={handleChange}
            />
            <Input
              label="Garansi Sampai"
              type="date"
              name="warrantyExpiry"
              value={form.warrantyExpiry}
              onChange={handleChange}
            />
          </div>
        </Card>

        {/* Depresiasi */}
        <Card title="Metode Depresiasi" subtitle="Pengaturan penyusutan aset">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Umur Ekonomis (Bulan) *"
                type="number"
                placeholder="60"
                name="usefulLifeMonths"
                value={form.usefulLifeMonths}
                onChange={handleChange}
                required
              />
              <div>
                <label className="block text-sm font-medium mb-2">Metode Depresiasi *</label>
                <select
                  name="depreciationMethod"
                  value={form.depreciationMethod}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="STRAIGHT_LINE">Garis Lurus (Straight Line)</option>
                  <option value="DECLINING_BALANCE">Saldo Menurun (Declining Balance)</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Dokumen */}
        <Card title="Dokumen Pendukung" subtitle="Foto dan dokumen aset">
          <Input
            label="URL Foto/Dokumen"
            placeholder="Contoh: https://..."
            name="attachment"
            value={form.attachment}
            onChange={handleChange}
          />
        </Card>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Batal
          </Button>
          <Button type="submit" loading={loading}>
            Simpan Aset
          </Button>
        </div>
      </form>
    </div>
  );
}
