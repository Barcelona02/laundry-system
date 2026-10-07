import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card bg-white p-5 shadow-card sm:p-6 ${className}`}>{children}</div>
}
