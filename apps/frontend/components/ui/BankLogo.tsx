/** Logo bank dari file gambar asli */
const BANK_IMAGES: Record<string, string> = {
  BRI:     '/icons/bank-bri.png',
  BCA:     '/icons/bank-bca.png',
  MANDIRI: '/icons/bank-mandiri.png',
  BNI:     '/icons/bank-bni.png',
};

export function BankLogo({ bank, size = 32 }: { bank: string; size?: number }) {
  const key = bank.toUpperCase();
  const src = BANK_IMAGES[key];

  if (!src) {
    // Fallback teks jika logo tidak tersedia
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          background: '#64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
        <span style={{ color: 'white', fontSize: 10, fontWeight: 800, fontFamily: 'Arial,sans-serif' }}>
          {key.slice(0, 3)}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        padding: 3,
      }}>
      <img
        src={src}
        alt={`Logo ${bank}`}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}
