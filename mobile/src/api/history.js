import { API_URL } from './config'

async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
  })
  if (!response.ok) throw new Error(`API error ${response.status}`)
  return response.status === 204 ? null : response.json()
}

export async function fetchHistory(token) {
  const payload = await request('/history', token)
  return payload.history ?? []
}

export async function createHistoryEntry(token, data) {
  const payload = await request('/history', token, { method: 'POST', body: JSON.stringify(data) })
  return payload.entry
}
