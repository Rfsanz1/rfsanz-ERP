import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Button({ children, className = '', onClick }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-3xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(27,120,151,0.24)] transition hover:bg-[#166b84] focus:outline-none focus:ring-2 focus:ring-[rgba(27,120,151,0.35)] ${className}`}
    >
      {children}
    </button>
  );
}
