'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { HR_CONFIG, HR_NAV } from '../../../lib/nav-configs';
import { GitBranch, Users, User, Plus, ChevronDown, ChevronRight } from 'lucide-react';

const C = HR_CONFIG.appColor;

const ORG_DATA = {
  id: 1, name: 'Direktur Utama', person: 'Budi Santoso', level: 0,
  children: [
    {
      id: 2, name: 'Manajer Operasional', person: 'Siti Rahayu', level: 1,
      children: [
        { id: 5, name: 'Supervisor Produksi', person: 'Ahmad Fauzi', level: 2, children: [] },
        { id: 6, name: 'Supervisor Gudang', person: 'Dewi Kusuma', level: 2, children: [] },
        { id: 7, name: 'Supervisor QC', person: 'Hendra Wijaya', level: 2, children: [] },
      ],
    },
    {
      id: 3, name: 'Manajer Keuangan', person: 'Rina Wati', level: 1,
      children: [
        { id: 8, name: 'Staff Akuntansi', person: 'Bambang Purnomo', level: 2, children: [] },
        { id: 9, name: 'Staff Pajak', person: 'Yuni Astuti', level: 2, children: [] },
      ],
    },
    {
      id: 4, name: 'Manajer SDM', person: 'Joko Prabowo', level: 1,
      children: [
        { id: 10, name: 'Staff HR', person: 'Sari Melati', level: 2, children: [] },
        { id: 11, name: 'Staff Rekrutmen', person: 'Dani Kusuma', level: 2, children: [] },
      ],
    },
  ],
};

const COLORS = ['#C2185B', '#8E24AA', '#00897B', '#1976D2', '#F57C00'];

function OrgNode({ node, depth = 0 }: { node: any; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const color = COLORS[depth % COLORS.length];
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          className="flex flex-col items-center rounded-2xl px-5 py-4 min-w-[140px] cursor-pointer transition-all hover:shadow-lg"
          style={{
            backgroundColor: '#FFFFFF',
            border: `2px solid ${color}30`,
            boxShadow: `0 2px 8px ${color}15`,
          }}
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold mb-2" style={{ backgroundColor: color }}>
            {node.person.charAt(0)}
          </div>
          <p className="text-xs font-bold text-center" style={{ color: '#1E1B4B' }}>{node.name}</p>
          <p className="text-[10px] text-center mt-0.5" style={{ color: '#9CA3AF' }}>{node.person}</p>
          {hasChildren && (
            <div className="mt-1.5">
              {expanded ? <ChevronDown className="h-3 w-3" style={{ color: '#9CA3AF' }} /> : <ChevronRight className="h-3 w-3" style={{ color: '#9CA3AF' }} />}
            </div>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="flex flex-col items-center">
          <div className="w-px h-6" style={{ backgroundColor: '#EDE8F5' }} />
          <div className="flex gap-8 relative">
            <div className="absolute top-0 left-0 right-0 h-px" style={{ backgroundColor: '#EDE8F5' }} />
            {node.children.map((child: any, i: number) => (
              <div key={child.id} className="flex flex-col items-center pt-0">
                <div className="w-px h-6" style={{ backgroundColor: '#EDE8F5' }} />
                <OrgNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrganizationPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  if (!token) return null;

  const DEPT_SUMMARY = [
    { name: 'Operasional', count: 28, color: '#00897B' },
    { name: 'Keuangan', count: 8, color: '#388E3C' },
    { name: 'SDM', count: 5, color: '#C2185B' },
    { name: 'Sales & Marketing', count: 12, color: '#1976D2' },
    { name: 'IT & Sistem', count: 4, color: '#6D28D9' },
  ];

  return (
    <AppShell {...HR_CONFIG} navItems={HR_NAV} activeHref="/hr/organization">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Struktur Organisasi</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Hierarki jabatan dan departemen perusahaan</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Edit Struktur
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {DEPT_SUMMARY.map(d => (
            <div key={d.name} className="bg-white rounded-2xl p-4 text-center" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="h-8 w-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${d.color}15` }}>
                <Users className="h-4 w-4" style={{ color: d.color }} />
              </div>
              <p className="text-lg font-bold" style={{ color: d.color }}>{d.count}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{d.name}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 overflow-x-auto" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <h3 className="font-semibold text-sm mb-8 text-center" style={{ color: '#1E1B4B' }}>Struktur Organisasi — Gentong Mas</h3>
          <div className="flex justify-center">
            <OrgNode node={ORG_DATA} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: '#1E1B4B' }}>Daftar Jabatan</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                  {['Jabatan', 'Departemen', 'Melapor Kepada', 'Jumlah Karyawan'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { title: 'Direktur Utama', dept: 'Direksi', reports_to: '-', count: 1 },
                  { title: 'Manajer Operasional', dept: 'Operasional', reports_to: 'Direktur Utama', count: 1 },
                  { title: 'Manajer Keuangan', dept: 'Keuangan', reports_to: 'Direktur Utama', count: 1 },
                  { title: 'Manajer SDM', dept: 'SDM', reports_to: 'Direktur Utama', count: 1 },
                  { title: 'Supervisor Produksi', dept: 'Operasional', reports_to: 'Manajer Operasional', count: 1 },
                  { title: 'Staff Produksi', dept: 'Operasional', reports_to: 'Supervisor Produksi', count: 15 },
                  { title: 'Staff Akuntansi', dept: 'Keuangan', reports_to: 'Manajer Keuangan', count: 3 },
                  { title: 'Staff HR', dept: 'SDM', reports_to: 'Manajer SDM', count: 2 },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>{row.title}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{row.dept}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{row.reports_to}</td>
                    <td className="px-4 py-3 font-bold text-sm" style={{ color: C }}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
