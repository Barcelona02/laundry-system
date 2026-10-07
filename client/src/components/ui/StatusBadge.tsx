import type { OrderStatus } from '../../types'

// Bawat yugto ay may sariling pastel na kulay
const styles: Record<OrderStatus, string> = {
  received: 'bg-slate-100 text-slate-600',
  washing: 'bg-brand-100 text-brand-700',
  drying: 'bg-amber-50 text-amber-700',
  ready: 'bg-accent-100 text-accent-700',
  claimed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-due-50 text-due-600',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status]}`}>{status}</span>
  )
}
