'use client';
import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, hint, leftIcon, rightIcon, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      {label && <label style={{ fontSize:12.5, fontWeight:600, color:'#374151' }}>{label}</label>}
      <div style={{ position:'relative' }}>
        {leftIcon && (
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}>
            {leftIcon}
          </span>
        )}
        <input
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:'100%', outline:'none', fontSize:13.5, borderRadius:12,
            padding: leftIcon ? '10px 16px 10px 40px' : rightIcon ? '10px 40px 10px 16px' : '10px 16px',
            border: error ? '1.5px solid #FECACA' : focused ? '1.5px solid #8B80F9' : '1.5px solid #E5E7EB',
            boxShadow: focused ? '0 0 0 4px rgba(139,128,249,.1)' : '0 1px 3px rgba(0,0,0,.04)',
            backgroundColor:'#FAFAFA', color:'#111827', transition:'all .2s',
            ...style,
          }}
          {...props}
        />
        {rightIcon && (
          <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}>
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p style={{ fontSize:11.5, color:'#DC2626' }}>{error}</p>}
      {hint && !error && <p style={{ fontSize:11.5, color:'#9CA3AF' }}>{hint}</p>}
    </div>
  );
}
