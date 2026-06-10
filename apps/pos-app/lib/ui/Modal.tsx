'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number | string;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, width = 520, footer }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}
    >
      <div style={{ position:'absolute', inset:0, backgroundColor:'rgba(0,0,0,.45)', backdropFilter:'blur(4px)' }} />
      <div
        style={{
          position:'relative', backgroundColor:'#fff', borderRadius:20, width:'100%',
          maxWidth:width, maxHeight:'90vh', display:'flex', flexDirection:'column',
          boxShadow:'0 20px 60px rgba(0,0,0,.2)', overflow:'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'18px 24px', borderBottom:'1px solid #EDE8F5', flexShrink:0,
          }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#1E1B4B', margin:0 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{ border:'none', background:'none', cursor:'pointer', padding:4, borderRadius:8, color:'#9CA3AF' }}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div style={{ flex:1, overflow:'auto', padding:24 }}>{children}</div>
        {footer && (
          <div style={{ padding:'16px 24px', borderTop:'1px solid #EDE8F5', display:'flex', gap:10, justifyContent:'flex-end', flexShrink:0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
