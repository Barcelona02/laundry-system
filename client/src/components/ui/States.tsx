import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

// Ipinapakita habang naglo-load ang data
export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Loader2 className="animate-spin text-brand-500" size={32} />
      <p className="text-sm">{label}</p>
    </div>
  )
}

// Ipinapakita kapag pumalya ang request, may "Try again" button
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-due-100 bg-due-50 px-6 py-12 text-center">
      <AlertTriangle className="text-due-500" size={32} />
      <p className="font-semibold text-due-600">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

// Ipinapakita kapag walang laman ang listahan
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-slate-200 px-6 py-14 text-center">
      <Inbox className="text-slate-300" size={40} />
      <p className="font-semibold text-slate-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
