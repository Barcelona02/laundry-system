import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../api/axios'
import { Button, LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, LoadingState } from '../components/ui/States'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { customerSchema, type CustomerFormValues } from '../schemas/customerSchema'
import type { Customer } from '../types'
import { inputClass } from '../utils/styles'

const emptyValues: CustomerFormValues = { name: '', phone: '', address: '', notes: '' }

// Iisang form para sa "Add" (/customers/new) at "Edit" (/customers/:id/edit)
export default function CustomerForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showToast } = useToast()

  // Kapag edit, kunin muna ang kasalukuyang data ng customer
  const { data: customer, loading, error, refetch } = useFetch<Customer>(isEdit ? `/customers/${id}` : null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: emptyValues,
  })

  // Ilagay sa form ang data kapag dumating na
  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        phone: customer.phone,
        address: customer.address ?? '',
        notes: customer.notes ?? '',
      })
    }
  }, [customer, reset])

  async function onSubmit(values: CustomerFormValues) {
    try {
      const res = isEdit
        ? await api.put<Customer>(`/customers/${id}`, values)
        : await api.post<Customer>('/customers', values)
      showToast(isEdit ? 'Customer updated' : 'Customer added')
      navigate(`/customers/${res.data._id}`)
    } catch (err) {
      const message = getErrorMessage(err)
      // Galing sa server: duplicate na phone number
      if (message.includes('phone already exists')) {
        setError('phone', { message: 'This phone number is already registered' })
      } else {
        showToast(message, 'error')
      }
    }
  }

  if (isEdit && loading) return <LoadingState label="Loading customer..." />
  if (isEdit && error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit customer' : 'Add customer'}
        description={isEdit ? `Update the details of ${customer?.name}.` : 'Register a new customer for the shop.'}
        action={
          <LinkButton to={isEdit ? `/customers/${id}` : '/customers'} variant="secondary">
            <ArrowLeft size={18} /> Back
          </LinkButton>
        }
      />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Full name" error={errors.name?.message}>
              <input
                {...register('name')}
                className={inputClass}
                placeholder="Juan Dela Cruz"
                aria-invalid={Boolean(errors.name)}
              />
            </FormField>
            <FormField label="Mobile number" error={errors.phone?.message} hint="11 digits, starts with 09">
              <input
                {...register('phone')}
                className={inputClass}
                placeholder="09171234567"
                inputMode="numeric"
                maxLength={11}
                aria-invalid={Boolean(errors.phone)}
              />
            </FormField>
          </div>

          <FormField label="Address (optional)" error={errors.address?.message}>
            <input
              {...register('address')}
              className={inputClass}
              placeholder="Street, Barangay, City"
              aria-invalid={Boolean(errors.address)}
            />
          </FormField>

          <FormField label="Notes (optional)" error={errors.notes?.message}>
            <textarea
              {...register('notes')}
              rows={3}
              className={inputClass}
              placeholder="e.g. Prefers unscented detergent"
              aria-invalid={Boolean(errors.notes)}
            />
          </FormField>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <LinkButton to={isEdit ? `/customers/${id}` : '/customers'} variant="secondary">
              Cancel
            </LinkButton>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add customer'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
