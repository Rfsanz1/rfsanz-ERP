'use client';
import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties & { hover?: React.CSSProperties }> = {
  primary:   { background: 'linear-gradient(135deg,#5B52D1,#8B80F9)', color:'#fff', border:'none', boxShadow:'0 4px 16px rgba(91,82,209,.35)' },
  secondary: { backgroundColor:'#F5F3FF', color:'#5B52D1', border:'1.5px solid #DDD6FE' },
  danger:    { backgroundColor:'#FEF2F2', color:'#DC2626', border:'1.5px solid #FECACA' },
  ghost:     { backgroundColor:'transparent', color:'#6B7280', border:'none' },
  outline:   { backgroundColor:'transparent', color:'#5B52D1', border:'1.5px solid #5B52D1' },
};

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding:'6px 14px', fontSize:12, borderRadius:8 },
  md: { padding:'10px 20px', fontSize:13.5, borderRadius:12 },
  lg: { padding:'13px 28px', fontSize:15, borderRadius:14 },
};

export function Button({
  variant = 'primary', size = 'md', loading = false, icon, children, disabled, style, ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display:'inline-flex', alignItems:'center', gap:6, fontWeight:600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.65 : 1,
        transition:'all .2s',
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin" style={{ width:14,height:14 }} viewBox="0 0 24 24" fill="none">
          <circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : icon ? icon : null}
      {children}
    </button>
  );
}
