import { Pencil, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../api/axios'
import { Button, LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useDebounce } from '../hooks/useDebounce'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import type { Customer } from '../types'
import { formatDate } from '../utils/format'
import { inputClass } from '../utils/styles'

export default function CustomersList() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const url = debouncedSearch ? `/customers?search=${encodeURIComponent(debouncedSearch)}` : '/customers'
  const { data: customers, loading, error, refetch } = useFetch<Customer[]>(url)

  const { showToast } = useToast()
  const [toDelete, setToDelete] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/customers/${toDelete._id}`)
      showToast(`${toDelete.name} was deleted`)
      refetch()
    } catch (err) {
      // hal. "Cannot delete customer with 3 order(s) on record"
      showToast(getErrorMessage(err), 'error')
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who has dropped off laundry at the shop."
        action={
          <LinkButton to="/customers/new">
            <Plus size={18} /> Add customer
          </LinkButton>
        }
      />

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className={`${inputClass} pl-10`}
        />
      </div>

      {loading && !customers ? (
        <LoadingState label="Loading customers..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !customers || customers.length === 0 ? (
        <EmptyState
          title={search ? 'No customers match your search' : 'No customers yet'}
          description={search ? 'Try a different name or phone number.' : 'Add your first customer to get started.'}
          action={!search && <LinkButton to="/customers/new">Add customer</LinkButton>}
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            Showing {customers.length} customer{customers.length === 1 ? '' : 's'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {customers.map((c) => (
              <Card key={c._id} className="flex flex-col">
                <Link to={`/customers/${c._id}`} className="group flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-slate-900 group-hover:text-brand-600">{c.name}</span>
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <Phone size={13} /> {c.phone}
                    </span>
                  </span>
                </Link>
                <p className="mt-3 line-clamp-2 text-sm text-slate-500">{c.address || 'No address on file'}</p>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">Since {formatDate(c.createdAt)}</span>
                  <div className="flex gap-1">
                    <LinkButton to={`/customers/${c._id}/edit`} variant="ghost" className="px-2.5" aria-label={`Edit ${c.name}`}>
                      <Pencil size={16} />
                    </LinkButton>
                    <Button
                      variant="ghost"
                      className="px-2.5 text-red-600 hover:bg-red-50"
                      onClick={() => setToDelete(c)}
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete customer?"
        message={`This will permanently remove ${toDelete?.name ?? 'this customer'}. Customers with existing orders cannot be deleted.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
