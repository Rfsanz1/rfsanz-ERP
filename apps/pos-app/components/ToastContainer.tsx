'use client';
import { useEffect, useState } from 'react';
import { useToast } from '../lib/toast';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ICON = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle, info: Info };
const COLOR = { success: '#059669', error: '#DC2626', warning: '#D97706', info: '#3B82F6' };
const BG = { success: '#ECFDF5', error: '#FEF2F2', warning: '#FFFBEB', info: '#EFF6FF' };

export default function ToastContainer() {
  const { subscribe } = useToast();
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe((t) => setToasts(t));
    return unsubscribe;
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, maxWidth: 400 }}>
      {toasts.map(t => {
        const Icon = ICON[t.type as keyof typeof ICON];
        const color = COLOR[t.type as keyof typeof COLOR];
        const bg = BG[t.type as keyof typeof BG];
        return (
          <div key={t.id} style={{
            display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px',
            backgroundColor: '#fff', borderRadius: 12, marginBottom: 10,
            borderLeft: `4px solid ${color}`, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'slideIn .3s ease-out'
          }}>
            <Icon size={18} style={{ color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', flex: 1 }}>{t.message}</span>
            <button onClick={() => {}} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
              <X size={14} style={{ color: '#9CA3AF' }} />
            </button>
          </div>
        );
      })}
      <style>{`@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}
