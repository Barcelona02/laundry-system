import { WashingMachine } from 'lucide-react'

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-sm">
        <WashingMachine size={20} />
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
        Laundry<span className="text-accent-500">System</span>
      </span>
    </span>
  )
}
