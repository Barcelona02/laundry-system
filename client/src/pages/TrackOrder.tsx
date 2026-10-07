import { AlertTriangle, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Logo } from '../components/layout/Logo'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorState, LoadingState } from '../components/ui/States'
import { StatusSteps } from '../components/ui/StatusSteps'
import { useFetch } from '../hooks/useFetch'
import type { TrackResult } from '../types'
import { formatDateTime, formatPeso } from '../utils/format'
import { STATUS_LABEL } from '../utils/orderRules'
import { inputClass } from '../utils/styles'

// Public page: dito tinitingnan ng customer ang status ng labada nila
export default function TrackOrder() {
  const { orderCode } = useParams()
  const navigate = useNavigate()
  const [code, setCode] = useState(orderCode ?? '')
  const { data, loading, error } = useFetch<TrackResult>(orderCode ? `/track/${encodeURIComponent(orderCode)}` : null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const clean = code.trim().toUpperCase()
    if (clean) navigate(`/track/${clean}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-canvas">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link to="/">
          <Logo />
        </Link>
        <Link to="/dashboard" className="text-sm font-semibold text-brand-700 hover:underline">
          Staff dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6 pb-16">
        <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Track your laundry</h1>
        <p className="mt-2 text-center text-slate-600">Enter the order code printed on your claim slip.</p>

        <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="LND-0001"
            className={`${inputClass} uppercase`}
            aria-label="Order code"
          />
          <Button type="submit" disabled={!code.trim()} className="shrink-0">
            <Search size={18} /> Track
          </Button>
        </form>

        <div className="mt-10">
          {!orderCode ? null : loading ? (
            <LoadingState label="Looking up your order..." />
          ) : error || !data ? (
            <ErrorState message={error ?? 'Order not found'} />
          ) : (
            <div className="grid gap-6 md:grid-cols-5">
              <Card className="md:col-span-3">
                <p className="text-sm text-slate-500">Hi {data.customerFirstName}, your order</p>
                <p className="text-2xl font-bold text-slate-900">{data.orderCode}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {data.service ?? 'Laundry'} · Qty {data.quantity}
                </p>
                <p className="mt-4 inline-flex rounded-full bg-accent-100 px-3 py-1 text-sm font-semibold text-accent-700">
                  {STATUS_LABEL[data.status]}
                </p>
                {data.isLate && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-due-600">
                    <AlertTriangle size={16} /> Running behind schedule. Sorry for the wait!
                  </p>
                )}
                <div className="mt-6">
                  <StatusSteps status={data.status} history={data.statusHistory} />
                </div>
              </Card>

              <Card className="md:col-span-2">
                <h2 className="font-semibold text-slate-900">Pickup & payment</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">{data.claimedAt ? 'Claimed on' : 'Expected ready by'}</dt>
                    <dd className="font-semibold text-slate-900">{formatDateTime(data.claimedAt ?? data.promisedAt)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-3">
                    <dt className="text-slate-600">Amount due</dt>
                    <dd className="font-semibold text-slate-900">{formatPeso(data.amountDue)}</dd>
                  </div>
                  {data.storageFee > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Includes storage fee</dt>
                      <dd className="font-semibold text-due-600">{formatPeso(data.storageFee)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Paid</dt>
                    <dd className="font-semibold text-slate-900">{formatPeso(data.amountPaid)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
                    <dt className="font-bold text-slate-900">Balance</dt>
                    <dd className={`font-bold ${data.balance > 0 ? 'text-due-600' : 'text-brand-700'}`}>
                      {data.balance > 0 ? formatPeso(data.balance) : 'Fully paid'}
                    </dd>
                  </div>
                </dl>
                {data.status === 'ready' && (
                  <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-xs text-brand-800">
                    Storage is free for 3 days once ready. After that, ₱20 per day is added.
                  </p>
                )}
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
