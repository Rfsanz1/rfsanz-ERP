'use client';
import React from 'react';

interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 24, color = '#6366F1' }: SpinnerProps) {
  return (
    <svg
      style={{ width: size, height: size, animation: 'spin 0.8s linear infinite' }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle opacity=".15" cx="12" cy="12" r="10" stroke={color} strokeWidth="3" />
      <path opacity=".9" fill={color} d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  );
}

export function PageLoader({ message }: { message?: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 20,
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes pl-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pl-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.92); }
        }
        @keyframes pl-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
        @keyframes pl-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Ring spinner */}
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        {/* Outer track */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '3px solid rgba(99,102,241,0.12)',
        }} />
        {/* Spinning arc */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#6366F1',
          borderRightColor: 'rgba(99,102,241,0.4)',
          animation: 'pl-spin 0.75s cubic-bezier(0.5,0,0.5,1) infinite',
        }} />
        {/* Center dot */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 10, height: 10,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          animation: 'pl-pulse 1.4s ease-in-out infinite',
        }} />
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: '#6366F1',
              animation: `pl-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Message */}
      {message && (
        <p style={{
          margin: 0,
          fontSize: 13,
          color: '#94A3B8',
          fontWeight: 500,
          letterSpacing: '0.02em',
          animation: 'pl-fade-in 0.4s ease both',
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
