'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF' }}>
      <svg style={{ width: 32, height: 32, animation: 'spin .8s linear infinite', color: '#5B52D1' }} viewBox="0 0 24 24" fill="none">
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        <circle opacity=".2" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
        <path opacity=".8" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"/>
      </svg>
    </div>
  );
}
