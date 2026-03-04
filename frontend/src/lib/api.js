import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || '/api'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = {
    'Content-Type': 'application/json',
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

async function handleResponse(response) {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const message = errorBody?.error || errorBody?.message || `Request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.body = errorBody
    throw error
  }
  if (response.status === 204) {
    return null
  }
  return response.json()
}

async function fetchWithRetry(url, options, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), attempt === 0 ? 15000 : 30000)
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeout)
      return response
    } catch (err) {
      if (attempt < retries) continue
      if (err.name === 'AbortError') {
        throw new Error('O servidor está iniciando, tente novamente em alguns segundos.')
      }
      throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
    }
  }
}

export async function apiGet(path) {
  const headers = await getAuthHeaders()
  const response = await fetchWithRetry(`${API_URL}${path}`, {
    method: 'GET',
    headers,
  })
  return handleResponse(response)
}

export async function apiPost(path, body) {
  const headers = await getAuthHeaders()
  const response = await fetchWithRetry(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return handleResponse(response)
}

export async function apiPut(path, body) {
  const headers = await getAuthHeaders()
  const response = await fetchWithRetry(`${API_URL}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
  return handleResponse(response)
}

export async function apiDelete(path) {
  const headers = await getAuthHeaders()
  const response = await fetchWithRetry(`${API_URL}${path}`, {
    method: 'DELETE',
    headers,
  })
  return handleResponse(response)
}

// ── Games ──────────────────────────────────────────────────────────────────────

export function getGames() {
  return apiGet('/games')
}

export function getGame(slug) {
  return apiGet(`/games/${encodeURIComponent(slug)}`)
}

export function createGame(data) {
  return apiPost('/games', data)
}

export function updateGame(slug, data) {
  return apiPut(`/games/${encodeURIComponent(slug)}`, data)
}

export function deleteGame(slug) {
  return apiDelete(`/games/${encodeURIComponent(slug)}`)
}

// ── Tournaments ────────────────────────────────────────────────────────────────

export function getTournaments() {
  return apiGet('/tournaments')
}

export function getTournament(id) {
  return apiGet(`/tournaments/${encodeURIComponent(id)}`)
}

export function createTournament(data) {
  return apiPost('/tournaments', data)
}

export function updateTournament(id, data) {
  return apiPut(`/tournaments/${encodeURIComponent(id)}`, data)
}

export function deleteTournament(id) {
  return apiDelete(`/tournaments/${encodeURIComponent(id)}`)
}

// ── Lobbies ────────────────────────────────────────────────────────────────────

export function getLobbies() {
  return apiGet('/lobbies')
}

export function createLobby(data) {
  return apiPost('/lobbies', data)
}

export function getLobby(id) {
  return apiGet(`/lobbies/${encodeURIComponent(id)}`)
}

export function joinLobby(id) {
  return apiPost(`/lobbies/${encodeURIComponent(id)}/join`)
}

export function leaveLobby(id) {
  return apiPost(`/lobbies/${encodeURIComponent(id)}/leave`)
}

export function setReady(lobbyId) {
  return apiPost(`/lobbies/${encodeURIComponent(lobbyId)}/ready`)
}

export function startMatch(lobbyId) {
  return apiPost(`/lobbies/${encodeURIComponent(lobbyId)}/start`)
}

// ── Matches ────────────────────────────────────────────────────────────────────

export function getMatches() {
  return apiGet('/matches')
}

// ── Rankings ───────────────────────────────────────────────────────────────────

export function getRankings(gameSlug) {
  return apiGet(`/rankings/${encodeURIComponent(gameSlug)}`)
}

// ── Store ──────────────────────────────────────────────────────────────────────

export function getStoreProducts() {
  return apiGet('/store/products')
}

export function createOrder(productId, quantity) {
  return apiPost('/store/orders', { product_id: productId, quantity })
}

// ── Profiles ───────────────────────────────────────────────────────────────────

export function getProfile(userId) {
  return apiGet(`/profiles/${encodeURIComponent(userId)}`)
}

export function updateProfileApi(userId, data) {
  return apiPut(`/profiles/${encodeURIComponent(userId)}`, data)
}

export function getProfileStats(userId) {
  return apiGet(`/profiles/${encodeURIComponent(userId)}/stats`)
}

export function getProfileMatches(userId) {
  return apiGet(`/profiles/${encodeURIComponent(userId)}/matches`)
}

// ── Chat ───────────────────────────────────────────────────────────────────────

export function getChatMessages(channelType, channelId) {
  return apiGet(`/chat/${encodeURIComponent(channelType)}/${encodeURIComponent(channelId)}/messages`)
}

export function sendChatMessage(channelType, channelId, content) {
  return apiPost(`/chat/${encodeURIComponent(channelType)}/${encodeURIComponent(channelId)}/messages`, { content })
}

// ── Store Products Management ─────────────────────────────────────────────────

export function createStoreProduct(data) {
  return apiPost('/store/products', data)
}

export function updateStoreProduct(id, data) {
  return apiPut(`/store/products/${encodeURIComponent(id)}`, data)
}

export function deleteStoreProduct(id) {
  return apiDelete(`/store/products/${encodeURIComponent(id)}`)
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function getAdminUsers() {
  return apiGet('/admin/users')
}

export function updateUserRole(userId, role) {
  return apiPut(`/admin/users/${encodeURIComponent(userId)}/role`, { role })
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getPlatformStats() {
  return apiGet('/stats')
}

// ── Verify reCAPTCHA ──────────────────────────────────────────────────────────

export function verifyCaptcha(token, action) {
  return apiPost('/auth/captcha-verify', { token, action })
}

export function completeProfile(data) {
  return apiPost('/auth/complete-profile', data)
}

// ── VIP ──────────────────────────────────────────────────────────────────────

export function getVipPlans() {
  return apiGet('/vip/plans')
}

export function getVipStatus() {
  return apiGet('/vip/status')
}
