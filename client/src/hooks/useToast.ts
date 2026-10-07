import { useContext } from 'react'
import { ToastContext } from '../context/toastContext'

// Para makapagpakita ng success/error message mula sa kahit anong page
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
