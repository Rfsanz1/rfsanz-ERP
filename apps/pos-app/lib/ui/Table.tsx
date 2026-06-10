'use client';
import React from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: (row: T) => string | number;
}

export function Table<T extends Record<string, unknown>>({
  columns, data, loading, emptyText = 'Tidak ada data', rowKey,
}: TableProps<T>) {
  return (
    <div style={{ width:'100%', overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ borderBottom:'2px solid #EDE8F5' }}>
            {columns.map((col) => (
              <th key={col.key} style={{
                padding:'10px 16px', textAlign: col.align ?? 'left',
                fontSize:11.5, fontWeight:600, color:'#9CA3AF',
                textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap',
                width: col.width,
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} style={{ textAlign:'center', padding:40, color:'#9CA3AF', fontSize:13 }}>Memuat data…</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ textAlign:'center', padding:40, color:'#9CA3AF', fontSize:13 }}>{emptyText}</td></tr>
          ) : data.map((row, i) => (
            <tr
              key={rowKey ? rowKey(row) : i}
              style={{ borderBottom:'1px solid #F3F0FF', transition:'background .15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#FAFAFF'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding:'12px 16px', color:'#374151', textAlign: col.align ?? 'left', verticalAlign:'middle' }}>
                  {col.render ? col.render(row) : String(row[col.key] ?? '–')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
