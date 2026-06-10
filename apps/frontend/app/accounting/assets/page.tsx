'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Badge, Table, Button, Input, Modal, PageLoader, Spinner } from '@gm/ui';
import { formatRp, formatDate } from '@gm/utils';
import { Plus, Pencil, Trash2, Eye, Download } from 'lucide-react';
import { createApiClient } from '@/lib/utils/api';

interface Asset {
  id: string;
  code: string;
  name: string;
  category?: { name: string };
  acquisitionDate: string;
  acquisitionValue: number;
  currentBookValue: number;
  accumulatedDep: number;
  status: string;
  location?: string;
}

const api = createApiClient();

export default function AssetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [page, search, status, categoryId]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/assets/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { search }),
        ...(status && { status }),
        ...(categoryId && { categoryId }),
      });
      const res = await api.get(`/assets?${params.toString()}`);
      setAssets(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error loading assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus aset ini?')) return;
    try {
      await api.delete(`/assets/${id}`);
      fetchAssets();
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  const totalValue = assets.reduce((sum, a) => sum + a.acquisitionValue, 0);
  const totalDepreciated = assets.reduce((sum, a) => sum + a.accumulatedDep, 0);
  const totalBookValue = assets.reduce((sum, a) => sum + a.currentBookValue, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Daftar Aset Tetap</h1>
        <Button icon={<Plus size={16} />} onClick={() => router.push('/accounting/assets/new')}>
          Aset Baru
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Aset" subtitle={`${assets.length} item`}>
          <p className="text-2xl font-bold">{formatRp(totalValue)}</p>
        </Card>
        <Card title="Akum. Penyusutan" subtitle="Hingga saat ini">
          <p className="text-2xl font-bold">{formatRp(totalDepreciated)}</p>
        </Card>
        <Card title="Nilai Buku" subtitle="Nilai aset bersih">
          <p className="text-2xl font-bold">{formatRp(totalBookValue)}</p>
        </Card>
        <Card title="Rata-rata Depresiasi" subtitle="Per bulan">
          <p className="text-2xl font-bold">{formatRp(assets.length > 0 ? totalDepreciated / 12 : 0)}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card title="Filter" padding={16}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Cari Aset"
            placeholder="Kode atau nama..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <div>
            <label className="block text-sm font-medium mb-2">Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="DISPOSED">Dilepas</option>
              <option value="SOLD">Terjual</option>
              <option value="UNDER_MAINTENANCE">Maintenance</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => router.push('/accounting/assets/reports')}>
              <Download size={16} className="mr-2" />
              Laporan
            </Button>
          </div>
        </div>
      </Card>

      {/* Assets Table */}
      <Card title="Daftar Aset">
        {loading ? (
          <PageLoader message="Memuat aset..." />
        ) : (
          <>
            <Table
              columns={[
                {
                  key: 'code',
                  label: 'Kode',
                  render: (row) => <span className="font-mono">{row.code}</span>,
                  width: 120,
                },
                {
                  key: 'name',
                  label: 'Nama Aset',
                  render: (row) => (
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-sm text-gray-500">{row.category?.name || '-'}</p>
                    </div>
                  ),
                },
                {
                  key: 'acquisitionDate',
                  label: 'Tgl Perolehan',
                  render: (row) => formatDate(row.acquisitionDate),
                  width: 140,
                },
                {
                  key: 'acquisitionValue',
                  label: 'Nilai Perolehan',
                  render: (row) => formatRp(row.acquisitionValue),
                  align: 'right',
                  width: 160,
                },
                {
                  key: 'accumulatedDep',
                  label: 'Akum. Depresiasi',
                  render: (row) => formatRp(row.accumulatedDep),
                  align: 'right',
                  width: 160,
                },
                {
                  key: 'currentBookValue',
                  label: 'Nilai Buku',
                  render: (row) => (
                    <span className="font-medium">{formatRp(row.currentBookValue)}</span>
                  ),
                  align: 'right',
                  width: 160,
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => (
                    <Badge
                      variant={
                        row.status === 'ACTIVE'
                          ? 'success'
                          : row.status === 'DISPOSED'
                          ? 'danger'
                          : row.status === 'SOLD'
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {row.status}
                    </Badge>
                  ),
                  width: 120,
                },
                {
                  key: 'actions',
                  label: 'Aksi',
                  render: (row) => (
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/accounting/assets/${row.id}`)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Detail"
                      >
                        <Eye size={16} />
                      </button>
                      {row.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => router.push(`/accounting/assets/${row.id}?mode=edit`)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  ),
                  width: 100,
                },
              ]}
              data={assets}
            />

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Halaman {page} dari {Math.ceil(total / 20)} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= Math.ceil(total / 20)}
                  onClick={() => setPage(page + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
