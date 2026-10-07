import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api, { getErrorMessage } from '../api/axios'
import { Button, LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { ADD_ON_PRICES, ADD_ONS, orderSchema, RUSH_RATE, type OrderFormValues } from '../schemas/orderSchema'
import type { Customer, Order, OrderDetail, Service } from '../types'
import { formatPeso, labelize } from '../utils/format'
import { inputClass } from '../utils/styles'

const round2 = (n: number) => Math.round(n * 100) / 100

// Iisang form para sa "New order" (/orders/new) at "Edit order" (/orders/:id/edit)
export default function OrderForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const customersReq = useFetch<Customer[]>('/customers')
  const servicesReq = useFetch<Service[]>('/services?active=true')
  const orderReq = useFetch<OrderDetail>(isEdit ? `/orders/${id}` : null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer: searchParams.get('customer') ?? '',
      service: '',
      quantity: 1,
      addOns: [],
      isRush: false,
      notes: '',
    },
  })

  // Kapag edit, ilagay sa form ang kasalukuyang laman ng order
  useEffect(() => {
    const o = orderReq.data
    if (o) {
      reset({
        customer: o.customer?._id ?? '',
        service: o.service?._id ?? '',
        quantity: o.quantity,
        addOns: o.addOns,
        isRush: o.isRush,
        notes: o.notes ?? '',
      })
    }
  }, [orderReq.data, reset])

  // Binabantayan ang mga field para sa live na price preview
  const [serviceId, quantity, addOns, isRush] = useWatch({ control, name: ['service', 'quantity', 'addOns', 'isRush'] })
  const services = servicesReq.data ?? []
  const selectedService = services.find((s) => s._id === serviceId)

  // Derived: presyo, kinukuwenta sa bawat render gamit ang parehong formula ng server
  const qty = Number.isFinite(quantity) ? quantity : 0
  const base = selectedService ? selectedService.price * qty : 0
  const subtotal = selectedService ? round2(Math.max(base, selectedService.minimumCharge)) : 0
  const addOnsTotal = (addOns ?? []).reduce((sum, a) => sum + ADD_ON_PRICES[a], 0)
  const rushFee = isRush ? round2(subtotal * RUSH_RATE) : 0
  const total = round2(subtotal + addOnsTotal + rushFee)
  const minimumApplied = selectedService ? base < selectedService.minimumCharge : false
  const turnaroundHours = selectedService ? (isRush ? Math.ceil(selectedService.turnaroundHours / 2) : selectedService.turnaroundHours) : 0
  const unit = selectedService?.pricingType === 'per_piece' ? 'pcs' : 'kg'

  async function onSubmit(values: OrderFormValues) {
    // Per-piece na service: buong numero lang ang pwede
    if (selectedService?.pricingType === 'per_piece' && !Number.isInteger(values.quantity)) {
      setError('quantity', { message: `${selectedService.name} is priced per piece, so use a whole number` })
      return
    }
    try {
      const res = isEdit ? await api.put<Order>(`/orders/${id}`, values) : await api.post<Order>('/orders', values)
      showToast(isEdit ? `Order ${res.data.orderCode} updated` : `Order ${res.data.orderCode} created`)
      navigate(`/orders/${res.data._id}`)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  const backTo = isEdit ? `/orders/${id}` : '/orders'
  const reqs = [customersReq, servicesReq, ...(isEdit ? [orderReq] : [])]
  const failed = reqs.find((r) => r.error)

  if (reqs.some((r) => r.loading)) return <LoadingState label="Loading form..." />
  if (failed) return <ErrorState message={failed.error!} onRetry={failed.refetch} />
  if (isEdit && orderReq.data && orderReq.data.status !== 'received') {
    return (
      <ErrorState message={`Order ${orderReq.data.orderCode} is already ${orderReq.data.status}. Only received orders can be edited.`} />
    )
  }
  if (customersReq.data?.length === 0) {
    return (
      <EmptyState
        title="Add a customer first"
        description="Every order belongs to a customer."
        action={<LinkButton to="/customers/new">Add customer</LinkButton>}
      />
    )
  }

  return (
    <>
      <PageHeader
        title={isEdit ? `Edit ${orderReq.data?.orderCode}` : 'New order'}
        description={isEdit ? 'Changes recompute the price and pickup time.' : 'Log a drop-off. The price updates as you fill in the details.'}
        action={
          <LinkButton to={backTo} variant="secondary">
            <ArrowLeft size={18} /> Back
          </LinkButton>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-5 lg:col-span-2">
          <FormField label="Customer" error={errors.customer?.message}>
            <select {...register('customer')} className={inputClass} aria-invalid={Boolean(errors.customer)}>
              <option value="">Select a customer</option>
              {customersReq.data?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
            <FormField label="Service" error={errors.service?.message}>
              <select {...register('service')} className={inputClass} aria-invalid={Boolean(errors.service)}>
                <option value="">Select a service</option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} · {formatPeso(s.price)}/{s.pricingType === 'per_kg' ? 'kg' : 'pc'}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={`Quantity (${unit})`} error={errors.quantity?.message}>
              <input
                type="number"
                step={unit === 'pcs' ? 1 : 0.5}
                min={0.5}
                {...register('quantity', { valueAsNumber: true })}
                className={inputClass}
                aria-invalid={Boolean(errors.quantity)}
              />
            </FormField>
          </div>

          {selectedService?.description && (
            <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">{selectedService.description}</p>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-700">Add-ons</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ADD_ONS.map((a) => (
                <label
                  key={a}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm has-checked:border-brand-500 has-checked:bg-brand-50"
                >
                  <span className="flex items-center gap-3">
                    <input type="checkbox" value={a} {...register('addOns')} className="size-4 accent-brand-600" />
                    {labelize(a)}
                  </span>
                  <span className="text-slate-500">+{formatPeso(ADD_ON_PRICES[a])}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 has-checked:border-accent-500 has-checked:bg-accent-400/10">
            <span className="flex items-center gap-3">
              <input type="checkbox" {...register('isRush')} className="size-4 accent-accent-500" />
              <span>
                <span className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                  <Zap size={15} className="text-accent-500" /> Rush service
                </span>
                <span className="block text-xs text-slate-500">Half the turnaround time for +50% of the subtotal</span>
              </span>
            </span>
          </label>

          <FormField label="Notes (optional)" error={errors.notes?.message}>
            <textarea {...register('notes')} rows={3} className={inputClass} placeholder="e.g. Separate the white shirts" />
          </FormField>
        </Card>

        {/* Live na computation ng presyo */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <h2 className="font-bold text-slate-900">Price summary</h2>
            {selectedService ? (
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">
                    {qty || 0} {unit} × {formatPeso(selectedService.price)}
                  </dt>
                  <dd className="font-medium text-slate-900">{formatPeso(subtotal)}</dd>
                </div>
                {minimumApplied && (
                  <p className="text-xs text-slate-500">Minimum charge of {formatPeso(selectedService.minimumCharge)} applied</p>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">Add-ons</dt>
                  <dd className="font-medium text-slate-900">{formatPeso(addOnsTotal)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600">Rush fee</dt>
                  <dd className="font-medium text-slate-900">{formatPeso(rushFee)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-slate-100 pt-3 text-base">
                  <dt className="font-bold text-slate-900">Total</dt>
                  <dd className="font-extrabold text-brand-700">{formatPeso(total)}</dd>
                </div>
                <p className="pt-1 text-xs text-slate-500">
                  Ready in about {turnaroundHours} hours
                </p>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Pick a service to see the price.</p>
            )}
            <Button type="submit" disabled={isSubmitting} className="mt-5 w-full">
              {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create order'}
            </Button>
          </Card>
        </div>
      </form>
    </>
  )
}
