import type { OrderStatus } from '../../types'

const styles: Record<OrderStatus, string> = {
  received: 'bg-slate-100 text-slate-700',
  washing: 'bg-sky-100 text-sky-700',
  drying: 'bg-amber-100 text-amber-700',
  ready: 'bg-brand-100 text-brand-700',
  claimed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}
