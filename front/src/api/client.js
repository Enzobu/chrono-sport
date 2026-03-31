export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export async function safeJson(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}
