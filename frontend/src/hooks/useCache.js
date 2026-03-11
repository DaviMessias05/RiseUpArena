import { useState, useEffect, useCallback, useRef } from 'react'
import { getCache, setCache, getCacheAge, deduplicatedFetch } from '../lib/cache'

// Data younger than this won't trigger a background refetch
const FRESH_WINDOW_MS = 30 * 1000

export function useCachedData(key, fetcher, ttlMs = 5 * 60 * 1000) {
  const cached = getCache(key)
  const [data, setData] = useState(cached)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState(null)
  const fetcherRef = useRef(fetcher)
  const mountedRef = useRef(true)
  fetcherRef.current = fetcher

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

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
      // Deduplicate: if another component already started the same fetch, reuse it
      const fresh = await deduplicatedFetch(key, fetcherRef.current)
      if (!mountedRef.current) return
      setData(fresh)
      setCache(key, fresh, ttlMs)
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      if (!getCache(key)) {
        setError(err)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [key, ttlMs])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => fetchData(true), [fetchData])

  return { data, loading, error, refetch }
}
