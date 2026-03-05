const CACHE_VERSION = 'v2'
const CACHE_PREFIX = `rua_cache_${CACHE_VERSION}_`

// Remove all cache entries from older versions
;(function purgeOldVersions() {
  try {
    const old = Object.keys(localStorage).filter(k => k.startsWith('rua_cache_') && !k.startsWith(CACHE_PREFIX))
    old.forEach(k => localStorage.removeItem(k))
  } catch {}
})()
const memoryCache = new Map()

export function getCache(key) {
  // Check memory first
  const mem = memoryCache.get(key)
  if (mem && Date.now() < mem.expiresAt) {
    return mem.data
  }

  // Check localStorage
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() >= parsed.expiresAt) {
      localStorage.removeItem(CACHE_PREFIX + key)
      memoryCache.delete(key)
      return null
    }
    // Restore to memory
    memoryCache.set(key, parsed)
    return parsed.data
  } catch {
    return null
  }
}

export function setCache(key, data, ttlMs = 60 * 1000) {
  const entry = { data, cachedAt: Date.now(), expiresAt: Date.now() + ttlMs }
  memoryCache.set(key, entry)
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch {
    // Storage full or unavailable
  }
}

export function getCacheAge(key) {
  const mem = memoryCache.get(key)
  if (mem && Date.now() < mem.expiresAt) {
    return Date.now() - (mem.cachedAt || 0)
  }
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() >= parsed.expiresAt) return null
    return Date.now() - (parsed.cachedAt || 0)
  } catch {
    return null
  }
}

export function clearCache(key) {
  memoryCache.delete(key)
  try {
    localStorage.removeItem(CACHE_PREFIX + key)
  } catch {}
}

export function clearAllCache() {
  memoryCache.clear()
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX))
    keys.forEach(k => localStorage.removeItem(k))
  } catch {}
}
