'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Table, PageLoader, Input } from '@gm/ui';
import { formatRp, formatDate } from '@gm/utils';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { createApiClient } from '@/lib/utils/api';

const api = createApiClient();

export default function AssetReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('register');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    if (activeTab === 'register') {
      fetchRegister();
    } else {
      fetchDepreciationReport();
    }
  }, [activeTab, asOfDate, yearFilter]);

  const fetchRegister = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assets/reports/register?asOf=${asOfDate}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Error loading register:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepreciationReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assets/reports/depreciation?year=${yearFilter}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Error loading depreciation report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('Export PDF - Implementation pending');
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    alert('Export Excel - Implementation pending');
  };

  const totalAquisitionValue = reportData.reduce((sum, item) => sum + (item.acquisitionValue || 0), 0);
  const totalAccumulated = reportData.reduce((sum, item) => sum + (item.accumulatedDep || 0), 0);
  const totalBookValue = reportData.reduce((sum, item) => sum + (item.currentBookValue || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Laporan Aset Tetap</h1>
          <p className="text-sm text-gray-600">Daftar dan laporan penyusutan aset</p>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button icon={<Download size={16} />} variant="outline" onClick={handleExportPDF}>
          PDF
        </Button>
        <Button icon={<Download size={16} />} variant="outline" onClick={handleExportExcel}>
          Excel
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b">
          <div className="flex gap-6">
            {[
              { id: 'register', label: 'Daftar Aset (Register)' },
              { id: 'depreciation', label: 'Laporan Penyusutan' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Filters */}
          {activeTab === 'register' ? (
            <div>
              <label className="block text-sm font-medium mb-2">Per Tanggal</label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">Tahun</label>
              <input
                type="number"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Summary */}
          {activeTab === 'register' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-purple-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Nilai Perolehan</p>
                <p className="text-lg font-bold">{formatRp(totalAquisitionValue)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Akum. Depresiasi</p>
                <p className="text-lg font-bold">{formatRp(totalAccumulated)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nilai Buku</p>
                <p className="text-lg font-bold">{formatRp(totalBookValue)}</p>
              </div>
            </div>
          )}

          {/* Report Table */}
          {loading ? (
            <PageLoader message="Memuat laporan..." />
          ) : activeTab === 'register' ? (
            <Table
              columns={[
                { key: 'code', label: 'Kode', render: (row) => <span className="font-mono text-sm">{row.code}</span>, width: 100 },
                { key: 'name', label: 'Nama Aset' },
                { key: 'category', label: 'Kategori', width: 140 },
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
                  render: (row) => <span className="font-medium">{formatRp(row.currentBookValue)}</span>,
                  align: 'right',
                  width: 140,
                },
              ]}
              data={reportData}
              emptyText="Tidak ada data aset"
            />
          ) : (
            <Table
              columns={[
                { key: 'assetCode', label: 'Kode Aset', render: (row) => <span className="font-mono text-sm">{row.assetCode}</span>, width: 100 },
                { key: 'assetName', label: 'Nama Aset' },
                { key: 'category', label: 'Kategori', width: 140 },
                { key: 'periode', label: 'Periode', width: 100 },
                {
                  key: 'bebanDepresiasi',
                  label: 'Beban Depresiasi',
                  render: (row) => formatRp(row.bebanDepresiasi),
                  align: 'right',
                  width: 160,
                },
                {
                  key: 'akumDepresiasi',
                  label: 'Akum. Depresiasi',
                  render: (row) => formatRp(row.akumDepresiasi),
                  align: 'right',
                  width: 160,
                },
                {
                  key: 'nilaiBuku',
                  label: 'Nilai Buku',
                  render: (row) => formatRp(row.nilaiBuku),
                  align: 'right',
                  width: 140,
                },
              ]}
              data={reportData}
              emptyText="Tidak ada data penyusutan"
            />
          )}
        </div>
      </Card>
    </div>
  );
}
