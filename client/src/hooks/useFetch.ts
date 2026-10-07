import { useCallback, useEffect, useState } from 'react'
import api, { getErrorMessage } from '../api/axios'

interface Result<T> {
  key: string | null
  data: T | null
  error: string | null
}

// Custom hook: kumukuha ng data sa API at nagbabalik ng data, loading, at error
export function useFetch<T>(url: string | null) {
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<Result<T>>({ key: null, data: null, error: null })

  // Bawat request ay may sariling key (url + ilang beses nang nag-refetch)
  const requestKey = url ? `${url}#${reloadKey}` : null

  useEffect(() => {
    if (!url || !requestKey) return
    // Kinakansela ang lumang request kapag nagbago ang url bago pa ito matapos
    const controller = new AbortController()

    api
      .get<T>(url, { signal: controller.signal })
      .then((res) => setResult({ key: requestKey, data: res.data, error: null }))
      .catch((err) => {
        if (controller.signal.aborted) return
        setResult((prev) => ({ key: requestKey, data: prev.data, error: getErrorMessage(err) }))
      })

    return () => controller.abort()
  }, [url, requestKey])

  // Derived: naglo-load pa kung hindi pa dumarating ang sagot para sa kasalukuyang request
  const loading = requestKey !== null && result.key !== requestKey
  const error = result.key === requestKey ? result.error : null

  // Tawagin ito para kunin ulit ang data (hal. pagkatapos mag-save)
  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  return { data: result.data, loading, error, refetch }
}
