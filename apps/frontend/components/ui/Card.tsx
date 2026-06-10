import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-[32px] border border-[var(--surface-border)] bg-[var(--card)] p-6 shadow-2xl shadow-[rgba(0,0,0,0.28)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}
