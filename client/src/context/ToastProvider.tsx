import { CheckCircle2, XCircle } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import { ToastContext, type ToastType } from './toastContext'

interface Toast {
  id: number
  message: string
  type: ToastType
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((list) => [...list, { id, message, type }])
    // Kusang mawawala pagkatapos ng 3.5 segundo
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              t.type === 'success' ? 'bg-brand-700' : 'bg-due-600'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
