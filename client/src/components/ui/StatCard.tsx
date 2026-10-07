import type { LucideIcon } from 'lucide-react'
import { Card } from './Card'

type Tone = 'sky' | 'lavender' | 'mint' | 'warning'

const TONES: Record<Tone, { bubble: string; value: string }> = {
  sky: { bubble: 'bg-brand-100 text-brand-600', value: 'text-slate-900' },
  lavender: { bubble: 'bg-accent-100 text-accent-600', value: 'text-slate-900' },
  mint: { bubble: 'bg-emerald-50 text-emerald-600', value: 'text-slate-900' },
  warning: { bubble: 'bg-due-50 text-due-600', value: 'text-due-600' },
}

interface Props {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tone?: Tone | 'default'
  className?: string
}

// Maliit na card na may isang numero (hal. "Sales today")
export function StatCard({ label, value, hint, icon: Icon, tone = 'default', className = '' }: Props) {
  const style = TONES[tone === 'default' ? 'sky' : tone]
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${style.bubble}`}>
            <Icon size={19} />
          </span>
        )}
      </div>
      <p className={`mt-2 font-display text-[1.75rem] leading-tight font-semibold tracking-tight ${style.value}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Card>
  )
}
