'use client';
import React from 'react';

interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 24, color = '#5B52D1' }: SpinnerProps) {
  return (
    <svg
      style={{ width:size, height:size, animation:'spin 0.8s linear infinite' }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle opacity=".2" cx="12" cy="12" r="10" stroke={color} strokeWidth="3" />
      <path opacity=".8" fill={color} d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  );
}

export function PageLoader({ message = 'Memuat…' }: { message?: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:14 }}>
      <Spinner size={36} />
      <p style={{ fontSize:13, color:'#9CA3AF', fontWeight:500 }}>{message}</p>
    </div>
  );
}
