import { Sparkles } from 'lucide-react'

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-300 to-accent-400 text-white shadow-soft">
        <Sparkles size={20} />
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-slate-900">
        Laundry<span className="text-brand-600">System</span>
      </span>
    </span>
  )
}
