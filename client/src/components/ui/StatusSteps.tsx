import { Check } from 'lucide-react'
import type { OrderStatus, StatusHistoryEntry } from '../../types'
import { formatDateTime } from '../../utils/format'
import { STATUS_FLOW, STATUS_LABEL } from '../../utils/orderRules'

// Progress ng order: received -> washing -> drying -> ready -> claimed
export function StatusSteps({ status, history }: { status: OrderStatus; history: StatusHistoryEntry[] }) {
  if (status === 'cancelled') {
    return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">This order was cancelled.</p>
  }

  const currentIndex = STATUS_FLOW.indexOf(status)

  return (
    <ol className="space-y-0">
      {STATUS_FLOW.map((step, i) => {
        const done = i <= currentIndex
        const entry = history.find((h) => h.status === step)
        return (
          <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
            {i < STATUS_FLOW.length - 1 && (
              <span
                className={`absolute top-8 left-[15px] h-[calc(100%-2rem)] w-0.5 ${i < currentIndex ? 'bg-brand-500' : 'bg-slate-200'}`}
              />
            )}
            <span
              className={`relative grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                done ? 'bg-brand-600 text-white' : 'border-2 border-slate-200 bg-white text-slate-400'
              } ${i === currentIndex ? 'ring-4 ring-brand-100' : ''}`}
            >
              {done ? <Check size={16} /> : i + 1}
            </span>
            <div className="pt-1">
              <p className={`text-sm font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}>{STATUS_LABEL[step]}</p>
              {entry && <p className="text-xs text-slate-500">{formatDateTime(entry.changedAt)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
