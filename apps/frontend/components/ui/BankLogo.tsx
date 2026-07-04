/** Logo bank sederhana berbasis SVG dengan warna brand masing-masing */
export function BankLogo({ bank, size = 32 }: { bank: string; size?: number }) {
  const b = bank.toUpperCase();

  if (b === 'BRI') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#003F88"/>
      <rect x="0" y="20" width="32" height="12" rx="0" fill="#F58220" />
      <rect x="0" y="20" width="32" height="12" rx="8" fill="#F58220" />
      <rect x="0" y="16" width="32" height="8" fill="#F58220" />
      <text x="16" y="14" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial,sans-serif" letterSpacing="0.5">BRI</text>
      <text x="16" y="27" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="600" fontFamily="Arial,sans-serif" letterSpacing="0.3">BANK</text>
    </svg>
  );

  if (b === 'BCA') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#014a94"/>
      <text x="16" y="13" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial,sans-serif" letterSpacing="0.5">bank</text>
      <text x="16" y="23" textAnchor="middle" fill="#0097D6" fontSize="11" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="1">BCA</text>
    </svg>
  );

  if (b === 'MANDIRI') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#003087"/>
      {/* 5 bar kuning khas Mandiri */}
      {[4,8,12,16,20].map((x, i) => (
        <rect key={i} x={x} y="7" width="3.5" height="11" rx="1" fill="#F5A623"/>
      ))}
      <text x="16" y="27" textAnchor="middle" fill="white" fontSize="6" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="0.5">MANDIRI</text>
    </svg>
  );

  if (b === 'BNI') return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#F37021"/>
      <rect x="2" y="2" width="28" height="28" rx="6" fill="#F37021"/>
      {/* Motif diagonal */}
      <path d="M0 20 L12 8 L20 8 L8 20 Z" fill="rgba(255,255,255,0.15)"/>
      <text x="16" y="14" textAnchor="middle" fill="white" fontSize="10" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="1">BNI</text>
      <text x="16" y="25" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="500" fontFamily="Arial,sans-serif" letterSpacing="0.3">46</text>
    </svg>
  );

  // Fallback — inisial bank
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#64748B"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial,sans-serif">
        {b.slice(0, 3)}
      </text>
    </svg>
  );
}
