import { API_URL, safeJson } from './client'

export async function authRequest(mode, email, password) {
  const endpoint = mode === 'register' ? 'register' : 'login'
  const response = await fetch(`${API_URL}/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  })

  const payload = await safeJson(response)
  if (!response.ok || !payload.token) {
    throw new Error(payload.message || 'Echec de connexion')
  }

  return payload
}
