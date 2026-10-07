// Pag-format ng pera at petsa para pare-pareho sa lahat ng page

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

export const formatPeso = (n: number) => peso.format(n)

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

// "extra_rinse" -> "Extra rinse"
export const labelize = (s: string) => {
  const text = s.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
