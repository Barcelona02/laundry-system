import type { LucideIcon } from 'lucide-react'
import { Card } from './Card'

interface Props {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tone?: 'default' | 'warning'
  className?: string
}

// Maliit na card na may isang numero (hal. "Sales today")
export function StatCard({ label, value, hint, icon: Icon, tone = 'default', className = '' }: Props) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-xl ${
              tone === 'warning' ? 'bg-accent-400/15 text-accent-600' : 'bg-brand-50 text-brand-600'
            }`}
          >
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className={`mt-2 text-2xl font-extrabold tracking-tight ${tone === 'warning' ? 'text-accent-600' : 'text-slate-900'}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  )
}
