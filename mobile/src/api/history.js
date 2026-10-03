import { API_URL, safeJson } from './client'

async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })
  const payload = await safeJson(response)
  if (response.status === 401) throw new Error('401')
  if (!response.ok) throw new Error(payload?.message || `API error ${response.status}`)
  return payload
}

export async function fetchHistory(token) {
  const payload = await request('/history', token)
  return payload.history ?? []
}

export async function createHistoryEntry(token, data) {
  const payload = await request('/history', token, { method: 'POST', body: JSON.stringify(data) })
  return payload.entry
}

export async function clearHistory(token) {
  await request('/history', token, { method: 'DELETE' })
}
