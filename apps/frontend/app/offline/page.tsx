export default function OfflinePage() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#F5F5F9',
        fontFamily: 'Inter, sans-serif',
        margin: 0,
        padding: '1rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #7367F0, #CE9FFC)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#fff',
          }}
        >
          GM
        </div>
        <h1 style={{ color: '#433C50', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
          Tidak Ada Koneksi
        </h1>
        <p style={{ color: '#6D6777', fontSize: '0.9375rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Gentong Mas ERP memerlukan koneksi internet. Silakan periksa koneksi Anda dan coba lagi.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#7367F0',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.75rem 2rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(115,103,240,0.3)',
          }}
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
