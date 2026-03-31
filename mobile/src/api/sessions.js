import { API_URL, safeJson } from './client'

export async function fetchSessions(token) {
  const response = await fetch(`${API_URL}/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 401) {
    throw new Error('401')
  }

  if (!response.ok) {
    throw new Error('Impossible de recuperer les seances')
  }

  const payload = await safeJson(response)
  return payload.sessions ?? []
}

export async function createSession(token, data) {
  const response = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  const payload = await safeJson(response)
  if (!response.ok) {
    throw new Error(payload.message || 'Impossible de creer la seance')
  }
}

export async function updateSession(token, id, data) {
  const response = await fetch(`${API_URL}/sessions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  const payload = await safeJson(response)
  if (!response.ok) {
    throw new Error(payload.message || 'Impossible de modifier la seance')
  }
}

export async function deleteSession(token, id) {
  const response = await fetch(`${API_URL}/sessions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 401) {
    throw new Error('401')
  }

  if (!response.ok) {
    const payload = await safeJson(response)
    throw new Error(payload.message || 'Impossible de supprimer la seance')
  }
}
