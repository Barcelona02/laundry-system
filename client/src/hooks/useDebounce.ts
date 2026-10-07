import { useEffect, useState } from 'react'

// Hinihintay munang tumigil sa pag-type ang user bago ibalik ang bagong value
// (para hindi mag-request sa server sa bawat pindot ng key)
export function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
