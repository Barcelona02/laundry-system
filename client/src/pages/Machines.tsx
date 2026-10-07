import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2, Wind, WashingMachine, Wrench } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../api/axios'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FormField } from '../components/ui/FormField'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { machineSchema, type MachineFormValues } from '../schemas/machineSchema'
import type { Machine, MachineAvailability, MachineStatus, MachineType, MachineTypeSummary } from '../types'
import { inputClass } from '../utils/styles'

const STATUS_STYLE: Record<MachineStatus, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-emerald-50 text-emerald-700' },
  in_use: { label: 'In use', className: 'bg-brand-100 text-brand-700' },
  maintenance: { label: 'Maintenance', className: 'bg-amber-50 text-amber-700' },
}

type Filter = 'all' | MachineType

export default function Machines() {
  const machinesReq = useFetch<Machine[]>('/machines')
  const availabilityReq = useFetch<MachineAvailability>('/machines/availability')
  const { showToast } = useToast()

  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<Machine | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<Machine | null>(null)
  const [deleting, setDeleting] = useState(false)

  function reloadAll() {
    machinesReq.refetch()
    availabilityReq.refetch()
  }

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/machines/${toDelete._id}`)
      showToast(`${toDelete.code} deleted`)
      reloadAll()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  // Derived: sinala ayon sa napiling tab
  const machines = machinesReq.data ?? []
  const visible = filter === 'all' ? machines : machines.filter((m) => m.type === filter)

  return (
    <>
      <PageHeader
        title="Machines"
        description="Washers and dryers, their capacity, and what they are running."
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus size={18} /> Add machine
          </Button>
        }
      />

      {availabilityReq.loading && !availabilityReq.data ? (
        <LoadingState label="Checking availability..." />
      ) : availabilityReq.error ? (
        <ErrorState message={availabilityReq.error} onRetry={availabilityReq.refetch} />
      ) : (
        availabilityReq.data && (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <SummaryCard title="Washers" icon={WashingMachine} summary={availabilityReq.data.washer} />
            <SummaryCard title="Dryers" icon={Wind} summary={availabilityReq.data.dryer} />
            <Card>
              <p className="text-sm font-medium text-slate-500">Utilization</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{availabilityReq.data.utilizationRate}%</p>
              <div className="mt-3 h-2.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${availabilityReq.data.utilizationRate}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">Share of working machines currently in use</p>
            </Card>
          </div>
        )
      )}

      <div className="mb-4 inline-flex rounded-2xl bg-white p-1 shadow-card" role="tablist">
        {(['all', 'washer', 'dryer'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
              filter === f ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f === 'all' ? 'All' : `${f}s`}
          </button>
        ))}
      </div>

      {machinesReq.loading && !machinesReq.data ? (
        <LoadingState label="Loading machines..." />
      ) : machinesReq.error ? (
        <ErrorState message={machinesReq.error} onRetry={machinesReq.refetch} />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No machines here"
          description="Add a washer or dryer to start assigning loads."
          action={<Button onClick={() => setEditing('new')}>Add machine</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => {
            const Icon = m.type === 'washer' ? WashingMachine : Wind
            const status = STATUS_STYLE[m.status]
            return (
              <Card key={m._id} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                      <Icon size={22} />
                    </span>
                    <span>
                      <span className="block text-lg font-bold text-slate-900">{m.code}</span>
                      <span className="text-sm text-slate-500 capitalize">
                        {m.type} · {m.capacityKg} kg
                      </span>
                    </span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                </div>
                <div className="mt-4 min-h-10 text-sm text-slate-600">
                  {m.currentOrder ? (
                    <>
                      Running{' '}
                      <Link to={`/orders/${m.currentOrder._id}`} className="font-semibold text-brand-600 hover:underline">
                        {m.currentOrder.orderCode}
                      </Link>
                    </>
                  ) : m.status === 'maintenance' ? (
                    <span className="flex items-center gap-1.5">
                      <Wrench size={14} /> Out of service
                    </span>
                  ) : (
                    'Ready for the next load'
                  )}
                </div>
                <div className="mt-auto flex justify-end gap-1 border-t border-slate-100 pt-3">
                  <Button variant="ghost" className="px-2.5" onClick={() => setEditing(m)} aria-label={`Edit ${m.code}`}>
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-2.5 text-due-600 hover:bg-due-50"
                    onClick={() => setToDelete(m)}
                    disabled={m.status === 'in_use'}
                    aria-label={`Delete ${m.code}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {editing && (
        <MachineFormDialog
          machine={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reloadAll()
          }}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={`Delete ${toDelete?.code ?? 'machine'}?`}
        message="This machine will be permanently removed from the shop."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}

function SummaryCard({ title, icon: Icon, summary }: { title: string; icon: typeof Wind; summary: MachineTypeSummary }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <Icon size={18} className="text-brand-600" />
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">
        {summary.available}
        <span className="text-base font-semibold text-slate-400"> / {summary.total} free</span>
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {summary.inUse} in use · {summary.maintenance} maintenance · {summary.availableCapacityKg} kg free capacity
      </p>
    </Card>
  )
}

// Modal form para sa add at edit ng machine
function MachineFormDialog({ machine, onClose, onSaved }: { machine: Machine | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast()
  const inUse = machine?.status === 'in_use'
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MachineFormValues>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      code: machine?.code ?? '',
      type: machine?.type ?? 'washer',
      capacityKg: machine?.capacityKg ?? 8,
      status: machine?.status === 'maintenance' ? 'maintenance' : 'available',
    },
  })

  async function onSubmit(values: MachineFormValues) {
    // Habang ginagamit, bawal galawin ang status (rule ng server)
    const payload = inUse ? { code: values.code, type: values.type, capacityKg: values.capacityKg } : values
    try {
      if (machine) await api.put(`/machines/${machine._id}`, payload)
      else await api.post('/machines', payload)
      showToast(machine ? `${values.code} updated` : `${values.code} added`)
      onSaved()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">{machine ? `Edit ${machine.code}` : 'Add machine'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type" error={errors.type?.message}>
              <select {...register('type')} className={inputClass} disabled={inUse}>
                <option value="washer">Washer</option>
                <option value="dryer">Dryer</option>
              </select>
            </FormField>
            <FormField label="Code" error={errors.code?.message}>
              <input {...register('code')} className={`${inputClass} uppercase`} placeholder="W-05" aria-invalid={Boolean(errors.code)} />
            </FormField>
          </div>
          <FormField label="Capacity (kg)" error={errors.capacityKg?.message}>
            <input
              type="number"
              {...register('capacityKg', { valueAsNumber: true })}
              className={inputClass}
              aria-invalid={Boolean(errors.capacityKg)}
            />
          </FormField>
          <FormField label="Status" error={errors.status?.message} hint={inUse ? 'Status changes automatically while running an order' : undefined}>
            <select {...register('status')} className={inputClass} disabled={inUse}>
              <option value="available">Available</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </FormField>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : machine ? 'Save changes' : 'Add machine'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
