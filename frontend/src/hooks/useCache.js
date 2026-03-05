import { useState, useEffect, useCallback, useRef } from 'react'
import { getCache, setCache } from '../lib/cache'

export function useCachedData(key, fetcher, ttlMs = 5 * 60 * 1000) {
  const cached = getCache(key)
  const [data, setData] = useState(cached)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const fetchData = useCallback(async (ignoreCache = false) => {
    if (!ignoreCache) {
      const c = getCache(key)
      if (c) {
        setData(c)
        setLoading(false)
      }
    }

    try {
      const fresh = await fetcherRef.current()
      setData(fresh)
      setCache(key, fresh, ttlMs)
      setError(null)
    } catch (err) {
      // Only set error if we have no cached data
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
