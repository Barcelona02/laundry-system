import { ArrowLeft, MapPin, Pencil, Phone, Plus, StickyNote } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useFetch } from '../hooks/useFetch'
import type { Customer, OrderWithBalance } from '../types'
import { formatDate, formatPeso } from '../utils/format'

export default function CustomerDetail() {
  const { id } = useParams()
  const customerReq = useFetch<Customer>(`/customers/${id}`)
  const ordersReq = useFetch<OrderWithBalance[]>(`/orders?customer=${id}`)

  if (customerReq.loading) return <LoadingState label="Loading customer..." />
  if (customerReq.error || !customerReq.data) {
    return <ErrorState message={customerReq.error ?? 'Customer not found'} onRetry={customerReq.refetch} />
  }

  const customer = customerReq.data
  const orders = ordersReq.data ?? []

  // Derived values: kinukuwenta sa bawat render, hindi naka-store sa state
  const validOrders = orders.filter((o) => o.status !== 'cancelled')
  const totalSpent = validOrders.reduce((sum, o) => sum + o.amountDue, 0)
  const outstanding = validOrders.reduce((sum, o) => sum + o.balance, 0)
  const activeOrders = validOrders.filter((o) => o.status !== 'claimed').length

  return (
    <>
      <PageHeader
        title={customer.name}
        description={`Customer since ${formatDate(customer.createdAt)}`}
        action={
          <>
            <LinkButton to="/customers" variant="secondary">
              <ArrowLeft size={18} /> Back
            </LinkButton>
            <LinkButton to={`/customers/${customer._id}/edit`} variant="secondary">
              <Pencil size={16} /> Edit
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4">
          <h2 className="font-bold text-slate-900">Contact details</h2>
          <p className="flex items-start gap-3 text-sm text-slate-600">
            <Phone size={18} className="mt-0.5 shrink-0 text-brand-500" /> {customer.phone}
          </p>
          <p className="flex items-start gap-3 text-sm text-slate-600">
            <MapPin size={18} className="mt-0.5 shrink-0 text-brand-500" /> {customer.address || 'No address on file'}
          </p>
          <p className="flex items-start gap-3 text-sm text-slate-600">
            <StickyNote size={18} className="mt-0.5 shrink-0 text-brand-500" /> {customer.notes || 'No notes'}
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-3">
          <Stat label="Total orders" value={String(validOrders.length)} />
          <Stat label="Active orders" value={String(activeOrders)} />
          <Stat label="Total billed" value={formatPeso(totalSpent)} />
          <Stat
            label="Outstanding balance"
            value={formatPeso(outstanding)}
            highlight={outstanding > 0}
            className="col-span-2 lg:col-span-3"
          />
        </div>
      </div>

      <div className="mt-8 mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900">Order history</h2>
        <LinkButton to={`/orders/new?customer=${customer._id}`}>
          <Plus size={18} /> New order
        </LinkButton>
      </div>

      {ordersReq.loading ? (
        <LoadingState label="Loading orders..." />
      ) : ordersReq.error ? (
        <ErrorState message={ordersReq.error} onRetry={ordersReq.refetch} />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders yet" description="This customer has not dropped off any laundry yet." />
      ) : (
        <Card className="divide-y divide-slate-100 p-0 sm:p-0">
          {orders.map((o) => (
            <Link
              key={o._id}
              to={`/orders/${o._id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
            >
              <div>
                <p className="font-bold text-slate-900">{o.orderCode}</p>
                <p className="text-sm text-slate-500">
                  {o.service?.name ?? 'Service removed'} · {formatDate(o.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-right text-sm">
                  <span className="block font-semibold text-slate-900">{formatPeso(o.amountDue)}</span>
                  {o.balance > 0 && o.status !== 'cancelled' && (
                    <span className="block text-xs text-accent-600">{formatPeso(o.balance)} due</span>
                  )}
                </span>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </Card>
      )}
    </>
  )
}

function Stat({
  label,
  value,
  highlight = false,
  className = '',
}: {
  label: string
  value: string
  highlight?: boolean
  className?: string
}) {
  return (
    <Card className={className}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-extrabold sm:text-2xl ${highlight ? 'text-accent-600' : 'text-slate-900'}`}>{value}</p>
    </Card>
  )
}
