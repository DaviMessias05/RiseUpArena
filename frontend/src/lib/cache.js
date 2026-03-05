const CACHE_PREFIX = 'rua_cache_'
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
  const entry = { data, expiresAt: Date.now() + ttlMs }
  memoryCache.set(key, entry)
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch {
    // Storage full or unavailable
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
