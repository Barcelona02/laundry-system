import { AlertTriangle, Clock, PackageCheck, Plus, Wallet, WashingMachine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useFetch } from '../hooks/useFetch'
import type { DashboardStats, OrderStatus } from '../types'
import { formatPeso } from '../utils/format'
import { STATUS_LABEL } from '../utils/orderRules'

const STATUS_ORDER: OrderStatus[] = ['received', 'washing', 'drying', 'ready', 'claimed', 'cancelled']

export default function Dashboard() {
  const { data: stats, loading, error, refetch } = useFetch<DashboardStats>('/stats/dashboard')

  if (loading) return <LoadingState label="Loading dashboard..." />
  if (error || !stats) return <ErrorState message={error ?? 'No data'} onRetry={refetch} />

  // Derived: pinakamalaking bilang, para sa haba ng bawat bar
  const maxStatusCount = Math.max(1, ...STATUS_ORDER.map((s) => stats.orders.byStatus[s]))
  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Here's how the shop is doing today, ${today}.`}
        action={
          <LinkButton to="/orders/new">
            <Plus size={18} /> New order
          </LinkButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sales today" value={formatPeso(stats.sales.today)} hint={`${formatPeso(stats.sales.thisMonth)} this month`} icon={Wallet} />
        <StatCard
          label="Active orders"
          value={String(stats.orders.active)}
          hint="Received, washing, or drying"
          icon={WashingMachine}
        />
        <StatCard
          label="Ready for pickup"
          value={String(stats.orders.unclaimed)}
          hint={stats.receivables.pendingStorageFees > 0 ? `${formatPeso(stats.receivables.pendingStorageFees)} storage fees` : 'No storage fees yet'}
          icon={PackageCheck}
        />
        <StatCard
          label="Late orders"
          value={String(stats.orders.late)}
          hint="Past the promised pickup time"
          icon={AlertTriangle}
          tone={stats.orders.late > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Orders by status</h2>
            <span className="text-sm text-slate-500">{stats.orders.total} total</span>
          </div>
          <ul className="space-y-3">
            {STATUS_ORDER.map((s) => {
              const count = stats.orders.byStatus[s]
              return (
                <li key={s}>
                  <Link to={`/orders?status=${s}`} className="group grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3">
                    <span className="truncate text-sm text-slate-600 group-hover:text-brand-600">{STATUS_LABEL[s]}</span>
                    <span className="h-2.5 rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-brand-500 transition-all"
                        style={{ width: `${(count / maxStatusCount) * 100}%` }}
                      />
                    </span>
                    <span className="text-right text-sm font-semibold text-slate-900">{count}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card>
          <h2 className="font-bold text-slate-900">Money to collect</h2>
          <p className="mt-3 text-3xl font-extrabold text-accent-600">{formatPeso(stats.receivables.unpaidBalance)}</p>
          <p className="text-sm text-slate-500">Unpaid balance across all open orders</p>
          <LinkButton to="/orders?unpaid=true" variant="secondary" className="mt-4 w-full">
            View unpaid orders
          </LinkButton>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Machine utilization</span>
              <span className="font-semibold text-slate-900">{stats.machines.utilizationRate}%</span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${stats.machines.utilizationRate}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {stats.machines.inUse} in use · {stats.machines.maintenance} under maintenance · {stats.machines.total} total
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Avg. turnaround" value={`${stats.averages.turnaroundHours} hrs`} hint="From received to ready" icon={Clock} />
        <StatCard label="Avg. load size" value={`${stats.averages.kgPerOrder} kg`} hint="Per-kg services only" />
        <StatCard label="Avg. order value" value={formatPeso(stats.averages.orderValue)} hint="Excluding cancelled orders" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold text-slate-900">Top services</h2>
          {stats.topServices.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <ol className="divide-y divide-slate-100">
              {stats.topServices.map((s, i) => (
                <li key={s.name} className="flex items-center gap-3 py-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{s.name}</span>
                    <span className="text-xs text-slate-500">{s.orders} orders</span>
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{formatPeso(s.billed)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-bold text-slate-900">Top customers</h2>
          {stats.topCustomers.length === 0 ? (
            <EmptyState title="No customers yet" />
          ) : (
            <ol className="divide-y divide-slate-100">
              {stats.topCustomers.map((c, i) => (
                <li key={c._id}>
                  <Link to={`/customers/${c._id}`} className="flex items-center gap-3 py-3 hover:text-brand-600">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{c.name}</span>
                      <span className="text-xs text-slate-500">{c.orders} orders</span>
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{formatPeso(c.totalSpent)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  )
}
