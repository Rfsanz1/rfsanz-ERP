'use client';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: number | string;
}

export function Card({ children, title, subtitle, action, style, padding = 24 }: CardProps) {
  return (
    <div style={{
      backgroundColor:'#fff', borderRadius:16, border:'1px solid #EDE8F5',
      boxShadow:'0 2px 8px rgba(47,43,61,.08)', overflow:'hidden', ...style,
    }}>
      {(title || action) && (
        <div style={{
          display:'flex', alignItems:'flex-start', justifyContent:'space-between',
          padding:`${padding}px ${padding}px 0`,
        }}>
          <div>
            {title && <h3 style={{ fontSize:15, fontWeight:700, color:'#1E1B4B', margin:0 }}>{title}</h3>}
            {subtitle && <p style={{ fontSize:12.5, color:'#9CA3AF', margin:'2px 0 0' }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bg?: string;
  trend?: { value: number; label: string };
}

export function StatCard({ label, value, icon, color, bg, trend }: StatCardProps) {
  return (
    <div style={{
      backgroundColor:'#fff', borderRadius:16, border:'1px solid #EDE8F5',
      boxShadow:'0 2px 8px rgba(47,43,61,.08)', padding:20,
      display:'flex', alignItems:'flex-start', gap:14,
    }}>
      <div style={{
        width:44, height:44, borderRadius:12, display:'flex',
        alignItems:'center', justifyContent:'center', flexShrink:0,
        backgroundColor: bg ?? `${color}18`,
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:12, color:'#9CA3AF', fontWeight:500, margin:0 }}>{label}</p>
        <p style={{ fontSize:22, fontWeight:800, color:'#1E1B4B', margin:'2px 0 0', lineHeight:1.2 }}>{value}</p>
        {trend && (
          <p style={{ fontSize:11, marginTop:4, color: trend.value >= 0 ? '#22C55E' : '#EF4444', fontWeight:600 }}>
            {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
