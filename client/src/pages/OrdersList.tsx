import { AlertTriangle, Plus, Search, Zap } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useDebounce } from '../hooks/useDebounce'
import { useFetch } from '../hooks/useFetch'
import type { OrderStatus, OrderWithBalance } from '../types'
import { formatDate, formatPeso } from '../utils/format'
import { STATUS_LABEL } from '../utils/orderRules'
import { inputClass } from '../utils/styles'

const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[]

type SortKey = 'newest' | 'oldest' | 'balance' | 'promised' | 'amount'

const SORTERS: Record<SortKey, (a: OrderWithBalance, b: OrderWithBalance) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  balance: (a, b) => b.balance - a.balance,
  promised: (a, b) => a.promisedAt.localeCompare(b.promisedAt),
  amount: (a, b) => b.amountDue - a.amountDue,
}

export default function OrdersList() {
  // Naka-save ang filters sa URL (hal. /orders?status=ready&unpaid=true)
  // para gumana ang mga link galing sa Dashboard at ang back button
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const unpaid = params.get('unpaid') === 'true'
  const late = params.get('late') === 'true'
  const sort = (params.get('sort') as SortKey) || 'newest'
  const search = params.get('search') ?? ''
  const debouncedSearch = useDebounce(search)

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  // Ang mga filter ay ipinapasa sa server bilang query string
  const query = new URLSearchParams()
  if (status) query.set('status', status)
  if (unpaid) query.set('unpaid', 'true')
  if (late) query.set('late', 'true')
  if (debouncedSearch) query.set('search', debouncedSearch)
  const { data: orders, loading, error, refetch } = useFetch<OrderWithBalance[]>(`/orders?${query}`)

  // Derived: naka-sort na kopya at total ng balance (hindi naka-store sa state)
  const sorted = orders ? [...orders].sort(SORTERS[sort] ?? SORTERS.newest) : []
  const totalBalance = sorted.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.balance, 0)
  const hasFilters = Boolean(status || unpaid || late || search)

  return (
    <>
      <PageHeader
        title="Orders"
        description="Track every load from drop-off to pickup."
        action={
          <LinkButton to="/orders/new">
            <Plus size={18} /> New order
          </LinkButton>
        }
      />

      <Card className="mb-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              placeholder="Search order code (e.g. LND-0001)"
              className={`${inputClass} pl-10`}
              aria-label="Search order code"
            />
          </div>
          <select value={status} onChange={(e) => updateParam('status', e.target.value)} className={inputClass} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className={inputClass} aria-label="Sort orders">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="promised">Pickup date (soonest)</option>
            <option value="balance">Highest balance</option>
            <option value="amount">Highest amount</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={unpaid}
              onChange={(e) => updateParam('unpaid', e.target.checked ? 'true' : '')}
              className="size-4 accent-brand-600"
            />
            With balance only
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={late}
              onChange={(e) => updateParam('late', e.target.checked ? 'true' : '')}
              className="size-4 accent-brand-600"
            />
            Late only
          </label>
          {hasFilters && (
            <Button variant="ghost" className="px-2 py-1 text-brand-600" onClick={() => setParams({}, { replace: true })}>
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {loading && !orders ? (
        <LoadingState label="Loading orders..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No orders match these filters' : 'No orders yet'}
          description={hasFilters ? 'Try removing a filter.' : 'Create the first order when a customer drops off laundry.'}
          action={!hasFilters && <LinkButton to="/orders/new">New order</LinkButton>}
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            {sorted.length} order{sorted.length === 1 ? '' : 's'} · {formatPeso(totalBalance)} unpaid
          </p>

          {/* Desktop: table */}
          <Card className="hidden overflow-hidden p-0 sm:p-0 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Pickup</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Balance</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <Link to={`/orders/${o._id}`} className="font-bold text-slate-900 hover:text-brand-600">
                        {o.orderCode}
                      </Link>
                      <span className="block text-xs text-slate-500">{o.service?.name ?? 'Service removed'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{o.customer?.name ?? 'Deleted customer'}</td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        {formatDate(o.promisedAt)}
                        {o.isRush && <Zap size={14} className="text-accent-500" aria-label="Rush" />}
                        {o.isLate && <AlertTriangle size={14} className="text-red-500" aria-label="Late" />}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900">{formatPeso(o.amountDue)}</td>
                    <td className={`px-5 py-3.5 text-right font-semibold ${o.balance > 0 ? 'text-accent-600' : 'text-slate-400'}`}>
                      {o.status === 'cancelled' ? '—' : formatPeso(o.balance)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {sorted.map((o) => (
              <Link key={o._id} to={`/orders/${o._id}`} className="block">
                <Card className="p-4 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{o.orderCode}</p>
                      <p className="truncate text-sm text-slate-500">{o.customer?.name ?? 'Deleted customer'}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3 text-sm">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      Pickup {formatDate(o.promisedAt)}
                      {o.isRush && <Zap size={14} className="text-accent-500" />}
                      {o.isLate && <AlertTriangle size={14} className="text-red-500" />}
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold text-slate-900">{formatPeso(o.amountDue)}</span>
                      {o.balance > 0 && o.status !== 'cancelled' && (
                        <span className="block text-xs text-accent-600">{formatPeso(o.balance)} due</span>
                      )}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}
