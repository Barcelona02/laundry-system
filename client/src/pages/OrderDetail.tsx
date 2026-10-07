import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ArrowLeft, Pencil, Phone, Trash2, WashingMachine, Zap } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../api/axios'
import { Button, LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FormField } from '../components/ui/FormField'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, LoadingState } from '../components/ui/States'
import { StatusBadge } from '../components/ui/StatusBadge'
import { StatusSteps } from '../components/ui/StatusSteps'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { makePaymentSchema, type PaymentFormValues } from '../schemas/paymentSchema'
import type { Machine, OrderDetail as OrderDetailType, OrderStatus, Payment } from '../types'
import { formatDate, formatDateTime, formatPeso, labelize } from '../utils/format'
import { NEXT_STATUS, STATUS_LABEL } from '../utils/orderRules'
import { inputClass } from '../utils/styles'

// Ano ang ipapakitang confirmation
type Pending =
  | { kind: 'status'; status: OrderStatus }
  | { kind: 'deleteOrder' }
  | { kind: 'deletePayment'; payment: Payment }
  | null

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { data: order, loading, error, refetch } = useFetch<OrderDetailType>(`/orders/${id}`)
  const [pending, setPending] = useState<Pending>(null)
  const [busy, setBusy] = useState(false)

  if (loading && !order) return <LoadingState label="Loading order..." />
  if (error || !order) return <ErrorState message={error ?? 'Order not found'} onRetry={refetch} />

  // Derived values para sa mga button
  const nextStatuses = NEXT_STATUS[order.status]
  const canEdit = order.status === 'received'
  const canDelete = ['received', 'cancelled'].includes(order.status) && order.payments.length === 0
  const canPay = order.status !== 'cancelled' && order.balance > 0
  const neededMachine = order.status === 'washing' ? 'washer' : order.status === 'drying' ? 'dryer' : null
  const paidPercent = order.amountDue > 0 ? Math.min(100, (order.amountPaid / order.amountDue) * 100) : 0

  async function runPending() {
    if (!pending || !order) return
    setBusy(true)
    try {
      if (pending.kind === 'status') {
        await api.patch(`/orders/${order._id}/status`, { status: pending.status })
        showToast(`Order moved to ${STATUS_LABEL[pending.status]}`)
        refetch()
      } else if (pending.kind === 'deleteOrder') {
        await api.delete(`/orders/${order._id}`)
        showToast(`Order ${order.orderCode} deleted`)
        navigate('/orders')
      } else {
        await api.delete(`/payments/${pending.payment._id}`)
        showToast('Payment removed')
        refetch()
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  // Text ng confirmation dialog depende sa action
  const dialog =
    pending?.kind === 'status'
      ? {
          title: pending.status === 'cancelled' ? 'Cancel this order?' : `Move to ${STATUS_LABEL[pending.status]}?`,
          message:
            pending.status === 'cancelled'
              ? 'A cancelled order can no longer change status or accept payments.'
              : 'Status changes cannot be undone. Any assigned machine will be released.',
          confirmLabel: pending.status === 'cancelled' ? 'Cancel order' : 'Confirm',
        }
      : pending?.kind === 'deleteOrder'
        ? { title: 'Delete this order?', message: `${order.orderCode} will be permanently removed.`, confirmLabel: 'Delete' }
        : pending?.kind === 'deletePayment'
          ? {
              title: 'Remove this payment?',
              message: `${formatPeso(pending.payment.amount)} (${pending.payment.method}) will be removed and added back to the balance.`,
              confirmLabel: 'Remove',
            }
          : { title: '', message: '', confirmLabel: '' }

  return (
    <>
      <PageHeader
        title={order.orderCode}
        description={`Dropped off ${formatDateTime(order.createdAt)}`}
        action={
          <>
            <LinkButton to="/orders" variant="secondary">
              <ArrowLeft size={18} /> Back
            </LinkButton>
            {canEdit && (
              <LinkButton to={`/orders/${order._id}/edit`} variant="secondary">
                <Pencil size={16} /> Edit
              </LinkButton>
            )}
            {canDelete && (
              <Button variant="secondary" className="text-red-600" onClick={() => setPending({ kind: 'deleteOrder' })}>
                <Trash2 size={16} /> Delete
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        {order.isRush && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-400/15 px-2.5 py-1 text-xs font-semibold text-accent-600">
            <Zap size={12} /> Rush
          </span>
        )}
        {order.isLate && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
            <AlertTriangle size={12} /> Late
          </span>
        )}
        {order.daysUnclaimed > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
            Unclaimed for {order.daysUnclaimed} day{order.daysUnclaimed === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Status at mga susunod na hakbang */}
          <Card>
            <h2 className="mb-5 font-bold text-slate-900">Progress</h2>
            <StatusSteps status={order.status} history={order.statusHistory} />
            {nextStatuses.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                {nextStatuses.map((s) => {
                  // Bawal i-claim hangga't may balance (rule ng server)
                  const blocked = s === 'claimed' && order.balance > 0
                  return (
                    <Button
                      key={s}
                      variant={s === 'cancelled' ? 'secondary' : 'primary'}
                      className={s === 'cancelled' ? 'text-red-600' : ''}
                      disabled={blocked}
                      onClick={() => setPending({ kind: 'status', status: s })}
                    >
                      {s === 'cancelled' ? 'Cancel order' : `Mark as ${STATUS_LABEL[s]}`}
                    </Button>
                  )
                })}
                {nextStatuses.includes('claimed') && order.balance > 0 && (
                  <p className="w-full text-sm text-accent-600">Collect the remaining {formatPeso(order.balance)} before releasing.</p>
                )}
              </div>
            )}
          </Card>

          {neededMachine && <MachinePanel order={order} type={neededMachine} onAssigned={refetch} />}

          {/* Detalye ng order */}
          <Card>
            <h2 className="mb-4 font-bold text-slate-900">Order details</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Detail label="Customer">
                {order.customer ? (
                  <Link to={`/customers/${order.customer._id}`} className="font-semibold text-brand-600 hover:underline">
                    {order.customer.name}
                  </Link>
                ) : (
                  'Deleted customer'
                )}
                {order.customer && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Phone size={13} /> {order.customer.phone}
                  </span>
                )}
              </Detail>
              <Detail label="Service">
                {order.service?.name ?? 'Service removed'}
                <span className="block text-slate-500">
                  {order.quantity} {order.service?.pricingType === 'per_piece' ? 'pcs' : 'kg'}
                </span>
              </Detail>
              <Detail label="Promised pickup">{formatDateTime(order.promisedAt)}</Detail>
              <Detail label="Add-ons">{order.addOns.length ? order.addOns.map(labelize).join(', ') : 'None'}</Detail>
              {order.claimedAt && <Detail label="Claimed">{formatDateTime(order.claimedAt)}</Detail>}
              {order.notes && <Detail label="Notes">{order.notes}</Detail>}
            </dl>
          </Card>
        </div>

        {/* Bayarin */}
        <div className="space-y-6">
          <Card>
            <h2 className="font-bold text-slate-900">Billing</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Subtotal" value={formatPeso(order.subtotal)} />
              <Row label="Add-ons" value={formatPeso(order.addOnsTotal)} />
              <Row label="Rush fee" value={formatPeso(order.rushFee)} />
              <Row label="Storage fee" value={formatPeso(order.storageFee)} hint="₱20/day after 3 free days once ready" />
              <div className="border-t border-slate-100 pt-2.5">
                <Row label="Amount due" value={formatPeso(order.amountDue)} strong />
              </div>
              <Row label="Paid" value={formatPeso(order.amountPaid)} />
            </dl>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${paidPercent}%` }} />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-slate-700">Balance</span>
              <span className={`text-2xl font-extrabold ${order.balance > 0 ? 'text-accent-600' : 'text-brand-700'}`}>
                {order.status === 'cancelled' ? '—' : order.balance > 0 ? formatPeso(order.balance) : 'Fully paid'}
              </span>
            </div>
          </Card>

          {/* key: ginagawang bago ang form kapag nagbago ang balance */}
          {canPay && <PaymentForm key={order.balance} orderId={order._id} balance={order.balance} onPaid={refetch} />}

          <Card>
            <h2 className="mb-3 font-bold text-slate-900">Payments</h2>
            {order.payments.length === 0 ? (
              <p className="text-sm text-slate-500">No payments recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {order.payments.map((p) => (
                  <li key={p._id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{formatPeso(p.amount)}</p>
                      <p className="truncate text-xs text-slate-500">
                        {p.method.toUpperCase()}
                        {p.reference && ` · ${p.reference}`} · {formatDate(p.createdAt)}
                      </p>
                    </div>
                    {order.status !== 'claimed' && (
                      <Button
                        variant="ghost"
                        className="px-2.5 text-red-600 hover:bg-red-50"
                        aria-label="Remove payment"
                        onClick={() => setPending({ kind: 'deletePayment', payment: p })}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        loading={busy}
        onConfirm={runPending}
        onCancel={() => setPending(null)}
      />
    </>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{label}</dt>
      <dd className="mt-1 text-slate-800">{children}</dd>
    </div>
  )
}

function Row({ label, value, hint, strong = false }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className={strong ? 'font-bold text-slate-900' : 'text-slate-600'} title={hint}>
        {label}
      </dt>
      <dd className={strong ? 'font-bold text-slate-900' : 'font-medium text-slate-900'}>{value}</dd>
    </div>
  )
}

// Form ng bayad: ang max na pwedeng ibayad ay ang natitirang balance
function PaymentForm({ orderId, balance, onPaid }: { orderId: string; balance: number; onPaid: () => void }) {
  const { showToast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(makePaymentSchema(balance)),
    defaultValues: { amount: balance, method: 'cash', reference: '' },
  })
  const method = useWatch({ control, name: 'method' })

  async function onSubmit(values: PaymentFormValues) {
    try {
      await api.post('/payments', { order: orderId, ...values })
      showToast(`Payment of ${formatPeso(values.amount)} recorded`)
      reset()
      onPaid()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  return (
    <Card>
      <h2 className="mb-4 font-bold text-slate-900">Record payment</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Amount (₱)" error={errors.amount?.message}>
          <input
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            className={inputClass}
            aria-invalid={Boolean(errors.amount)}
          />
        </FormField>
        <FormField label="Method" error={errors.method?.message}>
          <select {...register('method')} className={inputClass}>
            <option value="cash">Cash</option>
            <option value="gcash">GCash</option>
            <option value="maya">Maya</option>
          </select>
        </FormField>
        {method !== 'cash' && (
          <FormField label="Reference number" error={errors.reference?.message}>
            <input
              {...register('reference')}
              className={inputClass}
              placeholder="e.g. 1029384756"
              aria-invalid={Boolean(errors.reference)}
            />
          </FormField>
        )}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Saving...' : 'Record payment'}
        </Button>
      </form>
    </Card>
  )
}

// Pagpili ng machine habang washing (washer) o drying (dryer)
function MachinePanel({ order, type, onAssigned }: { order: OrderDetailType; type: 'washer' | 'dryer'; onAssigned: () => void }) {
  const { showToast } = useToast()
  const { data: machines, loading, error, refetch } = useFetch<Machine[]>(`/machines?type=${type}&status=available`)
  const [selected, setSelected] = useState('')
  const [saving, setSaving] = useState(false)

  // Derived: kasya lang ang machine kung sapat ang capacity (per-kg lang)
  const isPerKg = order.service?.pricingType !== 'per_piece'
  const fits = (m: Machine) => !isPerKg || order.quantity <= m.capacityKg

  async function assign() {
    setSaving(true)
    try {
      await api.patch(`/orders/${order._id}/machine`, { machine: selected })
      showToast('Machine assigned')
      setSelected('')
      onAssigned()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
      refetch()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-1 flex items-center gap-2 font-bold text-slate-900">
        <WashingMachine size={18} className="text-brand-600" /> {type === 'washer' ? 'Washer' : 'Dryer'}
      </h2>
      {order.machine ? (
        <p className="text-sm text-slate-600">
          Running in <span className="font-bold text-slate-900">{order.machine.code}</span>. It is released automatically when the
          order moves to the next step.
        </p>
      ) : loading ? (
        <LoadingState label="Checking machines..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">
            Pick an available {type}
            {isPerKg && ` that can hold ${order.quantity} kg`}.
          </p>
          {machines && machines.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={selected} onChange={(e) => setSelected(e.target.value)} className={inputClass} aria-label={`Select ${type}`}>
                <option value="">Select a {type}</option>
                {machines.map((m) => (
                  <option key={m._id} value={m._id} disabled={!fits(m)}>
                    {m.code} · {m.capacityKg} kg{!fits(m) ? ' (too small)' : ''}
                  </option>
                ))}
              </select>
              <Button onClick={assign} disabled={!selected || saving} className="shrink-0">
                {saving ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          ) : (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No {type}s are available right now. Check the{' '}
              <Link to="/machines" className="font-semibold underline">
                machines page
              </Link>
              .
            </p>
          )}
        </>
      )}
    </Card>
  )
}
