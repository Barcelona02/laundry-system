import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useFetch } from '../hooks/useFetch'
import type { Payment, PaymentMethod, SalesReport as SalesReportType } from '../types'
import { formatPeso } from '../utils/format'

const RANGES = [7, 14, 30] as const
const METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'gcash', label: 'GCash' },
  { key: 'maya', label: 'Maya' },
]

const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })

export default function SalesReport() {
  const [days, setDays] = useState<number>(7)
  const salesReq = useFetch<SalesReportType>(`/stats/sales?days=${days}`)
  const paymentsReq = useFetch<Payment[]>('/payments')
  const [hovered, setHovered] = useState<string | null>(null)

  const report = salesReq.data

  // Derived values mula sa series
  const series = report?.series ?? []
  const max = Math.max(1, ...series.map((d) => d.total))
  const daysWithSales = series.filter((d) => d.total > 0)
  const best = daysWithSales.reduce<(typeof series)[number] | null>((top, d) => (!top || d.total > top.total ? d : top), null)
  const average = series.length ? (report?.total ?? 0) / series.length : 0
  const paymentCount = series.reduce((sum, d) => sum + d.payments, 0)

  // Derived: hati ng benta ayon sa paraan ng bayad, sa parehong date range
  const firstDay = series[0]?.date
  const inRange = (paymentsReq.data ?? []).filter((p) => {
    if (!firstDay) return false
    const manilaDate = new Date(new Date(p.createdAt).getTime() + 8 * 3600000).toISOString().slice(0, 10)
    return manilaDate >= firstDay
  })
  const byMethod = METHODS.map((m) => ({
    ...m,
    total: inRange.filter((p) => p.method === m.key).reduce((sum, p) => sum + p.amount, 0),
  }))
  const methodTotal = byMethod.reduce((sum, m) => sum + m.total, 0)

  return (
    <>
      <PageHeader
        title="Sales Report"
        description="Payments collected per day, in Philippine time."
        action={
          <div className="inline-flex rounded-xl bg-white p-1 shadow-card">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDays(r)}
                aria-pressed={days === r}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                  days === r ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {r} days
              </button>
            ))}
          </div>
        }
      />

      {salesReq.loading && !report ? (
        <LoadingState label="Loading sales..." />
      ) : salesReq.error || !report ? (
        <ErrorState message={salesReq.error ?? 'No data'} onRetry={salesReq.refetch} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
            <StatCard label={`Total (${days} days)`} value={formatPeso(report.total)} hint={`${paymentCount} payments`} />
            <StatCard label="Daily average" value={formatPeso(average)} />
            <StatCard label="Best day" value={best ? formatPeso(best.total) : '—'} hint={best ? shortDate(best.date) : 'No sales yet'} />
            <StatCard label="Days with sales" value={`${daysWithSales.length} / ${days}`} />
          </div>

          <Card className="mt-6">
            <h2 className="font-bold text-slate-900">Daily sales</h2>
            <p className="text-sm text-slate-500">Hover or tap a bar to see the exact amount.</p>
            {report.total === 0 ? (
              <div className="mt-4">
                <EmptyState title="No sales in this period" description="Payments will show up here once recorded." />
              </div>
            ) : (
              <div className="mt-6">
                <div className="relative flex h-56 items-end gap-0.5 border-b border-slate-200 sm:gap-1" role="img" aria-label="Bar chart of daily sales">
                  {series.map((d) => {
                    const active = hovered === d.date
                    return (
                      <button
                        key={d.date}
                        type="button"
                        className="group relative flex h-full flex-1 items-end justify-center"
                        onMouseEnter={() => setHovered(d.date)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(d.date)}
                        onBlur={() => setHovered(null)}
                        onClick={() => setHovered(active ? null : d.date)}
                        aria-label={`${shortDate(d.date)}: ${formatPeso(d.total)}`}
                      >
                        <span
                          className={`block w-full max-w-10 rounded-t-[4px] ${active ? 'bg-brand-700' : 'bg-brand-500'}`}
                          style={{ height: `${(d.total / max) * 100}%`, minHeight: d.total > 0 ? 3 : 0 }}
                        />
                        {active && (
                          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg">
                            <span className="block font-semibold">{formatPeso(d.total)}</span>
                            <span className="text-slate-300">
                              {shortDate(d.date)} · {d.payments} payment{d.payments === 1 ? '' : 's'}
                            </span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>{shortDate(series[0].date)}</span>
                  <span>{shortDate(series[series.length - 1].date)}</span>
                </div>
              </div>
            )}
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card>
              <h2 className="mb-4 font-bold text-slate-900">By payment method</h2>
              {paymentsReq.loading && !paymentsReq.data ? (
                <LoadingState />
              ) : paymentsReq.error ? (
                <ErrorState message={paymentsReq.error} onRetry={paymentsReq.refetch} />
              ) : (
                <ul className="space-y-4">
                  {byMethod.map((m) => (
                    <li key={m.key}>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{m.label}</span>
                        <span className="font-semibold text-slate-900">
                          {formatPeso(m.total)}{' '}
                          <span className="font-normal text-slate-400">
                            ({methodTotal ? Math.round((m.total / methodTotal) * 100) : 0}%)
                          </span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${methodTotal ? (m.total / methodTotal) * 100 : 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Table view ng parehong data */}
            <Card className="overflow-hidden p-0 sm:p-0 lg:col-span-2">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 text-right">Payments</th>
                      <th className="px-5 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...series].reverse().map((d) => (
                      <tr key={d.date}>
                        <td className="px-5 py-2.5 text-slate-700">{shortDate(d.date)}</td>
                        <td className="px-5 py-2.5 text-right text-slate-600">{d.payments}</td>
                        <td className={`px-5 py-2.5 text-right font-semibold ${d.total ? 'text-slate-900' : 'text-slate-400'}`}>
                          {formatPeso(d.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
