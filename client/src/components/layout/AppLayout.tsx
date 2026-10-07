import { BarChart3, ClipboardList, LayoutDashboard, Menu, Search, Users, WashingMachine, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from './Logo'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/machines', label: 'Machines', icon: WashingMachine },
  { to: '/sales', label: 'Sales Report', icon: BarChart3 },
  { to: '/track', label: 'Track Order', icon: Search },
]

// Layout ng admin pages: sidebar sa desktop, slide-out menu sa mobile
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  const nav = (
    <nav className="flex flex-col gap-1">
      <p className="mb-2 px-4 text-xs font-semibold tracking-wider text-slate-400 uppercase">Menu</p>
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={close}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? 'bg-gradient-to-r from-brand-100 to-accent-100 text-brand-800'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  const footer = (
    <div className="mt-auto rounded-3xl bg-gradient-to-br from-brand-50 to-accent-50 p-4">
      <p className="text-sm font-semibold text-slate-800">Fresh & on time</p>
      <p className="mt-1 text-xs text-slate-500">Prices, balances, and pickup times are computed for you.</p>
    </div>
  )

  return (
    <div className="min-h-screen lg:pl-72">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-slate-100 bg-white p-6 lg:flex">
        <Link to="/" className="mb-10 px-2">
          <Logo />
        </Link>
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/">
          <Logo />
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="rounded-full p-2.5 text-slate-600 hover:bg-slate-100"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={close} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col rounded-r-3xl bg-white p-6 shadow-xl">
            <div className="mb-8 flex items-center justify-between">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={22} />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <Outlet />
      </main>
    </div>
  )
}
