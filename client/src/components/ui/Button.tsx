import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-soft hover:-translate-y-px hover:bg-brand-700 disabled:hover:translate-y-0',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700',
  danger: 'bg-due-600 text-white hover:bg-due-500',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
}

const buttonClass = (variant: Variant, extra: string) => `${base} ${variants[variant]} ${extra}`

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />
}

// Link na mukhang button (para sa navigation)
export function LinkButton({ variant = 'primary', className = '', ...props }: LinkProps & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />
}
