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
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={close}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive ? 'bg-white/15 text-white' : 'text-brand-100 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-brand-900 p-5 lg:flex">
        <Link to="/" className="mb-8">
          <Logo light />
        </Link>
        {nav}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/">
          <Logo />
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={close} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-brand-900 p-5">
            <div className="mb-8 flex items-center justify-between">
              <Logo light />
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="rounded-lg p-1.5 text-white hover:bg-white/10"
              >
                <X size={22} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}
