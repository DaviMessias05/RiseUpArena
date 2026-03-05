import { useState, useEffect, useCallback, useRef } from 'react'
import { getCache, setCache, getCacheAge } from '../lib/cache'

// Data younger than this won't trigger a background refetch
const FRESH_WINDOW_MS = 30 * 1000

export function useCachedData(key, fetcher, ttlMs = 5 * 60 * 1000) {
  const cached = getCache(key)
  const [data, setData] = useState(cached)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const fetchData = useCallback(async (force = false) => {
    if (!force) {
      const c = getCache(key)
      if (c) {
        setData(c)
        setLoading(false)
        // Skip network request if cache is still fresh
        const age = getCacheAge(key)
        if (age !== null && age < FRESH_WINDOW_MS) return
      }
    }

    try {
      const fresh = await fetcherRef.current()
      setData(fresh)
      setCache(key, fresh, ttlMs)
      setError(null)
    } catch (err) {
      if (!getCache(key)) {
        setError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [key, ttlMs])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => fetchData(true), [fetchData])

  return { data, loading, error, refetch }
}
